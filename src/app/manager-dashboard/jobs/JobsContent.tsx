"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, UserCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { formatBudget } from '../../../types/budget';
import { getStatusBadgeConfig } from '../../../components/manager-dashboard/shared/utils';
import type { Budget } from '../../../types/budget';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { fetchJobById } from '../../../lib/database/jobs';
import { createClient } from '../../../lib/supabase/client';
import { toast } from 'sonner';
import { budgetFromDatabase } from '../../../types/budget';
import { Phone, Mail } from 'lucide-react';
import type { JobWithCompany } from '../../../lib/database/jobs';
import { getJobStatusMeta } from '../../../types/jobWorkflow';

interface Job {
  id: string;
  title: string;
  category: string;
  status: string;
  budget: Budget;
  applications: number;
  deadline: string;
  address: string;
}

interface JobsContentProps {
  jobs: Job[];
  companyId: string;
}

export function JobsContent({ jobs, companyId: _companyId }: JobsContentProps) {
  const router = useRouter();
  const [jobDetailsData, setJobDetailsData] = useState<JobWithCompany | null>(null);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [showJobDetailsDialog, setShowJobDetailsDialog] = useState(false);

  const escapeHtml = (value: string | null | undefined) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const handleDownloadTechnicalReport = (job: JobWithCompany) => {
    if (job.status !== 'completed') {
      toast.info('Raport PDF jest dostępny po zakończeniu zgłoszenia.');
      return;
    }

    const generatedAt = new Date().toLocaleDateString('pl-PL');
    const acceptedAt = new Date().toLocaleString('pl-PL');
    const budget = job.budget
      ? formatBudget(job.budget)
      : formatBudget(budgetFromDatabase({
          budget_min: job.budget_min ?? null,
          budget_max: job.budget_max ?? null,
          budget_type: (job.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
          currency: job.currency || 'PLN',
        }));
    const propertyLine = job.additional_info
      ?.split('\n')
      .find((line) => line.toLowerCase().startsWith('nieruchomość:'))
      ?.replace('Nieruchomość:', '')
      .trim() || 'Nieruchomość z profilu zarządcy';
    const beforePhotos = job.images?.length
      ? job.images.map((image, index) => `<div class="photo">Zdjęcie ${index + 1}: ${escapeHtml(image)}</div>`).join('')
      : '<div class="photo">Brak załączonych zdjęć</div>';

    const html = `
      <!doctype html>
      <html lang="pl">
        <head>
          <meta charset="utf-8" />
          <title>Protokół techniczny zakończenia prac</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; padding: 32px; line-height: 1.5; }
            header { border-bottom: 2px solid #1d4ed8; margin-bottom: 24px; padding-bottom: 16px; }
            .logo { font-weight: 800; color: #1d4ed8; font-size: 24px; }
            h1 { font-size: 24px; margin: 12px 0 4px; }
            h2 { font-size: 16px; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .photos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
            .photo { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; overflow-wrap: anywhere; font-size: 12px; }
            footer { margin-top: 32px; font-size: 13px; color: #4b5563; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          </style>
        </head>
        <body>
          <header>
            <div class="logo">DOMIO</div>
            <h1>Protokół techniczny zakończenia prac</h1>
            <div>ID zgłoszenia: ${escapeHtml(job.id)}</div>
            <div>Data wygenerowania: ${generatedAt}</div>
          </header>
          <section class="grid">
            <div class="box"><strong>Zleceniodawca:</strong><br />${escapeHtml(job.company?.name || 'Nazwa Firmy Zarządcy')} dla ${escapeHtml(propertyLine)}</div>
            <div class="box"><strong>Wykonawca:</strong><br />Nazwa Firmy Wykonawcy + NIP</div>
          </section>
          <h2>Zakres prac</h2>
          <p><strong>Tytuł:</strong> ${escapeHtml(job.title)}</p>
          <p><strong>Opis:</strong><br />${escapeHtml(job.description)}</p>
          <h2>Dokumentacja</h2>
          <h3>Zdjęcia przed naprawą</h3>
          <div class="photos">${beforePhotos}</div>
          <h3>Zdjęcia po naprawie</h3>
          <div class="photos"><div class="photo">Zdjęcia wykonawcy dodane przy odbiorze prac</div></div>
          <h2>Podsumowanie finansowe</h2>
          <p>Kwota netto/brutto zgodna z wybraną ofertą: ${escapeHtml(budget)}</p>
          <footer>
            Zaakceptowano cyfrowo przez ${escapeHtml(job.contact_person || 'Imię Zarządcy')} w systemie DOMIO.
            Data akceptacji cyfrowej: ${acceptedAt}.
          </footer>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Nie udało się otworzyć raportu. Sprawdź blokadę wyskakujących okien.');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleViewJobDetails = async (jobId: string) => {
    setShowJobDetailsDialog(true);
    setIsLoadingJobDetails(true);
    
    try {
      const supabase = createClient();
      const { data: jobData, error: jobError } = await fetchJobById(supabase, jobId);
      
      if (jobError || !jobData) {
        console.error('Error fetching job details:', jobError);
        toast.error('Nie udało się załadować szczegółów zlecenia');
        setJobDetailsData(null);
      } else {
        setJobDetailsData(jobData);
      }
    } catch (err) {
      console.error('Error loading job details:', err);
      toast.error('Wystąpił błąd podczas ładowania szczegółów zlecenia');
      setJobDetailsData(null);
    } finally {
      setIsLoadingJobDetails(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Zarządzanie zleceniami</h2>
        </div>

        <div className="grid gap-4">
          {jobs.length > 0 ? jobs.map((job) => {
            const statusConfig = getStatusBadgeConfig(job.status);
            const statusMeta = getJobStatusMeta(job.status);
            return (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{statusMeta.description}</p>
                      <p className="text-gray-600 mb-2">{job.category}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Termin: {job.deadline}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4" />
                          <span>{job.applications} ofert</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatBudget(job.budget)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewJobDetails(job.id)}
                        >
                          Szczegóły
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => router.push(`/manager-dashboard/jobs/${job.id}/applications`)}
                        >
                          Zobacz oferty
                        </Button>
                        {job.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewJobDetails(job.id)}
                          >
                            Raport PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Brak zleceń</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={showJobDetailsDialog} onOpenChange={(open) => {
        setShowJobDetailsDialog(open);
        if (!open) {
          setJobDetailsData(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Szczegóły zlecenia</DialogTitle>
            <DialogDescription>
              Pełne informacje o zleceniu
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingJobDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">Ładowanie szczegółów...</p>
            </div>
          ) : jobDetailsData ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{jobDetailsData.title}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    {(() => {
                      const statusConfig = getStatusBadgeConfig(jobDetailsData.status);
                      return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
                    })()}
                    <span className="text-sm text-gray-600">
                      {jobDetailsData.category?.name || 'Inne'}
                    </span>
                  </div>
                </div>
              </div>

              {jobDetailsData.status === 'completed' && (
                <Button onClick={() => handleDownloadTechnicalReport(jobDetailsData)}>
                  Pobierz raport PDF
                </Button>
              )}

              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {jobDetailsData.budget 
                    ? formatBudget(jobDetailsData.budget)
                    : formatBudget(budgetFromDatabase({
                        budget_min: jobDetailsData.budget_min ?? null,
                        budget_max: jobDetailsData.budget_max ?? null,
                        budget_type: (jobDetailsData.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
                        currency: jobDetailsData.currency || 'PLN',
                      }))}
                </span>
              </div>

              {typeof jobDetailsData.location === 'string' 
                ? jobDetailsData.location 
                : jobDetailsData.location?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {typeof jobDetailsData.location === 'string' 
                        ? jobDetailsData.location 
                        : jobDetailsData.location?.city || 'Nieznana lokalizacja'}
                    </span>
                  </div>
              )}

              {jobDetailsData.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    Termin: {new Date(jobDetailsData.deadline).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              )}

              {jobDetailsData.description && (
                <div>
                  <h3 className="font-semibold mb-2">Opis zlecenia</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{jobDetailsData.description}</p>
                </div>
              )}

              {jobDetailsData.requirements && jobDetailsData.requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Wymagania</h3>
                  <ul className="space-y-1">
                    {jobDetailsData.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {jobDetailsData.responsibilities && jobDetailsData.responsibilities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Zakres prac</h3>
                  <ul className="space-y-1">
                    {jobDetailsData.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-gray-700">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(jobDetailsData.contact_person || jobDetailsData.contact_phone || jobDetailsData.contact_email) && (
                <div>
                  <h3 className="font-semibold mb-2">Informacje kontaktowe</h3>
                  <div className="space-y-1 text-sm">
                    {jobDetailsData.contact_person && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_person}</span>
                      </div>
                    )}
                    {jobDetailsData.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_phone}</span>
                      </div>
                    )}
                    {jobDetailsData.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nie udało się załadować szczegółów zlecenia</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
