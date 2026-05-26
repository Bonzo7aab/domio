'use client';

import { useEffect, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import { fetchTenderById, type TenderWithCompany } from '../../lib/database/jobs';
import { fetchAcceptedTenderBid } from '../../lib/database/offer-selection';
import {
  isContestTender,
  mapTenderRowToContestDisplay,
} from '../../lib/tender-contest/map-tender-contest-display';
import { SelectedOfferPanel } from './SelectedOfferPanel';
import { ContestStatusBadge } from './ContestStatusBadge';
import { ManagerContestDetailSections } from './ManagerContestDetailSections';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface ManagerContestPodgladDialogProps {
  contestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'details' | 'selected-offer';
}

function isContestReadOnly(status: string): boolean {
  return status !== 'draft';
}

export function ManagerContestPodgladDialog({
  contestId,
  open,
  onOpenChange,
  initialTab = 'details',
}: ManagerContestPodgladDialogProps): ReactElement {
  const [loading, setLoading] = useState(false);
  const [tender, setTender] = useState<TenderWithCompany | null>(null);
  const [hasSelectedOffer, setHasSelectedOffer] = useState(false);
  const [winnerCompanyId, setWinnerCompanyId] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!open || !contestId) {
      setTender(null);
      setHasSelectedOffer(false);
      setWinnerCompanyId(null);
      setWinnerName(null);
      setActiveTab('details');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setActiveTab(initialTab === 'selected-offer' ? 'selected-offer' : 'details');

    const run = async (): Promise<void> => {
      const supabase = createClient();
      try {
        const { data, error } = await fetchTenderById(supabase, contestId);
        if (cancelled) return;
        if (error || !data) {
          toast.error('Nie udało się wczytać konkursu');
          setTender(null);
          return;
        }
        if (!isContestTender(data)) {
          toast.error('To nie jest konkurs ofert');
          setTender(null);
          return;
        }
        setTender(data);
        const acceptedBid = await fetchAcceptedTenderBid(supabase, contestId);
        if (!cancelled) {
          const hasWinner = acceptedBid !== null;
          setHasSelectedOffer(hasWinner);
          if (hasWinner && acceptedBid) {
            const bid = acceptedBid as {
              contractorCompany?: string;
              contractorCompanyId?: string;
            };
            setWinnerName(bid.contractorCompany ?? null);
            setWinnerCompanyId(bid.contractorCompanyId ?? null);
          }
        }
      } catch {
        if (!cancelled) toast.error('Błąd podczas ładowania');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, contestId, initialTab]);

  const contestInfo = tender && isContestTender(tender) ? mapTenderRowToContestDisplay(tender) : null;
  const readOnly = tender ? isContestReadOnly(tender.status) : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Szczegóły konkursu</DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Pełny podgląd danych konkursu (widok audytowy).'
              : 'Szkic konkursu — możesz edytować przed publikacją.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
            Ładowanie…
          </div>
        ) : tender && contestInfo ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="text-sm">
            <TabsList className={`grid w-full mb-4 ${hasSelectedOffer ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="details">Szczegóły</TabsTrigger>
              {hasSelectedOffer ? (
                <TabsTrigger value="selected-offer">Wybrana oferta</TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-0">
              <div>
                <h2 className="text-xl font-bold pr-8">{tender.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <ContestStatusBadge status={tender.status} />
                </div>
              </div>

              {tender.status === 'awarded' && winnerName ? (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                  <p className="text-sm font-medium">Konkurs rozstrzygnięty</p>
                  <p className="text-sm text-muted-foreground">
                    Wybrany wykonawca:{' '}
                    {winnerCompanyId ? (
                      <Link
                        href={`/contractors/${winnerCompanyId}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {winnerName}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{winnerName}</span>
                    )}
                  </p>
                </div>
              ) : null}

              <ManagerContestDetailSections tender={tender} contestInfo={contestInfo} />

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                {!readOnly && contestId ? (
                  <Button type="button" variant="secondary" asChild>
                    <Link href={`/post-tender/${contestId}`}>Kontynuuj konkurs</Link>
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Zamknij
                </Button>
              </div>
            </TabsContent>

            {hasSelectedOffer && contestId ? (
              <TabsContent value="selected-offer" className="mt-0">
                <SelectedOfferPanel submissionId={contestId} kind="tender" />
              </TabsContent>
            ) : null}
          </Tabs>
        ) : (
          <p className="text-center text-muted-foreground py-6">Brak danych do wyświetlenia.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
