'use client';

import { useState, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, MessagesSquare } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { toast } from 'sonner';
import type { ContractorOrderRow } from '../../lib/database/contractor-orders';
import {
  canContractorReportForAcceptance,
  canMessageOnOrder,
} from '../../lib/order-workflow-status';
import { reportOrderForAcceptanceAction } from '../../app/contractor-dashboard/zamowienia/actions';
import { OrderStatusBadge } from '../manager-dashboard/OrderStatusBadge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface ContractorZamowieniaContentProps {
  orders: ContractorOrderRow[];
}

function formatMoneyPl(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDeadline(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ContractorZamowieniaContent({
  orders: initialOrders,
}: ContractorZamowieniaContentProps): ReactElement {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleMessage = async (row: ContractorOrderRow) => {
    if (!canMessageOnOrder(row.status)) {
      toast.error('Wiadomości są zablokowane dla tego zamówienia');
      return;
    }

    try {
      const { createClient } = await import('../../lib/supabase/client');
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Wymagane logowanie');
        return;
      }

      const { findConversationByJob } = await import('../../lib/database/messaging');
      const result = await findConversationByJob(
        supabase,
        row.tenderId,
        user.id,
        row.managerId,
        true,
      );

      if (result.data) {
        router.push(`/messages?conversation=${result.data}`);
      } else {
        router.push(`/messages?recipient=${row.managerId}&jobId=${row.tenderId}`);
      }
    } catch {
      toast.error('Nie udało się otworzyć wiadomości');
    }
  };

  const handleReport = async (orderId: string) => {
    setPendingId(orderId);
    const result = await reportOrderForAcceptanceAction(orderId);
    setPendingId(null);

    if (result.success) {
      toast.success('Zgłoszono do odbioru');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'awaiting_acceptance' } : o,
        ),
      );
      router.refresh();
    } else {
      toast.error(result.error || 'Nie udało się zgłosić do odbioru');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Zamówienia</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Realizacja wybranych ofert po rozstrzygnięciu konkursu
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Brak zamówień. Zamówienie pojawi się po wyborze Twojej oferty przez zarządcę.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zamówienie</TableHead>
                  <TableHead>Adres i kontakt</TableHead>
                  <TableHead className="text-right">Wynagrodzenie</TableHead>
                  <TableHead>Termin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((row) => {
                  const canReport = canContractorReportForAcceptance(row.status);

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.title}</div>
                        <div className="text-sm text-muted-foreground italic">
                          {row.investorName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{row.locationLabel}</div>
                        <div className="text-sm text-muted-foreground">
                          {row.workContactName}
                          {row.workContactPhone ? ` (${row.workContactPhone})` : ''}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {formatMoneyPl(row.netAmount)}
                        </div>
                        <div className="font-medium">
                          {formatMoneyPl(row.grossAmount)}
                          <span className="text-xs text-muted-foreground font-normal ml-1">
                            ({row.vatLabel})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDeadline(row.completionDeadline)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={row.status} audience="contractor" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {row.status === 'cancelled' ? null : canReport ||
                            row.status === 'awaiting_acceptance' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button
                                      type="button"
                                      variant={canReport ? 'default' : 'outline'}
                                      size="icon"
                                      className="h-8 w-8 shrink-0"
                                      disabled={
                                        !canReport ||
                                        pendingId === row.id ||
                                        row.status === 'awaiting_acceptance'
                                      }
                                      onClick={() => handleReport(row.id)}
                                      aria-label="Zgłoś do odbioru"
                                    >
                                      <Bell className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {canReport
                                    ? 'Zgłoś do odbioru'
                                    : 'Oczekuje na odbiór przez zarządcę'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    disabled={!canMessageOnOrder(row.status)}
                                    onClick={() => handleMessage(row)}
                                    aria-label="Wiadomość"
                                  >
                                    <MessagesSquare className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {canMessageOnOrder(row.status)
                                  ? 'Wiadomość do zarządcy'
                                  : 'Wiadomość niedostępna'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
