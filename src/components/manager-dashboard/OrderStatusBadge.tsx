import type { ReactElement } from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import {
  getOrderStatusBadgeVariant,
  getOrderStatusLabel,
} from '../../lib/order-workflow-status';

interface OrderStatusBadgeProps {
  status: string;
  audience?: 'manager' | 'contractor';
}

export function OrderStatusBadge({
  status,
  audience = 'manager',
}: OrderStatusBadgeProps): ReactElement {
  const label = getOrderStatusLabel(status, audience);
  const variant = getOrderStatusBadgeVariant(status);
  const mappedVariant =
    variant === 'success' || variant === 'destructive' ? 'outline' : variant;

  return (
    <Badge
      variant={mappedVariant}
      className={cn(
        'font-normal whitespace-nowrap',
        variant === 'success' && 'border-green-600 text-green-700',
        variant === 'destructive' && 'text-destructive border-destructive/40',
      )}
    >
      {label}
    </Badge>
  );
}
