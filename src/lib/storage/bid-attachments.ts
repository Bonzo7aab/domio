import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const BID_ATTACHMENTS_BUCKET = 'bid-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

export interface BidUploadResult {
  url: string;
  path: string;
  type: 'image' | 'document';
}

export async function uploadBidAttachment(
  supabase: SupabaseClient<Database>,
  file: File,
  userId: string,
  tenderId: string,
): Promise<{ data: BidUploadResult | null; error: Error | null }> {
  try {
    const fileType = file.type.toLowerCase();
    const normalizedAllowed = ALLOWED_TYPES.map((t) => t.toLowerCase());
    const isValid =
      normalizedAllowed.includes(fileType) ||
      (fileType === 'image/jpeg' && normalizedAllowed.includes('image/jpg'));

    if (!isValid) {
      return {
        data: null,
        error: new Error('Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WEBP, PDF, DOC, DOCX'),
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: new Error('Plik jest zbyt duży. Maksymalny rozmiar: 10MB'),
      };
    }

    const isImage = ALLOWED_IMAGE_TYPES.some(
      (type) => fileType.includes(type.split('/')[1]) || fileType === type,
    );
    const attachmentType: 'image' | 'document' = isImage ? 'image' : 'document';

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/tenders/${tenderId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BID_ATTACHMENTS_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    const { data: signed } = await supabase.storage
      .from(BID_ATTACHMENTS_BUCKET)
      .createSignedUrl(filePath, 3600);

    return {
      data: {
        path: filePath,
        url: signed?.signedUrl ?? filePath,
        type: attachmentType,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export async function getBidAttachmentSignedUrl(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { createSignedUrlSafe } = await import('./signed-url');
  return createSignedUrlSafe(supabase, path, expiresIn);
}
