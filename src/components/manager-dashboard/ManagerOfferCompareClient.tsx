'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import {
  fetchJobApplicationsByJobId,
  fetchJobById,
  fetchTenderBidsByTenderId,
  fetchTenderById,
} from '../../lib/database/jobs';
import { fetchContractorById } from '../../lib/database/contractors';
import type { Application } from '../../types/application';
import type { ContractorProfile } from '../../types/contractor';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

function grossFromVat(net: number, vatPercent: number): number {
  return Math.round(net * (1 + vatPercent / 100));
}

function jobDurationLabel(app: Application): string {
  if (app.timelineDays != null && !Number.isNaN(app.timelineDays)) {
    const d = app.timelineDays;
    return `${d} ${d === 1 ? 'dzień roboczy' : 'dni roboczych'}`;
  }
  return app.proposedTimeline;
}

/** Tender bids do not store per-bid VAT in this flow; assume 23% for comparison. */
const DEFAULT_VAT = 23;

type CompareKind = 'job' | 'tender';

interface TenderBidLike {
  id: string;
  contractorCompanyId?: string;
  contractorCompany: string;
  contractorRating: number;
  contractorCompletedJobs: number;
  totalPrice: number;
  proposedTimeline: number;
  proposedStartDate: Date;
  guaranteePeriod: number;
  technicalProposal: string;
  attachments: Array<Record<string, unknown>>;
}

