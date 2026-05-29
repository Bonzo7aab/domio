'use server';

import { createSignedUrlSafe as createR2SignedUrl } from './r2/operations';

export async function createSignedUrlSafe(path: string, expiresIn = 3600): Promise<string | null> {
  return createR2SignedUrl(path, expiresIn);
}
