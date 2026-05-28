/**
 * OPD-63: Zamówienie status workflow (post-contest execution).
 */

export const ORDER_STATUSES = [
  'in_progress',
  'awaiting_acceptance',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const MANAGER_LABELS: Record<OrderStatus, string> = {
  in_progress: 'W trakcie realizacji',
  awaiting_acceptance: 'Oczekuje na odbiór',
  completed: 'Zakończone',
  cancelled: 'Przerwane / anulowane',
};

const CONTRACTOR_LABELS: Record<OrderStatus, string> = {
  in_progress: 'W trakcie realizacji',
  awaiting_acceptance: 'Oczekiwanie na odbiór',
  completed: 'Zakończone',
  cancelled: 'Przerwane / anulowane',
};

export function getOrderStatusLabel(
  status: string,
  audience: 'manager' | 'contractor' = 'manager',
): string {
  const s = status as OrderStatus;
  const labels = audience === 'contractor' ? CONTRACTOR_LABELS : MANAGER_LABELS;
  return labels[s] ?? status;
}

export function canContractorReportForAcceptance(status: string): boolean {
  return status === 'in_progress';
}

export function canManagerAcceptWork(status: string): boolean {
  return status === 'awaiting_acceptance';
}

export function canMessageOnOrder(status: string): boolean {
  return status === 'in_progress' || status === 'awaiting_acceptance';
}

export function canCancelOrder(status: string): boolean {
  return status === 'in_progress' || status === 'awaiting_acceptance';
}

export function isOrderTerminal(status: string): boolean {
  return status === 'completed' || status === 'cancelled';
}

export type OrderStatusBadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'outline';

export function getOrderStatusBadgeVariant(status: string): OrderStatusBadgeVariant {
  switch (status) {
    case 'in_progress':
      return 'default';
    case 'awaiting_acceptance':
      return 'secondary';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}
