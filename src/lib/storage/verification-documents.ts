'use server';

import { STORAGE_BUCKETS } from './buckets';
import { requireAuthenticatedUser } from './auth';
import { normalizeStorageObjectPath } from './path-utils';
import { deleteObject, uploadObject } from './r2/operations';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

export interface UploadResult {
  url: string;
  path: string;
  type: 'image' | 'document';
}

export async function uploadVerificationDocument(
  file: File,
  userId: string,
  documentType: string,
): Promise<{ data: UploadResult | null; error: Error | null }> {
  try {
    await requireAuthenticatedUser(userId);

    const fileType = file.type.toLowerCase();
    const normalizedAllowedTypes = ALLOWED_TYPES.map((t) => t.toLowerCase());
    const isValidType =
      normalizedAllowedTypes.includes(fileType) ||
      (fileType === 'image/jpeg' && normalizedAllowedTypes.includes('image/jpg'));

    if (!isValidType) {
      return {
        data: null,
        error: new Error('Nieprawidłowy typ pliku. Dozwolone: PDF, JPG, PNG'),
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
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.${fileExt}`;
    const filePath = `${userId}/verification/${documentType}/${fileName}`;

    await uploadObject(STORAGE_BUCKETS.VERIFICATION_DOCUMENTS, filePath, file);

    return {
      data: {
        url: filePath,
        path: filePath,
        type: attachmentType,
      },
      error: null,
    };
  } catch (err) {
    console.error('Error in uploadVerificationDocument:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export async function uploadVerificationDocuments(
  files: Array<{ file: File; documentType: string }>,
  userId: string,
): Promise<{ data: UploadResult[]; errors: unknown[] }> {
  const results: UploadResult[] = [];
  const errors: unknown[] = [];

  for (const { file, documentType } of files) {
    const { data, error } = await uploadVerificationDocument(file, userId, documentType);
    if (error || !data) {
      errors.push({ file: file.name, documentType, error });
    } else {
      results.push(data);
    }
  }

  return { data: results, errors };
}

export async function deleteVerificationDocument(
  filePath: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const path = normalizeStorageObjectPath(filePath, STORAGE_BUCKETS.VERIFICATION_DOCUMENTS);
    const userId = path.split('/')[0];
    await requireAuthenticatedUser(userId);
    await deleteObject(STORAGE_BUCKETS.VERIFICATION_DOCUMENTS, path);
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deleteVerificationDocument:', err);
    return { success: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
