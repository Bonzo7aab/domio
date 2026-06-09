/** Contractor verification documents tab on account settings. */
export const CONTRACTOR_VERIFICATION_DOCUMENTS_PATH = '/konto?tab=documents';

export function contractorVerificationDocumentsHref(
  params?: Record<string, string>,
): string {
  const search = new URLSearchParams({ tab: 'documents', ...params });
  return `/konto?${search.toString()}`;
}
