/** Contractor verification documents tab on account settings. */
export const CONTRACTOR_VERIFICATION_DOCUMENTS_PATH = '/account?tab=documents';

export function contractorVerificationDocumentsHref(
  params?: Record<string, string>,
): string {
  const search = new URLSearchParams({ tab: 'documents', ...params });
  return `/account?${search.toString()}`;
}
