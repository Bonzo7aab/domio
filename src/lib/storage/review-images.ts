import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const REVIEW_IMAGES_BUCKET = 'job-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function uploadReviewImage(
  supabase: SupabaseClient<Database>,
  file: File,
  userId: string,
  reviewId: string,
): Promise<{ url: string | null; error: Error | null }> {
  const fileType = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
    return { url: null, error: new Error('Dozwolone formaty: JPG, PNG, WEBP') };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { url: null, error: new Error('Maksymalny rozmiar pliku: 10 MB') };
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${userId}/reviews/${reviewId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(REVIEW_IMAGES_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  const { data: urlData } = supabase.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(filePath);
  return { url: urlData.publicUrl, error: null };
}
