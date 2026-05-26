'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, Lock } from 'lucide-react';
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
  const [podgladInitialTab, setPodgladInitialTab] = useState<'details' | 'selected-offer'>('details');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [cancelTarget, setCancelTarget] = useState<ManagerContest | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setContests(initialContests);
  }, [initialContests]);

  useEffect(() => {
    const podgladId = searchParams.get('podglad');
    if (!podgladId) return;

    const row = contests.find((c) => c.id === podgladId);
    if (!row) return;

    const tabParam = searchParams.get('tab');
    const tab: 'details' | 'selected-offer' =
      tabParam === 'selected-offer' ? 'selected-offer' : 'details';

    setPodgladRow(row);
    setPodgladInitialTab(tab);
    router.replace('/manager-dashboard/konkursy', { scroll: false });
  }, [searchParams, contests, router]);

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
              <Link href="/post-tender">+ Utwórz konkurs</Link>
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
                            <Button
                              variant={isPickedRow ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => openSzczegoly(row)}
                            >
                              Szczegóły
                            </Button>
                            {row.canEdit ? (
                              <Button variant="secondary" size="sm" asChild>
                                <Link href={`/post-tender/${row.id}`}>Kontynuuj konkurs</Link>
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
