'use client';

import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import {
  type ManagerSubmission,
  getSubmissionStatusLabel,
} from '../../lib/database/manager-submissions';
import { getJobWorkflowStatusSortIndex } from '../../lib/job-workflow-status';
import { ManagerSubmissionPodgladDialog } from './ManagerSubmissionPodgladDialog';
import { ManagerJobStatusSelect } from './ManagerJobStatusSelect';
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

interface ManagerMojeZgloszeniaContentProps {
  submissions: ManagerSubmission[];
}

type SortKey = 'title' | 'status' | 'offersCount' | 'lastOfferAt' | 'createdAt';
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

export function ManagerMojeZgloszeniaContent({
  submissions: initialSubmissions,
}: ManagerMojeZgloszeniaContentProps): React.ReactElement {
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [podgladRow, setPodgladRow] = useState<ManagerSubmission | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const statusOptions = useMemo(() => {
    const codes = Array.from(new Set(submissions.map((r) => r.status)));
    return codes
      .map((code) => {
        const sample = submissions.find((r) => r.status === code);
        return {
          value: code,
          label: sample ? getSubmissionStatusLabel(sample.kind, code) : code,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'pl'));
  }, [submissions]);

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'title' || key === 'status' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    const rows = submissions.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!row.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const mult = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return mult * a.title.localeCompare(b.title, 'pl');
        case 'status': {
          const labelA = getSubmissionStatusLabel(a.kind, a.status);
          const labelB = getSubmissionStatusLabel(b.kind, b.status);
          if (a.kind === 'job' && b.kind === 'job') {
            return (
              mult *
              (getJobWorkflowStatusSortIndex(a.status) - getJobWorkflowStatusSortIndex(b.status))
            );
          }
          return mult * labelA.localeCompare(labelB, 'pl');
        }
        case 'offersCount':
          return mult * (a.offersCount - b.offersCount);
        case 'lastOfferAt': {
          const at = a.lastOfferAt ? new Date(a.lastOfferAt).getTime() : 0;
          const bt = b.lastOfferAt ? new Date(b.lastOfferAt).getTime() : 0;
          return mult * (at - bt);
        }
        case 'createdAt':
        default:
          return mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });
  }, [submissions, statusFilter, search, sortKey, sortDir]);

  const compareHref = (row: ManagerSubmission): string => {
    const typ = row.kind === 'tender' ? 'przetarg' : 'zgłoszenie';
    return `/manager-dashboard/zgloszenia/porownaj/${row.id}?typ=${typ}`;
  };

  const handleStatusUpdated = (rowId: string, kind: ManagerSubmission['kind'], next: string): void => {
    setSubmissions((prev) =>
      prev.map((r) => (r.id === rowId && r.kind === kind ? { ...r, status: next } : r)),
    );
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Zgłoszenia</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Zarządzaj statusami workflow i ofertami wykonawców.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              placeholder="Szukaj po tytule…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[260px]">
                <SelectValue placeholder="Wszystkie statusy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                {statusOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild className="lg:ml-auto">
              <Link href="/post-job">Dodaj zgłoszenie</Link>
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="Tytuł"
                    sortKey="title"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Status"
                    sortKey="status"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Oferty"
                    sortKey="offersCount"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Ostatnia oferta"
                    sortKey="lastOfferAt"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Data dodania"
                    sortKey="createdAt"
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
                      Brak pozycji spełniających kryteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => {
                    const statusLabel = getSubmissionStatusLabel(row.kind, row.status);
                    const offersLabel =
                      row.newOffersCount > 0
                        ? `${row.offersCount} (${row.newOffersCount} ${row.newOffersCount === 1 ? 'nowa' : 'nowe'})`
                        : String(row.offersCount);
                    return (
                      <TableRow key={`${row.kind}-${row.id}`}>
                        <TableCell className="font-medium max-w-[240px]">{row.title}</TableCell>
                        <TableCell>
                          {row.kind === 'job' ? (
                            <ManagerJobStatusSelect
                              jobId={row.id}
                              status={row.status}
                              onUpdated={(next) => handleStatusUpdated(row.id, row.kind, next)}
                            />
                          ) : (
                            <span className="text-sm">{statusLabel}</span>
                          )}
                        </TableCell>
                        <TableCell>{offersLabel}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {row.lastOfferAt
                            ? new Date(row.lastOfferAt).toLocaleString('pl-PL', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {new Date(row.createdAt).toLocaleDateString('pl-PL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPodgladRow(row)}>
                              Podgląd
                            </Button>
                            {row.kind === 'job' && row.canEdit && (
                              <Button variant="secondary" size="sm" asChild>
                                <Link href={`/manager-dashboard/zgloszenia/edytuj/${row.id}`}>
                                  Edytuj
                                </Link>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              disabled={row.offersCount === 0}
                              onClick={() => router.push(compareHref(row))}
                            >
                              Porównaj oferty
                            </Button>
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

      <ManagerSubmissionPodgladDialog
        target={podgladRow ? { id: podgladRow.id, kind: podgladRow.kind } : null}
        open={podgladRow !== null}
        onOpenChange={(open) => {
          if (!open) setPodgladRow(null);
        }}
        onJobStatusUpdated={(next) => {
          if (podgladRow?.kind === 'job') {
            handleStatusUpdated(podgladRow.id, 'job', next);
          }
        }}
      />
    </div>
  );
}
