'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type ManagerSubmission,
  getSubmissionStatusLabel,
} from '../../lib/database/manager-submissions';
import { ManagerSubmissionPodgladDialog } from './ManagerSubmissionPodgladDialog';
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

export function ManagerMojeZgloszeniaContent({
  submissions,
}: ManagerMojeZgloszeniaContentProps): React.ReactElement {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [podgladRow, setPodgladRow] = useState<ManagerSubmission | null>(null);

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

  const filtered = useMemo(() => {
    return submissions.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!row.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [submissions, statusFilter, search]);

  const compareHref = (row: ManagerSubmission): string => {
    const typ = row.kind === 'tender' ? 'przetarg' : 'zgłoszenie';
    return `/manager-dashboard/zgloszenia/porownaj/${row.id}?typ=${typ}`;
  };

  return (
    <div className="space-y-6">
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
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tytuł</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Oferty</TableHead>
                  <TableHead>Ostatnia oferta</TableHead>
                  <TableHead>Data dodania</TableHead>
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
                        <TableCell>{statusLabel}</TableCell>
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
                                <Link href={`/manager-dashboard/zgloszenia/edytuj/${row.id}`}>Edytuj</Link>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="Funkcja w przygotowaniu."
                            >
                              Odbiór
                            </Button>
                            <Button variant="outline" size="sm" disabled title="Funkcja w przygotowaniu.">
                              Zakończ
                            </Button>
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
      />
    </div>
  );
}