interface ManagerOfferCompareClientProps {
  submissionId: string;
  kind: CompareKind;
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

export function ManagerOfferCompareClient({
  submissionId,
  kind,
}: ManagerOfferCompareClientProps): React.ReactElement {
  const router = useRouter();
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [jobApps, setJobApps] = useState<Application[]>([]);
  const [tenderBids, setTenderBids] = useState<TenderBidLike[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ContractorProfile | null>>({});
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [detailBid, setDetailBid] = useState<TenderBidLike | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactProfile, setContactProfile] = useState<ContractorProfile | null>(null);

  const loadProfiles = useCallback(async (companyIds: string[]): Promise<void> => {
    const unique = [...new Set(companyIds.filter(Boolean))];
    const entries = await Promise.all(
      unique.map(async (id) => {
        const p = await fetchContractorById(id);
        return [id, p] as const;
      }),
    );
    const map: Record<string, ContractorProfile | null> = {};
    for (const [id, p] of entries) {
      map[id] = p;
    }
    setProfiles(map);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      setLoading(true);
      const supabase = createClient();

      try {
        if (kind === 'job') {
          const [{ data: job, error: jobErr }, { data: apps, error: appErr }] = await Promise.all([
            fetchJobById(supabase, submissionId),
            fetchJobApplicationsByJobId(supabase, submissionId),
          ]);
          if (cancelled) return;
          if (jobErr || !job) {
            toast.error('Nie udało się wczytać zgłoszenia');
            setTitle('');
            setJobApps([]);
          } else {
            setTitle(job.title);
            setJobApps(apps || []);
            await loadProfiles((apps || []).map((a) => a.contractorCompanyId || ''));
          }
          if (appErr) {
            toast.error('Nie udało się wczytać ofert');
          }
        } else {
          const [{ data: tender, error: tErr }, { data: bids, error: bErr }] = await Promise.all([
            fetchTenderById(supabase, submissionId),
            fetchTenderBidsByTenderId(supabase, submissionId),
          ]);
          if (cancelled) return;
          if (tErr || !tender) {
            toast.error('Nie udało się wczytać przetargu');
            setTitle('');
            setTenderBids([]);
          } else {
            setTitle(tender.title);
            const normalized = (bids || []) as unknown as TenderBidLike[];
            setTenderBids(normalized);
            await loadProfiles(normalized.map((b) => b.contractorCompanyId || ''));
          }
          if (bErr) {
            toast.error('Nie udało się wczytać ofert');
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
  }, [kind, submissionId, loadProfiles]);

  const backHref = '/manager-dashboard/zgloszenia';

  const profileForCompany = (id: string | undefined): ContractorProfile | null => {
    if (!id) return null;
    return profiles[id] ?? null;
  };

  const ocSummary = (p: ContractorProfile | null): string => {
    if (!p?.insurance) return '❌ Brak OC';
    if (!p.insurance.hasOC) return '❌ Brak OC';
    const sum = p.insurance.ocAmount || '—';
    return `✅ OC: ${sum}`;
  };

  const openContact = (companyId: string | undefined): void => {
    const p = profileForCompany(companyId);
    setContactProfile(p);
    setContactOpen(true);
  };

  const openDetailFromApp = (app: Application): void => {
    setDetailApp(app);
    setDetailBid(null);
  };

  const openDetailFromBid = (bid: TenderBidLike): void => {
    setDetailBid(bid);
    setDetailApp(null);
  };

  const detailProfile = useMemo(() => {
    if (detailApp) {
      return profileForCompany(detailApp.contractorCompanyId);
    }
    if (detailBid) {
      return profileForCompany(detailBid.contractorCompanyId);
    }
    return null;
  }, [detailApp, detailBid, profiles]);

  const netFromBid = (bid: TenderBidLike): number => bid.totalPrice;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
        Ładowanie porównania…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => router.push(backHref)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Powrót do listy zgłoszeń
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Porównanie ofert</h1>
        <p className="text-muted-foreground mt-1">{title}</p>
      </div>

      {kind === 'job' ? (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wykonawca</TableHead>
                  <TableHead>Cena netto</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Cena brutto</TableHead>
                  <TableHead>Termin rozpoczęcia</TableHead>
                  <TableHead>Czas realizacji</TableHead>
                  <TableHead>Okres gwarancji</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead className="text-right">Szczegóły</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobApps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Brak ofert do porównania.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobApps.map((app) => {
                    const net = app.proposedPrice;
                    const vatRate = app.vatRate ?? 23;
                    const brutto = grossFromVat(net, vatRate);
                    const p = profileForCompany(app.contractorCompanyId);
                    const stars = `⭐ ${app.contractorRating.toFixed(1)}`;
                    const durationLabel = jobDurationLabel(app);
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.contractorCompany}</TableCell>
                        <TableCell>{formatMoney(net)}</TableCell>
                        <TableCell>{vatRate}%</TableCell>
                        <TableCell className="font-semibold">{formatMoney(brutto)}</TableCell>
                        <TableCell>{formatDate(app.availableFrom)}</TableCell>
                        <TableCell>{durationLabel}</TableCell>
                        <TableCell>{app.guaranteePeriod}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {ocSummary(p)} / {stars}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openDetailFromApp(app)}>
                            Szczegóły
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wykonawca</TableHead>
                  <TableHead>Cena netto</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Cena brutto</TableHead>
                  <TableHead>Termin rozpoczęcia</TableHead>
                  <TableHead>Czas realizacji</TableHead>
                  <TableHead>Okres gwarancji</TableHead>
                  <TableHead>Profil</TableHead>
                  <TableHead className="text-right">Szczegóły</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenderBids.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Brak ofert do porównania.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenderBids.map((bid) => {
                    const net = netFromBid(bid);
                    const brutto = grossFromVat(net, DEFAULT_VAT);
                    const p = profileForCompany(bid.contractorCompanyId);
                    const days = bid.proposedTimeline;
                    const durationLabel = `${days} ${days === 1 ? 'dzień' : 'dni'}`;
                    const stars = `⭐ ${bid.contractorRating.toFixed(1)}`;
                    return (
                      <TableRow key={bid.id}>
                        <TableCell className="font-medium">{bid.contractorCompany}</TableCell>
                        <TableCell>{formatMoney(net)}</TableCell>
                        <TableCell>{DEFAULT_VAT}%</TableCell>
                        <TableCell className="font-semibold">{formatMoney(brutto)}</TableCell>
                        <TableCell>{formatDate(bid.proposedStartDate)}</TableCell>
                        <TableCell>{durationLabel}</TableCell>
                        <TableCell>{bid.guaranteePeriod} m-cy</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {ocSummary(p)} / {stars}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openDetailFromBid(bid)}>
                            Szczegóły
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!detailApp || !!detailBid}
        onOpenChange={(o) => {
          if (!o) {
            setDetailApp(null);
            setDetailBid(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Szczegóły oferty:{' '}
              {detailApp?.contractorCompany || detailBid?.contractorCompany}
            </DialogTitle>
            <DialogDescription>Podsumowanie finansowe i dane wykonawcy</DialogDescription>
          </DialogHeader>
          {(detailApp || detailBid) && (
            <div className="space-y-4 text-sm">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Podsumowanie</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  {detailApp && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Kwota netto: </span>
                        <strong>{formatMoney(detailApp.proposedPrice)}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">VAT: </span>
                        {(detailApp.vatRate ?? 23)}% (
                        {formatMoney(
                          grossFromVat(detailApp.proposedPrice, detailApp.vatRate ?? 23) - detailApp.proposedPrice
                        )}
                        )
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kwota brutto: </span>
                        <strong>{formatMoney(grossFromVat(detailApp.proposedPrice, detailApp.vatRate ?? 23))}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Termin rozpoczęcia: </span>
                        {formatDate(detailApp.availableFrom)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Czas realizacji: </span>
                        {jobDurationLabel(detailApp)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gwarancja: </span>
                        {detailApp.guaranteePeriod}
                      </div>
                    </>
                  )}
                  {detailBid && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Kwota netto: </span>
                        <strong>{formatMoney(netFromBid(detailBid))}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">VAT: </span>
                        {DEFAULT_VAT}% (
                        {formatMoney(grossFromVat(netFromBid(detailBid), DEFAULT_VAT) - netFromBid(detailBid))}
                        )
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kwota brutto: </span>
                        <strong>{formatMoney(grossFromVat(netFromBid(detailBid), DEFAULT_VAT))}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Termin rozpoczęcia: </span>
                        {formatDate(detailBid.proposedStartDate)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Czas realizacji: </span>
                        {detailBid.proposedTimeline} dni
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gwarancja: </span>
                        {detailBid.guaranteePeriod} mies.
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div>
                <h4 className="font-semibold mb-1">Opis i podejście</h4>
                <blockquote className="border-l-4 pl-3 text-muted-foreground whitespace-pre-wrap">
                  {detailApp?.coverLetter || detailBid?.technicalProposal || '—'}
                </blockquote>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Załączniki</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {detailApp && detailApp.attachments?.length ? (
                    detailApp.attachments.map((f) => <li key={f.id}>{f.name}</li>)
                  ) : detailBid && detailBid.attachments?.length ? (
                    detailBid.attachments.map((raw, idx) => (
                      <li key={idx}>{String((raw as { name?: string }).name || 'Plik')}</li>
                    ))
                  ) : (
                    <li className="list-none pl-0 text-muted-foreground">Brak załączników</li>
                  )}
                </ul>
              </div>

              {detailProfile && (
                <div>
                  <h4 className="font-semibold mb-1">Profil wykonawcy</h4>
                  <ul className="space-y-1">
                    <li>
                      <strong>Status:</strong>{' '}
                      {detailProfile.verification?.status === 'verified'
                        ? `Zweryfikowana (NIP: ${detailProfile.businessInfo?.nip || '—'})`
                        : 'W trakcie weryfikacji'}
                    </li>
                    <li>
                      <strong>Ubezpieczenie OC:</strong>{' '}
                      {detailProfile.insurance?.hasOC
                        ? `Ważne do ${detailProfile.insurance.validUntil || '—'}`
                        : 'Brak'}
                    </li>
                    <li>
                      <strong>Doświadczenie:</strong> {detailProfile.experience?.completedProjects ?? 0}{' '}
                      zrealizowanych zleceń
                    </li>
                    <li>
                      <strong>Średnia ocen:</strong> ⭐{' '}
                      {(detailProfile.rating?.overall ?? detailApp?.contractorRating ?? detailBid?.contractorRating ?? 0).toFixed(1)}
                      /5.0
                      {detailProfile.rating?.reviewsCount != null && detailProfile.rating.reviewsCount > 0 && (
                        <span className="text-muted-foreground">
                          {' '}
                          (na podstawie {detailProfile.rating.reviewsCount}{' '}
                          opinii)
                        </span>
                      )}
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row pt-2">
                <Button
                  className="flex-1"
                  onClick={() => toast.success('Akceptacja oferty — podłączenie do procesu w kolejnej iteracji.')}
                >
                  Wybierz tę ofertę
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    openContact(detailApp?.contractorCompanyId || detailBid?.contractorCompanyId)
                  }
                >
                  Zapytaj o szczegóły
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kontakt do wykonawcy</DialogTitle>
            <DialogDescription>Skorzystaj z danych firmy lub wiadomości w portalu.</DialogDescription>
          </DialogHeader>
          {contactProfile && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{contactProfile.contactInfo?.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{contactProfile.contactInfo?.email || '—'}</span>
              </div>
            </div>
          )}
          {!contactProfile && <p className="text-sm text-muted-foreground">Brak danych kontaktowych w profilu.</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
