'use client';

import { useMemo, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, FilePen, MessageSquare, MoreVertical } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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

  const renderActionsMenu = (
    row: ContractorContestOfferRow,
    messageAllowed: boolean,
    withdrawAllowed: boolean,
  ): ReactElement | null => {
    if (!messageAllowed && !withdrawAllowed) {
      return null;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Więcej akcji"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {messageAllowed ? (
            <DropdownMenuItem onClick={() => void handleMessage(row)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Wiadomość do organizatora
            </DropdownMenuItem>
          ) : null}
          {withdrawAllowed ? (
            <>
              {messageAllowed ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => void handleWithdraw(row.id)}
              >
                Wycofaj ofertę
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
                ? 'Nie masz jeszcze ofert w konkursach. Przeglądaj konkursy i składaj oferty — zapisane szkice też pojawią się tutaj.'
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
                  <TableHead className="text-right">Akcje</TableHead>
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
                  const isDraft = row.derivedStatus === 'draft';
                  const hasPricing = row.netPrice > 0;

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="max-w-[300px]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-0.5 min-w-0">
                            <span className="font-medium truncate min-w-0 leading-snug">
                              {row.contestTitle}
                            </span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={`/jobs/${row.tenderId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                                    aria-label="Szczegóły konkursu"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Szczegóły konkursu</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {row.organizerName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasPricing ? (
                          <>
                            <p className="font-medium">{formatMoneyPl(row.netPrice)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatMoneyPl(row.grossPrice)}{' '}
                              <span className="text-xs">({row.vatLabel})</span>
                            </p>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {isDraft ? 'Uzupełnij w szkicu' : '—'}
                          </span>
                        )}
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
                        <div className="flex items-center justify-end gap-1">
                          {isDraft ? (
                            <Button asChild variant="default" size="sm" className="h-8">
                              <Link href={`/jobs/${row.tenderId}`}>
                                <FilePen className="h-4 w-4 mr-1.5" />
                                Kontynuuj szkic
                              </Link>
                            </Button>
                          ) : null}
                          {renderActionsMenu(row, messageAllowed, withdrawAllowed)}
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
