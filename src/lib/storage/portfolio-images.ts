import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const PORTFOLIO_IMAGES_BUCKET = 'job-attachments'; // Reuse job-attachments bucket
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadResult {
  url: string;
  path: string;
  fileId: string;
}

/**
 * Upload a portfolio image to Supabase storage and create file_uploads record
 */
export async function uploadPortfolioImage(
  supabase: SupabaseClient<Database>,
  file: File,
  userId: string,
  projectId: string
): Promise<{ data: UploadResult | null; error: any }> {
  try {
    // Validate file type
    const fileType = file.type.toLowerCase();
    const normalizedAllowedTypes = ALLOWED_IMAGE_TYPES.map(t => t.toLowerCase());
    const isValidType = normalizedAllowedTypes.includes(fileType) || 
                       (fileType === 'image/jpeg' && normalizedAllowedTypes.includes('image/jpg'));
    
    if (!isValidType) {
      return {
        data: null,
        error: { message: 'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WEBP, GIF' }
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: { message: 'Plik jest zbyt duży. Maksymalny rozmiar: 10MB' }
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.${fileExt}`;
    const filePath = `${userId}/portfolio/${projectId}/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PORTFOLIO_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading portfolio image:', uploadError);
      return {
        data: null,
        error: uploadError
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PORTFOLIO_IMAGES_BUCKET)
      .getPublicUrl(filePath);

    // Create file_uploads record
    const { data: fileUploadData, error: fileUploadError } = await supabase
      .from('file_uploads')
      .insert({
        user_id: userId,
        file_name: fileName,
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        file_type: 'portfolio',
        entity_type: 'portfolio_project',
        entity_id: projectId,
        is_public: true,
      })
      .select('id')
      .single();

    if (fileUploadError) {
      console.error('Error creating file_uploads record:', fileUploadError);
      // Try to clean up uploaded file
      await supabase.storage.from(PORTFOLIO_IMAGES_BUCKET).remove([filePath]);
      return {
        data: null,
        error: fileUploadError
      };
    }

    return {
      data: {
        url: urlData.publicUrl,
        path: filePath,
        fileId: fileUploadData.id
      },
      error: null
    };
  } catch (err) {
    console.error('Error in uploadPortfolioImage:', err);
    return {
      data: null,
      error: err
    };
  }
}

/**
 * Upload multiple portfolio images
 */
export async function uploadPortfolioImages(
  supabase: SupabaseClient<Database>,
  files: File[],
  userId: string,
  projectId: string
): Promise<{ data: UploadResult[]; errors: any[] }> {
  const results: UploadResult[] = [];
  const errors: any[] = [];

  for (const file of files) {
    const { data, error } = await uploadPortfolioImage(supabase, file, userId, projectId);
    if (error || !data) {
      errors.push({ file: file.name, error });
    } else {
      results.push(data);
    }
  }

  return { data: results, errors };
}

/**
 * Delete a portfolio image from Supabase storage and file_uploads
 */
export async function deletePortfolioImage(
  supabase: SupabaseClient<Database>,
  fileUploadId: string,
  imagePath: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Extract path from URL if full URL is provided
    let path = imagePath;
    
    if (imagePath.startsWith('http')) {
      const urlParts = imagePath.split(`${PORTFOLIO_IMAGES_BUCKET}/`);
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0];
      }
    } else if (imagePath.includes(PORTFOLIO_IMAGES_BUCKET)) {
      const urlParts = imagePath.split(`${PORTFOLIO_IMAGES_BUCKET}/`);
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0];
      }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(PORTFOLIO_IMAGES_BUCKET)
      .remove([path]);

    if (storageError) {
      console.error('Error deleting portfolio image from storage:', storageError);
      // Continue to try deleting file_uploads record
    }

    // Delete file_uploads record (portfolio_project_images will be deleted via CASCADE)
    const { error: fileUploadError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileUploadId);

    if (fileUploadError) {
      console.error('Error deleting file_uploads record:', fileUploadError);
      return { success: false, error: fileUploadError };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deletePortfolioImage:', err);
    return { success: false, error: err };
  }
}

