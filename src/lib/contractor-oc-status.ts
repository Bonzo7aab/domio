export type OcState = 'missing' | 'no-date' | 'expired' | 'expiring' | 'valid';

export interface OcSnapshot {
  state: OcState;
  validUntilLabel: string | null;
  daysLeft: number | null;
}

const OC_EXPIRING_THRESHOLD_DAYS = 30;

/**
 * Classifies contractor OC policy for UI (account notice, card badge).
 */
export function classifyOcForUser(
  ocValidUntil: string | null,
  hasOcScan: boolean,
): OcSnapshot {
  if (!hasOcScan) {
    return { state: 'missing', validUntilLabel: null, daysLeft: null };
  }
  if (!ocValidUntil) {
    return { state: 'no-date', validUntilLabel: null, daysLeft: null };
  }
  const validUntilMs = Date.parse(ocValidUntil);
  if (!Number.isFinite(validUntilMs)) {
    return { state: 'no-date', validUntilLabel: ocValidUntil, daysLeft: null };
  }
  const validUntilLabel = new Date(validUntilMs).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const daysLeft = Math.ceil((validUntilMs - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return { state: 'expired', validUntilLabel, daysLeft };
  if (daysLeft <= OC_EXPIRING_THRESHOLD_DAYS) {
    return { state: 'expiring', validUntilLabel, daysLeft };
  }
  return { state: 'valid', validUntilLabel, daysLeft };
}
