import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const JOB_ATTACHMENTS_BUCKET = 'job-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

export interface UploadResult {
  url: string;
  path: string;
  type: 'image' | 'document';
}

/**
 * Upload a job attachment to Supabase storage
 * @param supabase - Supabase client
 * @param file - File to upload
 * @param userId - User ID
 * @param jobId - Job ID (optional, use 'draft' for files uploaded before job creation)
 */
export async function uploadJobAttachment(
  supabase: SupabaseClient<Database>,
  file: File,
  userId: string,
  jobId?: string
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
        error: { message: 'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX' }
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: { message: 'Plik jest zbyt duży. Maksymalny rozmiar: 10MB' }
      };
    }

    // Determine file type category
    const isImage = ALLOWED_IMAGE_TYPES.some(type => 
      fileType.includes(type.split('/')[1]) || fileType === type
    );
    const attachmentType: 'image' | 'document' = isImage ? 'image' : 'document';

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.${fileExt}`;
    
    // Use 'draft' folder if no jobId provided, otherwise use jobId
    const jobFolder = jobId || 'draft';
    const filePath = `${userId}/jobs/${jobFolder}/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(JOB_ATTACHMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading job attachment:', uploadError);
      return {
        data: null,
        error: uploadError
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(JOB_ATTACHMENTS_BUCKET)
      .getPublicUrl(filePath);

    return {
      data: {
        url: urlData.publicUrl,
        path: filePath,
        type: attachmentType
      },
      error: null
    };
  } catch (err) {
    console.error('Error in uploadJobAttachment:', err);
    return {
      data: null,
      error: err
    };
  }
}

/**
 * Upload multiple job attachments
 */
export async function uploadJobAttachments(
  supabase: SupabaseClient<Database>,
  files: File[],
  userId: string,
  jobId?: string
): Promise<{ data: UploadResult[]; errors: any[] }> {
  const results: UploadResult[] = [];
  const errors: any[] = [];

  for (const file of files) {
    const { data, error } = await uploadJobAttachment(supabase, file, userId, jobId);
    if (error || !data) {
      errors.push({ file: file.name, error });
    } else {
      results.push(data);
    }
  }

  return { data: results, errors };
}

/**
 * Delete a job attachment from Supabase storage
 */
export async function deleteJobAttachment(
  supabase: SupabaseClient<Database>,
  imagePath: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Extract path from URL if full URL is provided
    let path = imagePath;
    
    // If it's a full URL, extract the path
    if (imagePath.startsWith('http')) {
      // Extract path from URL like: https://...supabase.co/storage/v1/object/public/job-attachments/userId/jobs/jobId/file.jpg
      const urlParts = imagePath.split(`${JOB_ATTACHMENTS_BUCKET}/`);
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0]; // Remove query params
      }
    } else if (imagePath.includes(JOB_ATTACHMENTS_BUCKET)) {
      // If it contains bucket name but not full URL
      const urlParts = imagePath.split(`${JOB_ATTACHMENTS_BUCKET}/`);
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0];
      }
    }
    // Otherwise, assume it's already a path

    const { error } = await supabase.storage
      .from(JOB_ATTACHMENTS_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Error deleting job attachment:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deleteJobAttachment:', err);
    return { success: false, error: err };
  }
}

/**
 * Delete multiple job attachments
 */
export async function deleteJobAttachments(
  supabase: SupabaseClient<Database>,
  paths: string[]
): Promise<{ success: boolean; errors: any[] }> {
  const errors: any[] = [];
  
  for (const path of paths) {
    const { error } = await deleteJobAttachment(supabase, path);
    if (error) {
      errors.push({ path, error });
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}

