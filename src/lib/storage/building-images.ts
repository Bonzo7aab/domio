import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const BUILDING_IMAGES_BUCKET = 'building-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload a building image to Supabase storage
 */
export async function uploadBuildingImage(
  supabase: SupabaseClient<Database>,
  file: File,
  buildingId: string,
  userId: string
): Promise<{ data: UploadResult | null; error: any }> {
  try {
    // Validate file type
    const fileType = file.type.toLowerCase();
    const normalizedAllowedTypes = ALLOWED_TYPES.map(t => t.toLowerCase());
    const isValidType = normalizedAllowedTypes.includes(fileType) || 
                       (fileType === 'image/jpeg' && normalizedAllowedTypes.includes('image/jpg'));
    
    if (!isValidType) {
      return {
        data: null,
        error: { message: 'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WEBP' }
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: { message: 'Plik jest zbyt duży. Maksymalny rozmiar: 5MB' }
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${buildingId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUILDING_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return {
        data: null,
        error: uploadError
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUILDING_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    return {
      data: {
        url: urlData.publicUrl,
        path: filePath
      },
      error: null
    };
  } catch (err) {
    console.error('Error in uploadBuildingImage:', err);
    return {
      data: null,
      error: err
    };
  }
}

/**
 * Delete a building image from Supabase storage
 */
export async function deleteBuildingImage(
  supabase: SupabaseClient<Database>,
  imagePath: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Extract path from URL if full URL is provided
    let path = imagePath;
    
    // If it's a full URL, extract the path
    if (imagePath.startsWith('http')) {
      // Extract path from URL like: https://...supabase.co/storage/v1/object/public/building-images/userId/buildingId/file.jpg
      const urlParts = imagePath.split(`${BUILDING_IMAGES_BUCKET}/`);
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0]; // Remove query params
      }
    } else if (imagePath.includes(BUILDING_IMAGES_BUCKET)) {
      // If it contains bucket name but not full URL
      const urlParts = imagePath.split(`${BUILDING_IMAGES_BUCKET}/`);
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0];
      }
    }
    // Otherwise, assume it's already a path

    const { error } = await supabase.storage
      .from(BUILDING_IMAGES_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deleteBuildingImage:', err);
    return { success: false, error: err };
  }
}

/**
 * Upload multiple building images
 */
export async function uploadBuildingImages(
  supabase: SupabaseClient<Database>,
  files: File[],
  buildingId: string,
  userId: string
): Promise<{ data: UploadResult[]; errors: any[] }> {
  const results: UploadResult[] = [];
  const errors: any[] = [];

  for (const file of files) {
    const { data, error } = await uploadBuildingImage(supabase, file, buildingId, userId);
    if (error || !data) {
      errors.push({ file: file.name, error });
    } else {
      results.push(data);
    }
  }

  return { data: results, errors };
}

