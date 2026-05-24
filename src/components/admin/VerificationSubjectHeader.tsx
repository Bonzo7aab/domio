import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CalendarClock,
  FileStack,
  Mail,
  Phone,
  StickyNote,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import type { VerificationState } from '../../lib/verification/types';

export interface VerificationSubjectHeaderProps {
  firstName: string;
  lastName: string;
  userType: string;
  verificationState: VerificationState;
  rejectionReason: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  companyNip: string | null;
  companyCity: string | null;
  documentsSubmitted: number;
  documentsExpected: number;
  createdAt: string | null;
  updatedAt: string | null;
  submittedAt: string | null;
  notesCount: number;
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

function userInitials(first: string, last: string): string {
  const f = first.trim().charAt(0).toUpperCase();
  const l = last.trim().charAt(0).toUpperCase();
  return `${f}${l}` || '?';
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export function VerificationSubjectHeader({
  firstName,
  lastName,
  userType,
  verificationState,
  rejectionReason,
  email,
  phone,
  companyName,
  companyNip,
  companyCity,
  documentsSubmitted,
  documentsExpected,
  createdAt,
  updatedAt,
  submittedAt,
  notesCount,
}: VerificationSubjectHeaderProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
            >
              {userInitials(firstName, lastName)}
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl font-semibold">
                {firstName} {lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{userTypeLabel(userType)}</Badge>
                <VerificationStatusBadge state={verificationState} />
                <Link
                  href="#admin-notes"
                  className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  title="Przejdź do notatek"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  Notatki
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                    {notesCount}
                  </span>
                </Link>
              </div>
              {verificationState === 'rejected' && rejectionReason && (
                <p className="text-sm text-destructive">
                  <span className="font-medium">Powód odrzucenia: </span>
                  {rejectionReason}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetaItem
            icon={Building2}
            label="Firma"
            value={[companyName, companyNip ? `NIP ${companyNip}` : null, companyCity]
              .filter(Boolean)
              .join(' · ') || '—'}
          />
          <MetaItem icon={Mail} label="E-mail" value={email ?? '—'} />
          <MetaItem icon={Phone} label="Telefon" value={phone ?? '—'} />
          <MetaItem
            icon={FileStack}
            label="Dokumenty"
            value={`${documentsSubmitted} / ${documentsExpected} przesłanych`}
          />
          <MetaItem icon={CalendarClock} label="Rozpoczęta" value={formatDate(createdAt)} />
          <MetaItem icon={CalendarClock} label="Zaktualizowana" value={formatDate(updatedAt)} />
          {submittedAt && (
            <MetaItem
              icon={CalendarClock}
              label="Przesłano do weryfikacji"
              value={formatDate(submittedAt)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
