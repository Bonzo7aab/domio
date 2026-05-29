'use server';

import { STORAGE_BUCKETS } from './buckets';
import { requireAuthenticatedUser } from './auth';
import { normalizeStorageObjectPath } from './path-utils';
import { getStoragePublicUrl } from './public-url';
import { deleteObject, uploadObject } from './r2/operations';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadBuildingImage(
  file: File,
  buildingId: string,
  userId: string,
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
        error: new Error('Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, WEBP'),
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: new Error('Plik jest zbyt duży. Maksymalny rozmiar: 5MB'),
      };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${buildingId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    await uploadObject(STORAGE_BUCKETS.BUILDING_IMAGES, filePath, file);

    return {
      data: {
        url: getStoragePublicUrl(STORAGE_BUCKETS.BUILDING_IMAGES, filePath),
        path: filePath,
      },
      error: null,
    };
  } catch (err) {
    console.error('Error in uploadBuildingImage:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

export async function deleteBuildingImage(
  imagePath: string,
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const path = normalizeStorageObjectPath(imagePath, STORAGE_BUCKETS.BUILDING_IMAGES);
    const userId = path.split('/')[0];
    await requireAuthenticatedUser(userId);
    await deleteObject(STORAGE_BUCKETS.BUILDING_IMAGES, path);
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deleteBuildingImage:', err);
    return { success: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function uploadBuildingImages(
  files: File[],
  buildingId: string,
  userId: string,
): Promise<{ data: UploadResult[]; errors: unknown[] }> {
  const results: UploadResult[] = [];
  const errors: unknown[] = [];

  for (const file of files) {
    const { data, error } = await uploadBuildingImage(file, buildingId, userId);
    if (error || !data) {
      errors.push({ file: file.name, error });
    } else {
      results.push(data);
    }
  }

  return { data: results, errors };
}
