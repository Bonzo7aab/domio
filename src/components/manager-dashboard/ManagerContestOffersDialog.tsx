'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import { fetchTenderBidsByTenderId } from '../../lib/database/jobs';
import type { ContestOfferDetails } from '../../types/contest-offer';
import { computeGrossFromNet } from '../../types/contest-offer';
import type { ContestOfferVatRate } from '../../types/contest-offer';
import { cn } from '../ui/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface TenderBidRow {
  id: string;
  contractorCompany: string;
  contractorRating: number;
  contractorReviewsCount?: number;
  totalPrice: number;
  netPrice?: number;
  vatRate?: ContestOfferVatRate | null;
  grossPrice?: number | null;
  warrantyMonths?: number | null;
  guaranteePeriod?: number;
  status?: string;
  offerDetails?: ContestOfferDetails | Record<string, unknown> | null;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function netFromBid(bid: TenderBidRow): number {
  return bid.netPrice ?? bid.totalPrice;
}

function vatLabelFromBid(bid: TenderBidRow): string {
  if (bid.vatRate === 'zw') return 'ZW';
  if (bid.vatRate === '8') return '8%';
  if (bid.vatRate === '23') return '23%';
  return '23%';
}

function bruttoFromBid(bid: TenderBidRow): number {
  if (bid.grossPrice != null && !Number.isNaN(bid.grossPrice)) {
    return bid.grossPrice;
  }
  const net = netFromBid(bid);
  const rate = bid.vatRate ?? '23';
  if (rate === 'zw') return net;
  return computeGrossFromNet(net, rate);
}

interface ManagerContestOffersDialogProps {
  contestId: string | null;
  contestTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManagerContestOffersDialog({
  contestId,
  contestTitle,
  open,
  onOpenChange,
}: ManagerContestOffersDialogProps): ReactElement {
  const [loading, setLoading] = useState(false);
  const [bids, setBids] = useState<TenderBidRow[]>([]);

  useEffect(() => {
    if (!open || !contestId) {
      return;
    }

    let cancelled = false;

    const run = async (): Promise<void> => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await fetchTenderBidsByTenderId(supabase, contestId, {
        submittedOnly: true,
      });
      if (cancelled) return;
      if (error) {
        toast.error('Nie udało się wczytać ofert');
        setBids([]);
      } else {
        setBids((data ?? []) as unknown as TenderBidRow[]);
      }
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, contestId]);

  const sortedBids = useMemo(
    () =>
      [...bids].sort((a, b) => {
        if (a.status === 'accepted') return -1;
        if (b.status === 'accepted') return 1;
        return a.contractorCompany.localeCompare(b.contractorCompany, 'pl');
      }),
    [bids],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Złożone oferty</DialogTitle>
          <DialogDescription>
            {contestTitle ?? 'Lista ofert w konkursie'}
            {sortedBids.some((b) => b.status === 'accepted') ? (
              <span className="block mt-1 text-primary font-medium">
                Wiersz na zielono — wybrana oferta (wygrana).
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
            Ładowanie ofert…
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wykonawca</TableHead>
                  <TableHead>Cena netto</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Cena brutto</TableHead>
                  <TableHead>Gwarancja</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBids.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Brak złożonych ofert.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedBids.map((bid) => {
                    const isWinner = bid.status === 'accepted';
                    const warranty = bid.warrantyMonths ?? bid.guaranteePeriod ?? null;
                    return (
                      <TableRow
                        key={bid.id}
                        className={cn(
                          isWinner &&
                            'bg-green-50 dark:bg-green-950/30 border-l-4 border-l-green-600',
                        )}
                      >
                        <TableCell>
                          <div className="font-medium">{bid.contractorCompany}</div>
                          <div className="text-xs text-muted-foreground">
                            ⭐ {bid.contractorRating.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>{formatMoney(netFromBid(bid))}</TableCell>
                        <TableCell>{vatLabelFromBid(bid)}</TableCell>
                        <TableCell className="font-semibold">{formatMoney(bruttoFromBid(bid))}</TableCell>
                        <TableCell>{warranty != null ? `${warranty} msc` : '—'}</TableCell>
                        <TableCell>
                          {isWinner ? (
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Wygrana
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Złożona</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
