/**
 * Re-exports for backward compatibility. Do not import `next/headers` here —
 * this file must stay safe when pulled into client bundles via type-only paths.
 */
export type { VerificationState, VerificationStatus } from '../verification/types';
export { getUserVerificationStatus } from './verification-queries';
