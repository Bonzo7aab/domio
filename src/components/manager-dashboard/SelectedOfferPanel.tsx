'use client';

import { useEffect, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { ExternalLink, Mail, Phone, User } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { fetchContractorById } from '../../lib/database/contractors';
import {
  fetchAcceptedJobApplication,
  fetchAcceptedTenderBid,
} from '../../lib/database/offer-selection';
import type { Application } from '../../types/application';
import type { ContractorProfile } from '../../types/contractor';
import type { ManagerSubmissionKind } from '../../lib/database/manager-submissions';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const DEFAULT_VAT = 23;

function grossFromVat(net: number, vatPercent: number): number {
  return Math.round(net * (1 + vatPercent / 100));
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function jobDurationLabel(app: Application): string {
  if (app.timelineDays != null && !Number.isNaN(app.timelineDays)) {
    const d = app.timelineDays;
    return `${d} ${d === 1 ? 'dzień roboczy' : 'dni roboczych'}`;
  }
  return app.proposedTimeline;
}

interface TenderBidSummary {
  id: string;
  contractorCompanyId?: string;
  contractorName: string;
  contractorCompany: string;
  contractorRating: number;
  totalPrice: number;
  proposedTimeline: number;
  proposedStartDate: Date | string;
  guaranteePeriod: number;
  technicalProposal: string;
  attachments: Array<Record<string, unknown>>;
}

interface SelectedOfferPanelProps {
  submissionId: string;
  kind: ManagerSubmissionKind;
}

export function SelectedOfferPanel({
  submissionId,
  kind,
}: SelectedOfferPanelProps): ReactElement {
  const [loading, setLoading] = useState(true);
  const [jobApp, setJobApp] = useState<Application | null>(null);
  const [tenderBid, setTenderBid] = useState<TenderBidSummary | null>(null);
  const [profile, setProfile] = useState<ContractorProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      setLoading(true);
      setJobApp(null);
      setTenderBid(null);
      setProfile(null);

      const supabase = createClient();

      try {
        if (kind === 'job') {
          const app = await fetchAcceptedJobApplication(supabase, submissionId);
          if (cancelled) return;
          setJobApp(app);
          if (app?.contractorCompanyId) {
            const p = await fetchContractorById(app.contractorCompanyId);
            if (!cancelled) setProfile(p);
          }
        } else {
          const bidRaw = await fetchAcceptedTenderBid(supabase, submissionId);
          if (cancelled) return;
          if (bidRaw) {
            const bid = bidRaw as Record<string, unknown>;
            const summary: TenderBidSummary = {
              id: String(bid.id),
              contractorCompanyId: String(bid.contractorCompanyId ?? ''),
              contractorName: String(bid.contractorName ?? ''),
              contractorCompany: String(bid.contractorCompany ?? ''),
              contractorRating: Number(bid.contractorRating ?? 0),
              totalPrice: Number(bid.totalPrice ?? bid.bid_amount ?? 0),
              proposedTimeline: Number(bid.proposedTimeline ?? 0),
              proposedStartDate: (bid.proposedStartDate as Date | string) ?? '',
              guaranteePeriod: Number(bid.guaranteePeriod ?? 0),
              technicalProposal: String(bid.technicalProposal ?? ''),
              attachments: Array.isArray(bid.attachments)
                ? (bid.attachments as Array<Record<string, unknown>>)
                : [],
            };
            setTenderBid(summary);
            if (summary.contractorCompanyId) {
              const p = await fetchContractorById(summary.contractorCompanyId);
              if (!cancelled) setProfile(p);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [submissionId, kind]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
        Ładowanie wybranej oferty…
      </div>
    );
  }

  if (!jobApp && !tenderBid) {
    return (
      <p className="text-muted-foreground py-4">
        Brak wybranej oferty. Wybierz ofertę w widoku porównania ofert.
      </p>
    );
  }

  const companyId = jobApp?.contractorCompanyId || tenderBid?.contractorCompanyId;
  const contactName = jobApp?.contractorName || tenderBid?.contractorName || '—';
  const companyName = jobApp?.contractorCompany || tenderBid?.contractorCompany || '—';
  const phone = profile?.contactInfo?.phone || '—';
  const email = profile?.contactInfo?.email || '—';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Kontakt wykonawcy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              <span className="text-muted-foreground">Imię i nazwisko: </span>
              <strong>{contactName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground ml-6">Firma: </span>
            <strong>{companyName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <a href={phone !== '—' ? `tel:${phone}` : undefined} className="hover:underline">
              {phone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <a href={email !== '—' ? `mailto:${email}` : undefined} className="hover:underline">
              {email}
            </a>
          </div>
          {companyId ? (
            <Link
              href={`/contractors/${companyId}`}
              className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
            >
              Profil wykonawcy
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Dane oferty</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {jobApp && (
            <>
              <div>
                <span className="text-muted-foreground">Kwota netto: </span>
                <strong>{formatMoney(jobApp.proposedPrice)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">VAT: </span>
                {(jobApp.vatRate ?? 23)}%
              </div>
              <div>
                <span className="text-muted-foreground">Kwota brutto: </span>
                <strong>
                  {formatMoney(grossFromVat(jobApp.proposedPrice, jobApp.vatRate ?? 23))}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">Termin rozpoczęcia: </span>
                {formatDate(jobApp.availableFrom)}
              </div>
              <div>
                <span className="text-muted-foreground">Czas realizacji: </span>
                {jobDurationLabel(jobApp)}
              </div>
              <div>
                <span className="text-muted-foreground">Gwarancja: </span>
                {jobApp.guaranteePeriod}
              </div>
              <div>
                <span className="text-muted-foreground">Ocena wykonawcy: </span>
                ⭐ {jobApp.contractorRating.toFixed(1)}
              </div>
            </>
          )}
          {tenderBid && (
            <>
              <div>
                <span className="text-muted-foreground">Kwota netto: </span>
                <strong>{formatMoney(tenderBid.totalPrice)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">VAT: </span>
                {DEFAULT_VAT}%
              </div>
              <div>
                <span className="text-muted-foreground">Kwota brutto: </span>
                <strong>{formatMoney(grossFromVat(tenderBid.totalPrice, DEFAULT_VAT))}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Termin rozpoczęcia: </span>
                {formatDate(tenderBid.proposedStartDate)}
              </div>
              <div>
                <span className="text-muted-foreground">Czas realizacji: </span>
                {tenderBid.proposedTimeline}{' '}
                {tenderBid.proposedTimeline === 1 ? 'dzień' : 'dni'}
              </div>
              <div>
                <span className="text-muted-foreground">Gwarancja: </span>
                {tenderBid.guaranteePeriod} mies.
              </div>
              <div>
                <span className="text-muted-foreground">Ocena wykonawcy: </span>
                ⭐ {tenderBid.contractorRating.toFixed(1)}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <h4 className="font-semibold mb-1 text-sm">Opis i podejście</h4>
        <blockquote className="border-l-4 pl-3 text-muted-foreground whitespace-pre-wrap text-sm">
          {jobApp?.coverLetter || tenderBid?.technicalProposal || '—'}
        </blockquote>
      </div>

      {(jobApp?.attachments?.length || tenderBid?.attachments?.length) ? (
        <div>
          <h4 className="font-semibold mb-1 text-sm">Załączniki</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {jobApp?.attachments.map((f) => (
              <li key={f.id}>{f.name}</li>
            ))}
            {tenderBid?.attachments.map((raw, idx) => (
              <li key={idx}>{String((raw as { name?: string }).name || 'Plik')}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {jobApp?.certificates && jobApp.certificates.length > 0 ? (
        <div>
          <h4 className="font-semibold mb-1 text-sm">Certyfikaty</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {jobApp.certificates.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
