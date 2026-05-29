#!/usr/bin/env tsx

/**
 * Copy objects from Supabase Storage to Cloudflare R2 (same bucket names and keys).
 *
 * Prerequisites (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY
 *   CLOUDFLARE_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *
 * Usage:
 *   npx tsx scripts/migrate-supabase-storage-to-r2.ts --dry-run
 *   npx tsx scripts/migrate-supabase-storage-to-r2.ts
 *   npx tsx scripts/migrate-supabase-storage-to-r2.ts --bucket=job-attachments
 *   npx tsx scripts/migrate-supabase-storage-to-r2.ts --skip-existing --limit=20
 *
 * Notes:
 * - DB rows that store object keys (not full Supabase URLs) do not need updates after migration.
 * - Rows with embedded Supabase public URLs must be rewritten separately if any exist.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createAdminClient } from '../src/lib/supabase/admin';
import { STORAGE_BUCKETS, type StorageBucket } from '../src/lib/storage/buckets';

config({ path: resolve(process.cwd(), '.env.local') });
config();

const ALL_BUCKETS: StorageBucket[] = [
  STORAGE_BUCKETS.JOB_ATTACHMENTS,
  STORAGE_BUCKETS.BUILDING_IMAGES,
  STORAGE_BUCKETS.BID_ATTACHMENTS,
  STORAGE_BUCKETS.VERIFICATION_DOCUMENTS,
];

interface CliOptions {
  dryRun: boolean;
  skipExisting: boolean;
  bucket?: StorageBucket;
  limit?: number;
}

interface ListedObject {
  path: string;
  size?: number;
  mimeType?: string;
}

interface BucketStats {
  listed: number;
  copied: number;
  skipped: number;
  failed: number;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    skipExisting: false,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--skip-existing') {
      options.skipExisting = true;
      continue;
    }
    if (arg.startsWith('--bucket=')) {
      const bucket = arg.slice('--bucket='.length).trim() as StorageBucket;
      if (!ALL_BUCKETS.includes(bucket)) {
        throw new Error(`Unknown bucket "${bucket}". Expected one of: ${ALL_BUCKETS.join(', ')}`);
      }
      options.bucket = bucket;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const limit = Number.parseInt(arg.slice('--limit='.length), 10);
      if (!Number.isFinite(limit) || limit <= 0) {
        throw new Error('--limit must be a positive integer');
      }
      options.limit = limit;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npx tsx scripts/migrate-supabase-storage-to-r2.ts [options]

Options:
  --dry-run           List objects only; do not copy to R2
  --skip-existing     Skip objects that already exist in R2 (HeadObject)
  --bucket=<name>     Migrate a single bucket
  --limit=<n>         Stop after copying n objects (for testing)
  --help, -h          Show this help
`);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createR2Client(): S3Client {
  const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
}

function guessContentType(path: string, fallback?: string): string {
  if (fallback?.trim()) return fallback;
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return map[ext] ?? 'application/octet-stream';
}

async function listSupabaseObjects(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  prefix = '',
): Promise<ListedObject[]> {
  const results: ListedObject[] = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw new Error(`Failed to list "${bucket}/${prefix || ''}": ${error.message}`);
    }

    if (!data?.length) {
      break;
    }

    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

      // Supabase represents folders as entries without a stable file id.
      if (!item.id) {
        const nested = await listSupabaseObjects(supabase, bucket, itemPath);
        results.push(...nested);
        continue;
      }

      const metadata = item.metadata as { mimetype?: string; size?: number } | undefined;
      results.push({
        path: itemPath,
        size: metadata?.size ?? item.metadata?.size,
        mimeType: metadata?.mimetype,
      });
    }

    if (data.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  return results;
}

async function objectExistsInR2(r2: S3Client, bucket: StorageBucket, key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    const record = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (record.name === 'NotFound' || record.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

async function copyObject(
  supabase: SupabaseClient,
  r2: S3Client,
  bucket: StorageBucket,
  objectPath: string,
  mimeType?: string,
): Promise<void> {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error || !data) {
    throw new Error(error?.message ?? 'Download returned no data');
  }

  const body = Buffer.from(await data.arrayBuffer());
  const contentType = guessContentType(objectPath, mimeType ?? data.type);

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectPath,
      Body: body,
      ContentType: contentType,
      CacheControl: 'max-age=3600',
    }),
  );
}

async function validateSupabaseAccess(
  supabase: SupabaseClient,
  bucket: StorageBucket,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).list('', { limit: 1 });
  if (error) {
    throw new Error(
      `Supabase Storage access failed for bucket "${bucket}": ${error.message}. ` +
        'Ensure SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is set in .env.local.',
    );
  }
}

function formatBytes(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return '?';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function migrateBucket(
  supabase: SupabaseClient,
  r2: S3Client,
  bucket: StorageBucket,
  options: CliOptions,
  globalCopied: { count: number },
): Promise<BucketStats> {
  const stats: BucketStats = { listed: 0, copied: 0, skipped: 0, failed: 0 };

  console.log(`\n📦 Bucket: ${bucket}`);
  const objects = await listSupabaseObjects(supabase, bucket);
  stats.listed = objects.length;
  console.log(`   Found ${objects.length} object(s) in Supabase`);

  if (objects.length === 0) {
    return stats;
  }

  for (const object of objects) {
    if (options.limit != null && globalCopied.count >= options.limit) {
      console.log(`   Reached global --limit=${options.limit}, stopping.`);
      break;
    }

    const label = `   ${object.path} (${formatBytes(object.size)})`;

    if (options.dryRun) {
      console.log(`${label} → would copy`);
      continue;
    }

    try {
      if (options.skipExisting && (await objectExistsInR2(r2, bucket, object.path))) {
        stats.skipped += 1;
        console.log(`${label} → skipped (already in R2)`);
        continue;
      }

      await copyObject(supabase, r2, bucket, object.path, object.mimeType);
      stats.copied += 1;
      globalCopied.count += 1;
      console.log(`${label} → copied`);
    } catch (error) {
      stats.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${label} → FAILED: ${message}`);
    }
  }

  return stats;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const buckets = options.bucket ? [options.bucket] : ALL_BUCKETS;

  console.log('🚚 Supabase Storage → Cloudflare R2 migration');
  console.log(`   Mode: ${options.dryRun ? 'DRY RUN (no writes)' : 'COPY'}`);
  if (options.skipExisting) console.log('   Skip existing objects in R2: yes');
  if (options.limit != null) console.log(`   Global copy limit: ${options.limit}`);
  console.log(`   Buckets: ${buckets.join(', ')}`);

  if (!options.dryRun) {
    requireEnv('CLOUDFLARE_ACCOUNT_ID');
    requireEnv('R2_ACCESS_KEY_ID');
    requireEnv('R2_SECRET_ACCESS_KEY');
  }

  const supabase = createAdminClient();
  await validateSupabaseAccess(supabase, buckets[0]);
  const r2 = options.dryRun ? null : createR2Client();
  const globalCopied = { count: 0 };

  const totals: BucketStats = { listed: 0, copied: 0, skipped: 0, failed: 0 };

  for (const bucket of buckets) {
    const stats = await migrateBucket(supabase, r2 as S3Client, bucket, options, globalCopied);
    totals.listed += stats.listed;
    totals.copied += stats.copied;
    totals.skipped += stats.skipped;
    totals.failed += stats.failed;

    if (options.limit != null && globalCopied.count >= options.limit) {
      break;
    }
  }

  console.log('\n📊 Summary');
  console.log(`   Listed:  ${totals.listed}`);
  if (!options.dryRun) {
    console.log(`   Copied:  ${totals.copied}`);
    console.log(`   Skipped: ${totals.skipped}`);
    console.log(`   Failed:  ${totals.failed}`);
  }

  if (totals.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
