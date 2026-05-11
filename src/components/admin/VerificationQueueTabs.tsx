'use client';

import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import type {
  ApprovedVerificationRow,
  PendingVerificationRow,
  RejectedVerificationRow,
} from '../../lib/database/admin-verification';

interface VerificationQueueTabsProps {
  pending: PendingVerificationRow[];
  rejected: RejectedVerificationRow[];
  approved: ApprovedVerificationRow[];
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

function userTypeLabel(value: string): string {
  switch (value) {
    case 'manager':
      return 'Zarządca';
    case 'contractor':
      return 'Wykonawca';
    default:
      return value;
  }
}

export function VerificationQueueTabs({ pending, rejected, approved }: VerificationQueueTabsProps) {
  return (
    <Tabs defaultValue="pending">
      <TabsList className="grid w-full grid-cols-3 md:w-fit">
        <TabsTrigger value="pending">Nowe ({pending.length})</TabsTrigger>
        <TabsTrigger value="rejected">Odrzucone ({rejected.length})</TabsTrigger>
        <TabsTrigger value="approved">Zaakceptowane ({approved.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-4">
        <PendingTable rows={pending} />
      </TabsContent>
      <TabsContent value="rejected" className="mt-4">
        <RejectedTable rows={rejected} />
      </TabsContent>
      <TabsContent value="approved" className="mt-4">
        <ApprovedTable rows={approved} />
      </TabsContent>
    </Tabs>
  );
}

function EmptyRow({ message, colSpan }: { message: string; colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-6 text-center text-sm text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  );
}

function DetailsLink({ userId }: { userId: string }) {
  return (
    <Link href={`/admin/verification/${userId}`} className="text-primary underline">
      Szczegóły
    </Link>
  );
}

function PendingTable({ rows }: { rows: PendingVerificationRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Użytkownik</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Firma</TableHead>
            <TableHead>Przesłano</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && <EmptyRow message="Brak pozycji w kolejce." colSpan={5} />}
          {rows.map((r) => (
            <TableRow key={r.userId}>
              <TableCell className="font-medium">
                {r.firstName} {r.lastName}
              </TableCell>
              <TableCell>{userTypeLabel(r.userType)}</TableCell>
              <TableCell>{r.companyName ?? '—'}</TableCell>
              <TableCell>{formatDate(r.verificationSubmittedAt)}</TableCell>
              <TableCell>
                <DetailsLink userId={r.userId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RejectedTable({ rows }: { rows: RejectedVerificationRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Użytkownik</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Firma</TableHead>
            <TableHead>Odrzucono</TableHead>
            <TableHead>Powód</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && <EmptyRow message="Brak odrzuconych weryfikacji." colSpan={6} />}
          {rows.map((r) => (
            <TableRow key={r.userId}>
              <TableCell className="font-medium">
                {r.firstName} {r.lastName}
              </TableCell>
              <TableCell>{userTypeLabel(r.userType)}</TableCell>
              <TableCell>{r.companyName ?? '—'}</TableCell>
              <TableCell>{formatDate(r.decidedAt)}</TableCell>
              <TableCell className="max-w-[320px] whitespace-pre-wrap text-sm text-muted-foreground">
                {r.reason ?? '—'}
              </TableCell>
              <TableCell>
                <DetailsLink userId={r.userId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ApprovedTable({ rows }: { rows: ApprovedVerificationRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Użytkownik</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Firma</TableHead>
            <TableHead>Zaakceptowano</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && <EmptyRow message="Brak zaakceptowanych weryfikacji." colSpan={5} />}
          {rows.map((r) => (
            <TableRow key={r.userId}>
              <TableCell className="font-medium">
                {r.firstName} {r.lastName}
              </TableCell>
              <TableCell>{userTypeLabel(r.userType)}</TableCell>
              <TableCell>{r.companyName ?? '—'}</TableCell>
              <TableCell>{formatDate(r.decidedAt)}</TableCell>
              <TableCell>
                <DetailsLink userId={r.userId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
