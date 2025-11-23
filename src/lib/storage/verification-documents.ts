import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

const VERIFICATION_DOCUMENTS_BUCKET = 'verification-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

export interface UploadResult {
  url: string;
  path: string;
  type: 'image' | 'document';
}

/**
 * Upload a verification document to Supabase storage
 * @param supabase - Supabase client
 * @param file - File to upload
 * @param userId - User ID
 * @param documentType - Type of document (e.g., 'company_registration', 'insurance', etc.)
 */
export async function uploadVerificationDocument(
  supabase: SupabaseClient<Database>,
  file: File,
  userId: string,
  documentType: string
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
        error: { message: 'Nieprawidłowy typ pliku. Dozwolone: PDF, JPG, PNG' }
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
    
    // File path structure: {userId}/verification/{documentType}/{filename}
    const filePath = `${userId}/verification/${documentType}/${fileName}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading verification document:', uploadError);
      return {
        data: null,
        error: uploadError
      };
    }

    // Get public URL (even if bucket is private, we can generate signed URLs if needed)
    const { data: urlData } = supabase.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
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
    console.error('Error in uploadVerificationDocument:', err);
    return {
      data: null,
      error: err
    };
  }
}

/**
 * Upload multiple verification documents
 */
export async function uploadVerificationDocuments(
  supabase: SupabaseClient<Database>,
  files: Array<{ file: File; documentType: string }>,
  userId: string
): Promise<{ data: UploadResult[]; errors: any[] }> {
  const results: UploadResult[] = [];
  const errors: any[] = [];

  for (const { file, documentType } of files) {
    const { data, error } = await uploadVerificationDocument(supabase, file, userId, documentType);
    if (error || !data) {
      errors.push({ file: file.name, documentType, error });
    } else {
      results.push(data);
    }
  }

  return { data: results, errors };
}

/**
 * Delete a verification document from Supabase storage
 */
export async function deleteVerificationDocument(
  supabase: SupabaseClient<Database>,
  filePath: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Extract path from URL if full URL is provided
    let path = filePath;
    
    // If it's a full URL, extract the path
    if (filePath.startsWith('http')) {
      // Extract path from URL like: https://...supabase.co/storage/v1/object/public/verification-documents/userId/verification/documentType/file.pdf
      const urlParts = filePath.split(`${VERIFICATION_DOCUMENTS_BUCKET}/`);
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0]; // Remove query params
      }
    } else if (filePath.includes(VERIFICATION_DOCUMENTS_BUCKET)) {
      // If it contains bucket name but not full URL
      const urlParts = filePath.split(`${VERIFICATION_DOCUMENTS_BUCKET}/`);
      if (urlParts.length > 1) {
        path = urlParts[1].split('?')[0];
      }
    }
    // Otherwise, assume it's already a path

    const { error } = await supabase.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Error deleting verification document:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deleteVerificationDocument:', err);
    return { success: false, error: err };
  }
}

