import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export function isStorageObjectNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as { message?: string; statusCode?: string | number };
  const message = record.message?.toLowerCase() ?? '';
  return (
    message.includes('object not found') ||
    message.includes('not found') ||
    record.statusCode === '404' ||
    record.statusCode === 404
  );
}

/** Strips bucket name or public URL prefix so only the object key remains. */
export function normalizeStorageObjectPath(path: string, bucket: string): string {
  const trimmed = path.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith('http')) {
    const marker = `/storage/v1/object/`;
    const publicMarker = `${marker}public/${bucket}/`;
    const signedMarker = `${marker}sign/${bucket}/`;
    const authMarker = `${marker}authenticated/${bucket}/`;
    for (const prefix of [publicMarker, signedMarker, authMarker, `${marker}${bucket}/`]) {
      if (trimmed.includes(prefix)) {
        return trimmed.split(prefix)[1]?.split('?')[0] ?? trimmed;
      }
    }
    const generic = `${bucket}/`;
    if (trimmed.includes(generic)) {
      return trimmed.split(generic)[1]?.split('?')[0] ?? trimmed;
    }
  }

  if (trimmed.startsWith(`${bucket}/`)) {
    return trimmed.slice(bucket.length + 1);
  }

  return trimmed;
}

export function resolveStorageBucket(path: string): 'verification-documents' | 'bid-attachments' {
  const normalized = path.replace(/^\/+/, '');
  if (normalized.includes('/tenders/')) {
    return 'bid-attachments';
  }
  return 'verification-documents';
}

export async function createSignedUrlSafe(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const bucket = resolveStorageBucket(path);
  const objectPath = normalizeStorageObjectPath(path, bucket);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresIn);

  if (error) {
    if (!isStorageObjectNotFound(error)) {
      console.warn('[storage] createSignedUrl failed', {
        bucket,
        objectPath,
        message: (error as { message?: string }).message,
      });
    }
    return null;
  }

  return data?.signedUrl ?? null;
}
