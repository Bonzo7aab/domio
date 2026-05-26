'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { createClient } from '../../lib/supabase/client';
import type { ContractorContestOfferRow } from '../../lib/database/contractor-contest-offers';
import {
  CONTRACTOR_CONTEST_OFFER_FILTER_OPTIONS,
  canMessageManagerOnContestOffer,
  canWithdrawContestOffer,
  matchesContestOfferFilter,
  type ContractorContestOfferFilterValue,
} from '../../lib/contest-offer/contractor-contest-offer-status';
import { formatSubmissionDeadlineDisplay } from '../../lib/contest-submission-deadline';
import { ContractorContestOfferStatusBadge } from './ContractorContestOfferStatusBadge';
import type { TenderWithCompany } from '../../lib/database/jobs';

interface ContractorContestOffersContentProps {
  offers: ContractorContestOfferRow[];
  companyId: string;
}

function formatMoneyPl(price: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function ContractorContestOffersContent({
  offers,
  companyId,
}: ContractorContestOffersContentProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] =
    useState<ContractorContestOfferFilterValue>('all');

  const filteredOffers = useMemo(
    () =>
      offers.filter((row) => matchesContestOfferFilter(row.derivedStatus, statusFilter)),
    [offers, statusFilter],
  );

  const handleViewContest = (tenderId: string) => {
    router.push(`/jobs/${tenderId}`);
  };

  const handleWithdraw = async (bidId: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !companyId) {
      toast.error('Musisz być zalogowany aby wycofać ofertę');
      return;
    }

    try {
      const { cancelTenderBid } = await import('../../lib/database/jobs');
      const result = await cancelTenderBid(supabase, bidId, user.id);

      if (result.error) {
        const err = result.error;
        const errorMessage =
          err instanceof Error ? err.message : 'Wystąpił błąd podczas wycofywania oferty';
        toast.error(errorMessage);
        return;
      }

      toast.success('Oferta została wycofana');
      router.refresh();
    } catch (error) {
      console.error('Error withdrawing contest offer:', error);
      toast.error('Wystąpił błąd podczas wycofywania oferty');
    }
  };

  const handleMessage = async (row: ContractorContestOfferRow) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Musisz być zalogowany aby rozpocząć konwersację');
      return;
    }

    try {
      const { getTenderById } = await import('../../lib/data');
      const { data: dbTender, error: tenderError } = await getTenderById(row.tenderId);

      if (tenderError || !dbTender) {
        toast.error('Nie można znaleźć konkursu');
        return;
      }

      const managerId =
        (dbTender as TenderWithCompany & { manager_id?: string }).manager_id || null;

      if (!managerId) {
        toast.error('Nie można znaleźć zarządcy');
        return;
      }

      const { findConversationByJob } = await import('../../lib/database/messaging');
      const result = await findConversationByJob(
        supabase,
        row.tenderId,
        user.id,
        managerId,
        true,
      );

      if (result.error) {
        router.push(`/messages?recipient=${managerId}&jobId=${row.tenderId}`);
        return;
      }

      if (result.data) {
        router.push(`/messages?conversation=${result.data}`);
      } else {
        router.push(`/messages?recipient=${managerId}&jobId=${row.tenderId}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Wystąpił błąd podczas otwierania wiadomości');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Moje Oferty</h2>
          <p className="text-muted-foreground mt-1">
            Śledź statusy swoich ofert w konkursach.
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ContractorContestOfferFilterValue)}
        >
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Filtr statusów" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACTOR_CONTEST_OFFER_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-base font-medium text-muted-foreground mb-2">
              Brak ofert w tej kategorii
            </h3>
            <p className="text-sm text-muted-foreground">
              {offers.length === 0
                ? 'Nie masz jeszcze ofert w konkursach. Przeglądaj konkursy i składaj oferty.'
                : 'Zmień filtr statusów, aby zobaczyć inne oferty.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Oferty w konkursach</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa konkursu i Organizator</TableHead>
                  <TableHead>Twoja wycena (Netto / Brutto)</TableHead>
                  <TableHead>Termin składania</TableHead>
                  <TableHead>Status oferty</TableHead>
                  <TableHead className="text-right">Dostępne akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.map((row) => {
                  const deadlineDisplay = formatSubmissionDeadlineDisplay(
                    row.submissionDeadline,
                  );
                  const withdrawAllowed = canWithdrawContestOffer({
                    bidStatus: row.bidStatus,
                    tenderStatus: row.tenderStatus,
                    submissionDeadlineIso: row.submissionDeadline,
                  });
                  const messageAllowed = canMessageManagerOnContestOffer(row.derivedStatus);

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium">{row.contestTitle}</p>
                        <p className="text-sm text-muted-foreground">{row.organizerName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatMoneyPl(row.netPrice)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatMoneyPl(row.grossPrice)}{' '}
                          <span className="text-xs">({row.vatLabel})</span>
                        </p>
                      </TableCell>
                      <TableCell>
                        {deadlineDisplay ? (
                          <>
                            <p className="font-medium">{deadlineDisplay.formatted}</p>
                            {deadlineDisplay.hint ? (
                              <p className="text-xs text-muted-foreground">
                                ({deadlineDisplay.hint})
                              </p>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ContractorContestOfferStatusBadge status={row.derivedStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewContest(row.tenderId)}
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Szczegóły
                          </Button>
                          {messageAllowed ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMessage(row)}
                            >
                              <MessageSquare className="mr-2 h-3.5 w-3.5" />
                              Wiadomość
                            </Button>
                          ) : null}
                          {withdrawAllowed ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleWithdraw(row.id)}
                            >
                              <X className="mr-2 h-3.5 w-3.5" />
                              Wycofaj ofertę
                            </Button>
                          ) : null}
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
