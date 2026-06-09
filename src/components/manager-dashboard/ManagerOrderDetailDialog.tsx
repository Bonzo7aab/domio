'use client';

import { useEffect, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import { fetchTenderById } from '../../lib/database/jobs';
import type { ManagerOrderRow } from '../../lib/database/manager-orders';
import {
  isContestTender,
  mapTenderRowToContestDisplay,
} from '../../lib/tender-contest/map-tender-contest-display';
import { ManagerContestDetailSections } from './ManagerContestDetailSections';
import { SelectedOfferPanel } from './SelectedOfferPanel';
import { OrderStatusBadge } from './OrderStatusBadge';
import { ContestStatusBadge } from './ContestStatusBadge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { TenderWithCompany } from '../../lib/database/jobs';

interface ManagerOrderDetailDialogProps {
  order: ManagerOrderRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCancel?: () => void;
  showCancelAction?: boolean;
}

function formatMoneyPl(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function vatLabel(rate: string): string {
  if (rate === 'zw') return 'ZW';
  if (rate === '8') return '8%';
  return '23%';
}

export function ManagerOrderDetailDialog({
  order,
  open,
  onOpenChange,
  onRequestCancel,
  showCancelAction = false,
}: ManagerOrderDetailDialogProps): ReactElement {
  const [loading, setLoading] = useState(false);
  const [tender, setTender] = useState<TenderWithCompany | null>(null);

  useEffect(() => {
    if (!open || !order) {
      setTender(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const run = async (): Promise<void> => {
      const supabase = createClient();
      try {
        const { data, error } = await fetchTenderById(supabase, order.tenderId);
        if (cancelled) return;
        if (error || !data) {
          toast.error('Nie udało się wczytać danych konkursu');
          setTender(null);
          return;
        }
        if (!isContestTender(data)) {
          toast.error('Powiązane zgłoszenie nie jest konkursem ofert');
          setTender(null);
          return;
        }
        setTender(data);
      } catch {
        if (!cancelled) toast.error('Błąd podczas ładowania szczegółów');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, order?.tenderId]);

  const contestInfo =
    tender && isContestTender(tender) ? mapTenderRowToContestDisplay(tender) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Szczegóły zamówienia</DialogTitle>
          <DialogDescription>
            {order?.title ?? 'Zamówienie powiązane z rozstrzygniętym konkursem'}
          </DialogDescription>
        </DialogHeader>

        {!order ? (
          <p className="text-center text-muted-foreground py-6">Brak danych.</p>
        ) : loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
            Ładowanie…
          </div>
        ) : (
          <>
          <Tabs defaultValue="order" className="text-sm">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="order">Zamówienie</TabsTrigger>
              <TabsTrigger value="contest">Konkurs</TabsTrigger>
              <TabsTrigger value="contractor">Wykonawca</TabsTrigger>
            </TabsList>

            <TabsContent value="order" className="space-y-4 mt-0">
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} audience="manager" />
              </div>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Dane zamówienia</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Tytuł: </span>
                    <strong>{order.title}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lokalizacja: </span>
                    {order.locationLabel}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kwota netto: </span>
                    <strong>{formatMoneyPl(order.netAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">VAT: </span>
                    {vatLabel(order.vatRate)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kwota brutto: </span>
                    <strong>{formatMoneyPl(order.grossAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Termin wykonania: </span>
                    {formatDate(order.completionDeadline)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Utworzono: </span>
                    {formatDateTime(order.createdAt)}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/panel-zarzadcy/konkursy?podglad=${order.tenderId}`}>
                    Podgląd konkursu
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/panel-zarzadcy/konkursy/porownaj/${order.tenderId}`}>
                    Porównanie ofert
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="contest" className="space-y-4 mt-0">
              {tender && contestInfo ? (
                <>
                  <div>
                    <h2 className="text-lg font-bold pr-4">{tender.title}</h2>
                    <div className="mt-2">
                      <ContestStatusBadge status={tender.status} />
                    </div>
                  </div>
                  <ManagerContestDetailSections tender={tender} contestInfo={contestInfo} />
                </>
              ) : (
                <p className="text-muted-foreground py-4">Nie udało się wczytać danych konkursu.</p>
              )}
            </TabsContent>

            <TabsContent value="contractor" className="mt-0">
              <SelectedOfferPanel submissionId={order.tenderId} kind="tender" />
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
            {showCancelAction && onRequestCancel ? (
              <Button type="button" variant="destructive" onClick={onRequestCancel}>
                Przerwij zamówienie
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zamknij
            </Button>
          </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
