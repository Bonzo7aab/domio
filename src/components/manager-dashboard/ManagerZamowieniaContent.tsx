'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, MessagesSquare, PanelTopOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { ManagerOrderRow } from '../../lib/database/manager-orders';
import {
  canManagerAcceptWork,
  canMessageOnOrder,
  canCancelOrder,
} from '../../lib/order-workflow-status';
import {
  acceptOrderWorkAction,
  cancelOrderAction,
} from '../../app/panel-zarzadcy/zamowienia/actions';
import { ManagerOrderDetailDialog } from './ManagerOrderDetailDialog';
import { OrderStatusBadge } from './OrderStatusBadge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface ManagerZamowieniaContentProps {
  orders: ManagerOrderRow[];
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

export function ManagerZamowieniaContent({
  orders: initialOrders,
}: ManagerZamowieniaContentProps): ReactElement {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [detailOrder, setDetailOrder] = useState<ManagerOrderRow | null>(null);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const openDetails = (row: ManagerOrderRow): void => {
    setDetailOrder(row);
    setDetailOpen(true);
  };

  const handleMessage = async (row: ManagerOrderRow) => {
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
        row.contractorId,
        true,
      );

      if (result.data) {
        router.push(`/wiadomosci?conversation=${result.data}`);
      } else {
        router.push(
          `/wiadomosci?recipient=${row.contractorId}&jobId=${row.tenderId}`,
        );
      }
    } catch {
      toast.error('Nie udało się otworzyć wiadomości');
    }
  };

  const handleAcceptWork = async (orderId: string) => {
    setPendingId(orderId);
    const result = await acceptOrderWorkAction(orderId);
    setPendingId(null);

    if (result.success) {
      toast.success('Prace odebrane — zamówienie zakończone');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'completed' } : o,
        ),
      );
      setDetailOrder((prev) =>
        prev?.id === orderId ? { ...prev, status: 'completed' } : prev,
      );
      router.refresh();
    } else {
      toast.error(result.error || 'Nie udało się odebrać prac');
    }
  };

  const handleCancel = async () => {
    if (!detailOrder) return;
    setPendingId(detailOrder.id);
    const result = await cancelOrderAction(detailOrder.id, cancelReason);
    setPendingId(null);

    if (result.success) {
      toast.success('Zamówienie przerwane');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === detailOrder.id ? { ...o, status: 'cancelled' } : o,
        ),
      );
      setDetailOrder((prev) =>
        prev?.id === detailOrder.id ? { ...prev, status: 'cancelled' } : prev,
      );
      setCancelDialogOpen(false);
      setCancelReason('');
      setDetailOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Nie udało się przerwać zamówienia');
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
            Brak zamówień. Zamówienie powstaje po wyborze oferty w konkursie.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zamówienie</TableHead>
                  <TableHead>Wykonawca</TableHead>
                  <TableHead className="text-right">Koszt brutto</TableHead>
                  <TableHead>Termin wykonania</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {row.locationLabel}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.contractorCompanyName}</div>
                      <div className="text-sm text-muted-foreground">
                        {row.contractorContactName}
                        {row.contractorContactPhone
                          ? `: ${row.contractorContactPhone}`
                          : ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoneyPl(row.grossAmount)}
                    </TableCell>
                    <TableCell>{formatDeadline(row.completionDeadline)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={row.status} audience="manager" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canManagerAcceptWork(row.status) ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    disabled={pendingId === row.id}
                                    onClick={() => handleAcceptWork(row.id)}
                                    aria-label="Odbierz prace"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Odbierz prace</TooltipContent>
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
                                ? 'Wiadomość do wykonawcy'
                                : 'Wiadomość niedostępna'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => openDetails(row)}
                                  aria-label="Szczegóły zamówienia"
                                >
                                  <PanelTopOpen className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Szczegóły zamówienia</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ManagerOrderDetailDialog
        order={detailOrder}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailOrder(null);
        }}
        showCancelAction={detailOrder ? canCancelOrder(detailOrder.status) : false}
        onRequestCancel={() => setCancelDialogOpen(true)}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Przerwać zamówienie?</AlertDialogTitle>
            <AlertDialogDescription>
              Czat zostanie zablokowany. Podaj powód — informacja zostanie zapisana w
              systemie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="cancel-reason">Powód</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Opisz powód przerwania…"
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
              disabled={!cancelReason.trim() || pendingId === detailOrder?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Przerwij zamówienie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
