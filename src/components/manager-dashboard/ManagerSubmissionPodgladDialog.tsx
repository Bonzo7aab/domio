'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { Calendar, MapPin, Phone, Mail, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '../../lib/supabase/client';
import { fetchJobById, fetchTenderById } from '../../lib/database/jobs';
import type { JobWithCompany, TenderWithCompany } from '../../lib/database/jobs';
import { getSubmissionStatusLabel, type ManagerSubmissionKind } from '../../lib/database/manager-submissions';
import {
  fetchAcceptedContractorForJob,
  type AcceptedContractorForJob,
} from '../../lib/database/reviews';
import { budgetFromDatabase, formatBudget } from '../../types/budget';
import { ManagerJobStatusSelect } from './ManagerJobStatusSelect';
import { ServiceReviewPanel } from '../reviews/ServiceReviewPanel';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export interface ManagerSubmissionPodgladTarget {
  id: string;
  kind: ManagerSubmissionKind;
}

interface ManagerSubmissionPodgladDialogProps {
  target: ManagerSubmissionPodgladTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobStatusUpdated?: (status: string) => void;
}

export function ManagerSubmissionPodgladDialog({
  target,
  open,
  onOpenChange,
  onJobStatusUpdated,
}: ManagerSubmissionPodgladDialogProps): ReactElement {
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<JobWithCompany | null>(null);
  const [tender, setTender] = useState<TenderWithCompany | null>(null);
  const [acceptedContractor, setAcceptedContractor] = useState<AcceptedContractorForJob | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (!open || !target) {
      setJob(null);
      setTender(null);
      setAcceptedContractor(null);
      setActiveTab('details');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setJob(null);
    setTender(null);
    setAcceptedContractor(null);
    setActiveTab('details');

    const run = async (): Promise<void> => {
      const supabase = createClient();
      try {
        if (target.kind === 'job') {
          const { data, error } = await fetchJobById(supabase, target.id);
          if (cancelled) return;
          if (error || !data) {
            toast.error('Nie udało się wczytać zgłoszenia');
            setJob(null);
          } else {
            setJob(data);
            if (data.status === 'completed') {
              const contractor = await fetchAcceptedContractorForJob(supabase, target.id);
              if (!cancelled) setAcceptedContractor(contractor);
            }
          }
        } else {
          const { data, error } = await fetchTenderById(supabase, target.id);
          if (cancelled) return;
          if (error || !data) {
            toast.error('Nie udało się wczytać przetargu');
            setTender(null);
          } else {
            setTender(data);
          }
        }
      } catch {
        if (!cancelled) toast.error('Błąd podczas ładowania');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, target]);

  const title =
    target?.kind === 'job' ? 'Szczegóły zgłoszenia' : 'Szczegóły przetargu';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Pełne informacje o zgłoszeniu (bez listy ofert).</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
            Ładowanie…
          </div>
        ) : job ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="text-sm">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="details">Szczegóły</TabsTrigger>
              <TabsTrigger value="rate-service" disabled={job.status !== 'completed' || !acceptedContractor}>
                Oceń Usługę
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-0">
            <div>
              <h2 className="text-2xl font-bold pr-8">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <ManagerJobStatusSelect
                  jobId={job.id}
                  status={job.status}
                  className="w-[220px]"
                  onUpdated={(next) => {
                    setJob((prev) => (prev ? { ...prev, status: next } : prev));
                    onJobStatusUpdated?.(next);
                    if (next === 'completed') {
                      void (async () => {
                        const supabase = createClient();
                        const contractor = await fetchAcceptedContractorForJob(supabase, job.id);
                        setAcceptedContractor(contractor);
                      })();
                    }
                  }}
                />
                <span className="text-muted-foreground">{job.category?.name || 'Inne'}</span>
              </div>
            </div>

            <p className="text-lg font-semibold">
              {job.budget
                ? formatBudget(job.budget)
                : formatBudget(
                    budgetFromDatabase({
                      budget_min: job.budget_min ?? null,
                      budget_max: job.budget_max ?? null,
                      budget_type: (job.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
                      currency: job.currency || 'PLN',
                    }),
                  )}
            </p>

            {(typeof job.location === 'string' ? job.location : job.location?.city) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>
                  {typeof job.location === 'string'
                    ? job.location
                    : job.location?.city || '—'}
                </span>
              </div>
            )}

            {job.deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Termin: {new Date(job.deadline).toLocaleDateString('pl-PL')}</span>
              </div>
            )}

            {job.description ? (
              <div>
                <h3 className="font-semibold mb-1">Opis</h3>
                <p className="text-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
            ) : null}

            {job.requirements && job.requirements.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-1">Wymagania</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {job.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {job.responsibilities && job.responsibilities.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-1">Zakres prac</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {job.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(job.contact_person || job.contact_phone || job.contact_email) && (
              <div>
                <h3 className="font-semibold mb-2">Kontakt</h3>
                <div className="space-y-1">
                  {job.contact_person && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span>{job.contact_person}</span>
                    </div>
                  )}
                  {job.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{job.contact_phone}</span>
                    </div>
                  )}
                  {job.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{job.contact_email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Zamknij
              </Button>
            </div>
            </TabsContent>

            <TabsContent value="rate-service" className="mt-0">
              {job.status !== 'completed' ? (
                <p className="text-muted-foreground py-4">
                  Ocena usługi będzie dostępna po oznaczeniu zgłoszenia jako ukończone.
                </p>
              ) : !acceptedContractor ? (
                <p className="text-muted-foreground py-4">
                  Brak zaakceptowanego wykonawcy — nie można wystawić oceny usługi.
                </p>
              ) : (
                <ServiceReviewPanel
                  jobId={job.id}
                  contractorCompanyId={acceptedContractor.companyId}
                  contractorName={acceptedContractor.companyName}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : tender ? (
          <div className="space-y-4 text-sm">
            <div>
              <h2 className="text-2xl font-bold pr-8">{tender.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline">
                  {getSubmissionStatusLabel('tender', tender.status)}
                </Badge>
                <span className="text-muted-foreground">{tender.category?.name || 'Inne'}</span>
              </div>
            </div>

            <p className="text-lg font-semibold">
              Szacowana wartość:{' '}
              {new Intl.NumberFormat('pl-PL', {
                style: 'currency',
                currency: tender.currency || 'PLN',
                maximumFractionDigits: 0,
              }).format(tender.estimated_value)}
            </p>

            {(typeof tender.location === 'string'
              ? tender.location
              : (tender.location as { city?: string })?.city) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>
                  {typeof tender.location === 'string'
                    ? tender.location
                    : (tender.location as { city?: string }).city || '—'}
                </span>
              </div>
            )}

            {tender.submission_deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  Termin składania ofert:{' '}
                  {new Date(tender.submission_deadline).toLocaleDateString('pl-PL')}
                </span>
              </div>
            )}

            {tender.evaluation_deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  Termin oceny: {new Date(tender.evaluation_deadline).toLocaleDateString('pl-PL')}
                </span>
              </div>
            )}

            {tender.project_duration && (
              <p className="text-muted-foreground">Czas realizacji: {tender.project_duration}</p>
            )}

            {tender.description ? (
              <div>
                <h3 className="font-semibold mb-1">Opis</h3>
                <p className="text-foreground whitespace-pre-wrap">{tender.description}</p>
              </div>
            ) : null}

            {tender.requirements && tender.requirements.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-1">Wymagania</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {tender.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Zamknij
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6">Brak danych do wyświetlenia.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
