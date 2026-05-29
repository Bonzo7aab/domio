/** Shared constants for contractor verification document uploads. */
export const OC_POLICY_ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'] as const;

export const OC_POLICY_ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export const OC_POLICY_MAX_BYTES = 10 * 1024 * 1024;
export const OC_POLICY_SIGNED_URL_TTL_SEC = 3600;

export function getOcPolicyAllowedFormatsLabel(): string {
  return 'PDF, JPG, JPEG, PNG, WEBP';
}
