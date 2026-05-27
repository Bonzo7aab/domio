'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, HelpCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  type ManagerContest,
  getContestStatusLabel,
} from '../../lib/database/manager-contests';
import {
  CONTEST_STATUS_FILTER_OPTIONS,
  canCancelContest,
  canCompareContestOffers,
  isContestCompareReadOnly,
} from '../../lib/tender-workflow-status';
import { formatSubmissionDeadlineDisplay, formatCompareLockedTooltip } from '../../lib/contest-submission-deadline';
import { cancelContestAction } from '../../app/manager-dashboard/konkursy/actions';
import { ManagerContestPodgladDialog } from './ManagerContestPodgladDialog';
import { ManagerContestQuestionsDialog } from './ManagerContestQuestionsDialog';
import { ContestStatusBadge } from './ContestStatusBadge';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
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

interface ManagerKonkursyContentProps {
  contests: ManagerContest[];
}

type SortKey = 'title' | 'location' | 'deadline' | 'status' | 'offersCount';
type SortDir = 'asc' | 'desc';

function SortableHead({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}): ReactElement {
  const active = activeKey === sortKey;
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon className="h-3.5 w-3.5 opacity-60" />
      </button>
    </TableHead>
  );
}

export function ManagerKonkursyContent({
  contests: initialContests,
}: ManagerKonkursyContentProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contests, setContests] = useState(initialContests);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [podgladRow, setPodgladRow] = useState<ManagerContest | null>(null);
  const [podgladInitialTab, setPodgladInitialTab] = useState<
    'details' | 'selected-offer' | 'questions'
  >('details');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [cancelTarget, setCancelTarget] = useState<ManagerContest | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [questionsDialog, setQuestionsDialog] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [unseenCounts, setUnseenCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialContests.map((c) => [c.id, c.unseenQuestionsCount])),
  );
  const [unansweredCounts, setUnansweredCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialContests.map((c) => [c.id, c.unansweredQuestionsCount])),
  );

  useEffect(() => {
    setContests(initialContests);
    setUnseenCounts(
      Object.fromEntries(initialContests.map((c) => [c.id, c.unseenQuestionsCount])),
    );
    setUnansweredCounts(
      Object.fromEntries(initialContests.map((c) => [c.id, c.unansweredQuestionsCount])),
    );
  }, [initialContests]);

  useEffect(() => {
    const openId = searchParams.get('contestId') ?? searchParams.get('podglad');
    if (!openId) return;

    const row = contests.find((c) => c.id === openId);
    if (!row) return;

    const tabParam = searchParams.get('tab');

    if (tabParam === 'questions') {
      setQuestionsDialog({ id: row.id, title: row.title });
      setUnseenCounts((prev) => ({ ...prev, [row.id]: 0 }));
    } else {
      const tab: 'details' | 'selected-offer' =
        tabParam === 'selected-offer' ? 'selected-offer' : 'details';
      setPodgladRow(row);
      setPodgladInitialTab(tab);
    }

    router.replace('/manager-dashboard/konkursy', { scroll: false });
  }, [searchParams, contests, router]);

  const openQuestionsDialog = (row: ManagerContest): void => {
    setQuestionsDialog({ id: row.id, title: row.title });
  };

  const handleUnseenCountChange = (contestId: string, count: number): void => {
    setUnseenCounts((prev) => ({ ...prev, [contestId]: count }));
  };

  const handleUnansweredCountChange = (contestId: string, count: number): void => {
    setUnansweredCounts((prev) => ({ ...prev, [contestId]: count }));
  };

  function questionsTooltipLabel(contestId: string): string {
    const unanswered = unansweredCounts[contestId] ?? 0;
    const unseen = unseenCounts[contestId] ?? 0;
    if (unanswered === 0) return 'Pytania do konkursu';
    const unansweredLabel =
      unanswered === 1
        ? '1 pytanie bez odpowiedzi'
        : unanswered < 5
          ? `${unanswered} pytania bez odpowiedzi`
          : `${unanswered} pytań bez odpowiedzi`;
    if (unseen > 0) {
      const unseenLabel = unseen === 1 ? '1 nowe' : `${unseen} nowych`;
      return `${unansweredLabel} (${unseenLabel})`;
    }
    return unansweredLabel;
  }

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'title' || key === 'location' || key === 'status' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const rows = contests.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !row.title.toLowerCase().includes(q) &&
          !row.locationLabel.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    const mult = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return mult * a.title.localeCompare(b.title, 'pl');
        case 'location':
          return mult * a.locationLabel.localeCompare(b.locationLabel, 'pl');
        case 'deadline':
          return (
            mult *
            (new Date(a.submissionDeadline).getTime() -
              new Date(b.submissionDeadline).getTime())
          );
        case 'status':
          return mult * getContestStatusLabel(a.status).localeCompare(
            getContestStatusLabel(b.status),
            'pl',
          );
        case 'offersCount':
          return mult * (a.offersCount - b.offersCount);
        default:
          return 0;
      }
    });
  }, [contests, statusFilter, search, sortKey, sortDir]);

  const compareHref = (id: string): string =>
    `/manager-dashboard/konkursy/porownaj/${id}`;

  const handleContestUpdated = (id: string, patch: Partial<ManagerContest>): void => {
    setContests((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    router.refresh();
  };

  const openSzczegoly = (
    row: ManagerContest,
    tab: 'details' | 'selected-offer' = row.hasSelectedOffer ? 'selected-offer' : 'details',
  ): void => {
    setPodgladInitialTab(tab);
    setPodgladRow(row);
  };

  const confirmCancel = async (): Promise<void> => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await cancelContestAction(cancelTarget.id);
      if (result.success) {
        toast.success('Konkurs został unieważniony');
        handleContestUpdated(cancelTarget.id, { status: 'cancelled' });
        setCancelTarget(null);
      } else {
        toast.error(result.error ?? 'Nie udało się unieważnić konkursu');
      }
    } finally {
      setCancelling(false);
    }
  };

  const renderCompareAction = (row: ManagerContest): ReactElement => {
    if (row.status === 'awarded') {
      return (
        <Button size="sm" variant="outline" onClick={() => openSzczegoly(row, 'selected-offer')}>
          Zobacz wyniki
        </Button>
      );
    }

    if (row.status === 'cancelled') {
      return (
        <Button size="sm" variant="outline" onClick={() => openSzczegoly(row)}>
          Zobacz konkurs
        </Button>
      );
    }

    const canCompare = canCompareContestOffers(row.status);
    const readOnlyCompare = isContestCompareReadOnly(row.status);

    if (row.status === 'active' || !canCompare) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button size="sm" variant="outline" disabled className="gap-1">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Porównaj oferty
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {formatCompareLockedTooltip(row.submissionDeadline)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button
        size="sm"
        variant={readOnlyCompare ? 'outline' : 'default'}
        disabled={row.offersCount === 0 && !readOnlyCompare}
        onClick={() => router.push(compareHref(row.id))}
      >
        {readOnlyCompare ? 'Zobacz wyniki' : 'Porównaj oferty'}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Konkursy</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Zarządzaj wyborem wykonawców i ofert w ramach konkursu.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              placeholder="Szukaj po tytule lub lokalizacji…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[280px]">
                <SelectValue placeholder="Wszystkie statusy" />
              </SelectTrigger>
              <SelectContent>
                {CONTEST_STATUS_FILTER_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild className="lg:ml-auto">
              <Link href="/post-contest">+ Utwórz konkurs</Link>
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="Tytuł konkursu"
                    sortKey="title"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Lokalizacja"
                    sortKey="location"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Termin składania"
                    sortKey="deadline"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Status konkursu"
                    sortKey="status"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Złożone oferty"
                    sortKey="offersCount"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Brak konkursów spełniających kryteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => {
                    const deadlineDisplay = formatSubmissionDeadlineDisplay(
                      row.submissionDeadline,
                    );
                    const isPickedRow = row.hasSelectedOffer;
                    const isActiveRow = podgladRow?.id === row.id;

                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          isPickedRow &&
                            'bg-primary/5 border-l-4 border-l-primary hover:bg-primary/10',
                          isActiveRow && !isPickedRow && 'bg-muted/50',
                        )}
                      >
                        <TableCell
                          className={cn('font-medium max-w-[240px]', isPickedRow && 'text-primary')}
                        >
                          {row.title}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                          {row.locationLabel}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {deadlineDisplay ? (
                            <span>
                              <span className="font-medium">{deadlineDisplay.formatted}</span>
                              {deadlineDisplay.hint ? (
                                <span className="text-muted-foreground block text-xs">
                                  ({deadlineDisplay.hint})
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <ContestStatusBadge status={row.status} />
                        </TableCell>
                        <TableCell>{row.offersCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="relative h-8 w-8 p-0 shrink-0"
                                    onClick={() => openQuestionsDialog(row)}
                                    aria-label="Pytania do konkursu"
                                  >
                                    <HelpCircle className="h-4 w-4" />
                                    {(unseenCounts[row.id] ?? 0) > 0 ? (
                                      <span
                                        className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground"
                                        aria-hidden
                                      >
                                        {(unseenCounts[row.id] ?? 0) > 9
                                          ? '9+'
                                          : unseenCounts[row.id]}
                                      </span>
                                    ) : null}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {questionsTooltipLabel(row.id)}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant={isPickedRow ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => openSzczegoly(row)}
                            >
                              Szczegóły
                            </Button>
                            {row.canEdit ? (
                              <Button variant="secondary" size="sm" asChild>
                                <Link href={`/post-contest/${row.id}`}>Kontynuuj konkurs</Link>
                              </Button>
                            ) : null}
                            {canCancelContest(row.status) ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setCancelTarget(row)}
                              >
                                Unieważnij
                              </Button>
                            ) : null}
                            {renderCompareAction(row)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ManagerContestQuestionsDialog
        contestId={questionsDialog?.id ?? null}
        contestTitle={questionsDialog?.title ?? ''}
        open={questionsDialog !== null}
        onOpenChange={(open) => {
          if (!open) setQuestionsDialog(null);
        }}
        onUnseenCountChange={handleUnseenCountChange}
        onUnansweredCountChange={handleUnansweredCountChange}
      />

      <ManagerContestPodgladDialog
        contestId={podgladRow?.id ?? null}
        open={podgladRow !== null}
        initialTab={podgladInitialTab}
        onOpenChange={(open) => {
          if (!open) {
            setPodgladRow(null);
            setPodgladInitialTab('details');
          }
        }}
      />

      <AlertDialog open={cancelTarget !== null} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unieważnić konkurs?</AlertDialogTitle>
            <AlertDialogDescription>
              Konkurs „{cancelTarget?.title}” zostanie oznaczony jako unieważniony. Wykonawcy nie
              będą mogli składać nowych ofert. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmCancel();
              }}
            >
              {cancelling ? 'Unieważnianie…' : 'Unieważnij konkurs'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
