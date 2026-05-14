'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import {
  Send,
  Calculator,
  MapPin,
  Clock,
  Users,
  Eye,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  Paperclip,
  Loader2,
  Info,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { useUserProfile } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { createClient } from '../lib/supabase/client';
import { uploadJobAttachment } from '../lib/storage/job-attachments';

export interface JobApplicationFormFields {
  proposedPrice: string;
  vatRate: '8' | '23';
  workingDays: string;
  startDate: string;
  guaranteeMonths: string;
  estimatedCompletion: string;
  coverLetter: string;
  additionalNotes: string;
}

export interface JobApplicationSubmitPayload {
  id: string;
  contractorId: string;
  contractorName: string;
  proposedPrice: number;
  estimatedCompletion: string;
  coverLetter: string;
  additionalNotes?: string;
  submittedAt: Date;
  vatRate?: 8 | 23;
  workingDays?: number;
  startDate?: string;
  guaranteeMonths?: number;
  attachments?: Array<{ id: string; name: string; type: string; url: string; size: number }>;
}

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  jobId?: string;
  jobData?: Record<string, unknown>;
  onApplicationSubmit: (applicationData: JobApplicationSubmitPayload) => void | Promise<void>;
  applicationForm: JobApplicationFormFields;
  setApplicationForm: (form: JobApplicationFormFields) => void;
  postType?: 'job' | 'tender';
}

const COVER_LETTER_MIN = 50;
const MAX_STAGED_FILES = 10;

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  jobId,
  jobData,
  onApplicationSubmit,
  applicationForm,
  setApplicationForm,
  postType,
}) => {
  const { user } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const isTender = postType === 'tender';

  const formatApplicationsCount = (count: number): string => {
    if (count === 0) return 'Brak ofert';
    if (count === 1) return '1 oferta';

    const lastTwoDigits = count % 100;
    const lastDigit = count % 10;
    const useFewForm = lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14);

    return `${count} ${useFewForm ? 'oferty' : 'ofert'}`;
  };

  const applicationsRaw = (jobData as { applications?: number | string } | undefined)?.applications;
  const applicationsCount =
    typeof applicationsRaw === 'string' ? Number.parseInt(applicationsRaw, 10) : applicationsRaw;
  const hasApplicationsCount = Number.isFinite(applicationsCount) && (applicationsCount ?? -1) >= 0;
  const visitsCount = jobData ? (jobData as { visits_count?: number }).visits_count : undefined;
  const hasVisits = typeof visitsCount === 'number' && visitsCount > 0;

  const formatLocation = (location: string | { city: string; sublocality_level_1?: string } | undefined): string => {
    if (!location) return 'Nieznana lokalizacja';

    if (typeof location === 'string') {
      return location;
    }

    if (typeof location === 'object' && location !== null && 'city' in location) {
      if (location.sublocality_level_1) {
        return `${location.city || 'Nieznana'}, ${location.sublocality_level_1}`;
      }
      return location.city || 'Nieznana lokalizacja';
    }

    return 'Nieznana lokalizacja';
  };

  if (!isOpen) return null;

  const handleInputChange = (field: keyof JobApplicationFormFields, value: string) => {
    setApplicationForm({ ...applicationForm, [field]: value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateTender = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!applicationForm.proposedPrice) {
      newErrors.proposedPrice = 'Podaj proponowaną cenę';
    } else if (isNaN(Number(applicationForm.proposedPrice)) || Number(applicationForm.proposedPrice) <= 0) {
      newErrors.proposedPrice = 'Podaj prawidłową kwotę';
    }

    if (!applicationForm.estimatedCompletion) {
      newErrors.estimatedCompletion = 'Podaj przewidywany czas realizacji';
    }

    if (!applicationForm.coverLetter || applicationForm.coverLetter.length < COVER_LETTER_MIN) {
      newErrors.coverLetter = `Opis oferty musi mieć min. ${COVER_LETTER_MIN} znaków`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateJob = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!applicationForm.proposedPrice) {
      newErrors.proposedPrice = 'Podaj cenę netto';
    } else if (isNaN(Number(applicationForm.proposedPrice)) || Number(applicationForm.proposedPrice) <= 0) {
      newErrors.proposedPrice = 'Podaj prawidłową kwotę netto';
    }

    if (!applicationForm.startDate) {
      newErrors.startDate = 'Wybierz termin rozpoczęcia';
    }

    const wd = Number(applicationForm.workingDays);
    if (!applicationForm.workingDays || !Number.isInteger(wd) || wd < 1) {
      newErrors.workingDays = 'Podaj liczbę dni roboczych (min. 1)';
    }

    const gm = Number(applicationForm.guaranteeMonths);
    if (!applicationForm.guaranteeMonths || !Number.isInteger(gm) || gm < 1) {
      newErrors.guaranteeMonths = 'Podaj okres gwarancji w miesiącach (min. 1)';
    }

    if (!applicationForm.coverLetter || applicationForm.coverLetter.length < COVER_LETTER_MIN) {
      newErrors.coverLetter = `Opis musi mieć min. ${COVER_LETTER_MIN} znaków`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    setStagedFiles((prev) => {
      const next = [...prev, ...Array.from(files)];
      return next.slice(0, MAX_STAGED_FILES);
    });
    event.target.value = '';
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const valid = isTender ? validateTender() : validateJob();
    if (!valid) {
      toast.error('Wypełnij wszystkie wymagane pola');
      return;
    }

    setIsSubmitting(true);

    try {
      const basePayload: JobApplicationSubmitPayload = {
        id: Math.random().toString(36).substring(2, 11),
        contractorId: user?.id || '',
        contractorName: user?.firstName || '',
        proposedPrice: Number(applicationForm.proposedPrice),
        estimatedCompletion: isTender ? applicationForm.estimatedCompletion : '',
        coverLetter: applicationForm.coverLetter,
        additionalNotes: applicationForm.additionalNotes || undefined,
        submittedAt: new Date(),
      };

      if (!isTender) {
        basePayload.vatRate = applicationForm.vatRate === '8' ? 8 : 23;
        basePayload.workingDays = Math.floor(Number(applicationForm.workingDays));
        basePayload.startDate = applicationForm.startDate;
        basePayload.guaranteeMonths = Math.floor(Number(applicationForm.guaranteeMonths));

        if (!jobId || !user?.id) {
          toast.error('Brak identyfikatora zlecenia — odśwież stronę i spróbuj ponownie.');
          setIsSubmitting(false);
          return;
        }

        const supabase = createClient();
        const uploaded: Array<{ id: string; name: string; type: string; url: string; size: number }> = [];

        for (const file of stagedFiles) {
          const { data: up, error: upErr } = await uploadJobAttachment(supabase, file, user.id, jobId);
          if (upErr || !up) {
            toast.error(upErr?.message || 'Nie udało się przesłać załącznika');
            setIsSubmitting(false);
            return;
          }
          uploaded.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: file.name,
            type: up.type === 'image' ? 'portfolio' : 'other',
            url: up.url,
            size: file.size,
          });
        }

        if (uploaded.length > 0) {
          basePayload.attachments = uploaded;
        }
      }

      const result = onApplicationSubmit(basePayload);
      if (result instanceof Promise) {
        await result;
      }

      setStagedFiles([]);
      await new Promise((resolve) => setTimeout(resolve, 50));
      onClose();
    } catch {
      toast.error('Wystąpił błąd podczas wysyłania oferty');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-full lg:min-w-[800px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-3 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold">
            {isTender ? 'Złóż ofertę w przetargu' : 'Złóż ofertę'}
          </DialogTitle>
        </DialogHeader>

        <div className="border-b bg-gradient-to-b from-muted/50 to-background">
          <div className="space-y-4 px-6 py-5">
            <div className="flex gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                aria-hidden
              >
                {isTender ? <Briefcase className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold leading-snug text-foreground">{jobTitle}</h3>
                {(hasApplicationsCount || hasVisits) && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                    {hasApplicationsCount && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        {formatApplicationsCount(applicationsCount ?? 0)}
                      </span>
                    )}
                    {hasApplicationsCount && hasVisits && (
                      <span className="text-muted-foreground/50" aria-hidden>
                        ·
                      </span>
                    )}
                    {hasVisits && (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        {visitsCount} wyświetleń
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-card/60 p-3 shadow-sm sm:p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Szczegóły ogłoszenia
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
                <li className="flex min-w-0 gap-2.5">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <span className="block text-xs text-muted-foreground">Zamawiający</span>
                    <span className="text-sm font-medium text-foreground">{companyName}</span>
                  </div>
                </li>
                {jobData?.location && (
                  <li className="flex min-w-0 gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <span className="block text-xs text-muted-foreground">Lokalizacja</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatLocation(jobData.location as string | { city: string; sublocality_level_1?: string })}
                      </span>
                    </div>
                  </li>
                )}
                {jobData?.salary && (
                  <li className="flex min-w-0 gap-2.5">
                    <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600/80" aria-hidden />
                    <div className="min-w-0">
                      <span className="block text-xs text-muted-foreground">Budżet / stawka</span>
                      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-400/90">
                        {String((jobData as { salary?: string | number }).salary || '')}
                      </span>
                    </div>
                  </li>
                )}
                {jobData?.postedTime && (
                  <li className="flex min-w-0 gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <span className="block text-xs text-muted-foreground">Opublikowano</span>
                      <span className="text-sm font-medium text-foreground">
                        {String((jobData as { postedTime?: string | number }).postedTime || '')}
                      </span>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {(jobData?.category || isTender) && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Kategoria
                </p>
                <div className="flex flex-wrap gap-2">
                  {jobData?.category && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {String((jobData as { category?: string }).category || '')}
                    </Badge>
                  )}
                  {isTender && (
                    <Badge className="border-amber-200 bg-amber-50 text-xs font-normal text-amber-950 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                      Przetarg
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {jobData?.description && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Treść ogłoszenia
                </p>
                <div className="max-h-[7.5rem] overflow-y-auto rounded-md border border-border/80 bg-background px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
                  {String((jobData as { description?: string }).description || '')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {isTender ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Szczegóły oferty
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="proposedPrice">Proponowana cena (zł) *</Label>
                        <Input
                          id="proposedPrice"
                          type="number"
                          placeholder="np. 5000"
                          value={applicationForm.proposedPrice}
                          onChange={(e) => handleInputChange('proposedPrice', e.target.value)}
                          className={errors.proposedPrice ? 'border-red-500' : ''}
                        />
                        {errors.proposedPrice && <p className="text-red-500 text-sm mt-1">{errors.proposedPrice}</p>}
                      </div>
                      <div>
                        <Label htmlFor="estimatedCompletion">Czas realizacji *</Label>
                        <Select
                          value={applicationForm.estimatedCompletion}
                          onValueChange={(value) => handleInputChange('estimatedCompletion', value)}
                        >
                          <SelectTrigger
                            id="estimatedCompletion"
                            className={errors.estimatedCompletion ? 'border-red-500' : ''}
                            aria-label="Czas realizacji"
                          >
                            <SelectValue placeholder="Wybierz czas realizacji" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-3 dni">1-3 dni</SelectItem>
                            <SelectItem value="1 tydzień">1 tydzień</SelectItem>
                            <SelectItem value="2 tygodnie">2 tygodnie</SelectItem>
                            <SelectItem value="1 miesiąc">1 miesiąc</SelectItem>
                            <SelectItem value="2-3 miesiące">2-3 miesiące</SelectItem>
                            <SelectItem value="więcej niż 3 miesiące">Więcej niż 3 miesiące</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.estimatedCompletion && (
                          <p className="text-red-500 text-sm mt-1">{errors.estimatedCompletion}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Opis oferty *</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Opisz swoją ofertę, podejście do realizacji zlecenia, doświadczenie i to co wyróżnia Cię na tle konkurencji..."
                      value={applicationForm.coverLetter}
                      onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                      className={`min-h-[120px] ${errors.coverLetter ? 'border-red-500' : ''}`}
                    />
                    <div className="flex justify-between items-center mt-2">
                      {errors.coverLetter && <p className="text-red-500 text-sm">{errors.coverLetter}</p>}
                      <p className="text-gray-500 text-sm ml-auto">{applicationForm.coverLetter.length}/500 znaków</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dodatkowe uwagi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Dodatkowe informacje, pytania lub uwagi dotyczące zlecenia..."
                      value={applicationForm.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Dane ofertowe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="netPrice">Cena netto (PLN) *</Label>
                        <Input
                          id="netPrice"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="np. 5000"
                          value={applicationForm.proposedPrice}
                          onChange={(e) => handleInputChange('proposedPrice', e.target.value)}
                          className={errors.proposedPrice ? 'border-red-500' : ''}
                        />
                        {errors.proposedPrice && <p className="text-red-500 text-sm mt-1">{errors.proposedPrice}</p>}
                      </div>
                      <div>
                        <Label htmlFor="vatRate">VAT *</Label>
                        <Select
                          value={applicationForm.vatRate}
                          onValueChange={(v) => handleInputChange('vatRate', v as '8' | '23')}
                        >
                          <SelectTrigger id="vatRate">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="8">8%</SelectItem>
                            <SelectItem value="23">23%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="startDate">Termin rozpoczęcia *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={applicationForm.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          className={errors.startDate ? 'border-red-500' : ''}
                        />
                        {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                      </div>
                      <div>
                        <Label htmlFor="workingDays">Czas realizacji (dni robocze) *</Label>
                        <Input
                          id="workingDays"
                          type="number"
                          min={1}
                          step={1}
                          placeholder="np. 5"
                          value={applicationForm.workingDays}
                          onChange={(e) => handleInputChange('workingDays', e.target.value)}
                          className={errors.workingDays ? 'border-red-500' : ''}
                        />
                        {errors.workingDays && <p className="text-red-500 text-sm mt-1">{errors.workingDays}</p>}
                      </div>
                      <div>
                        <Label htmlFor="guaranteeMonths">Okres gwarancji (miesiące) *</Label>
                        <Input
                          id="guaranteeMonths"
                          type="number"
                          min={1}
                          step={1}
                          placeholder="np. 12"
                          value={applicationForm.guaranteeMonths}
                          onChange={(e) => handleInputChange('guaranteeMonths', e.target.value)}
                          className={errors.guaranteeMonths ? 'border-red-500' : ''}
                        />
                        {errors.guaranteeMonths && (
                          <p className="text-red-500 text-sm mt-1">{errors.guaranteeMonths}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Opis i podejście do zlecenia *</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder='Np. W cenie uwzględniono materiały i utylizację gruzu. Potrzebujemy dostępu do prądu i wody na klatce schodowej. Opisz zakres, terminy i to, co wyróżnia Twoją ofertę.'
                      value={applicationForm.coverLetter}
                      onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                      className={`min-h-[140px] ${errors.coverLetter ? 'border-red-500' : ''}`}
                    />
                    <div className="flex justify-between items-center">
                      {errors.coverLetter && <p className="text-red-500 text-sm">{errors.coverLetter}</p>}
                      <p className="text-gray-500 text-sm ml-auto">{applicationForm.coverLetter.length} znaków</p>
                    </div>
                    <div>
                      <Label htmlFor="additionalNotes">Dodatkowe uwagi (opcjonalnie)</Label>
                      <Textarea
                        id="additionalNotes"
                        placeholder="Inne informacje dla zamawiającego…"
                        value={applicationForm.additionalNotes}
                        onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                        className="min-h-[72px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Dokumentacja dodatkowa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <label className="cursor-pointer">
                          <Paperclip className="h-4 w-4 mr-2 inline" />
                          Dodaj pliki
                          <input type="file" className="hidden" multiple onChange={handleFileChange} />
                        </label>
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX, JPG, PNG (max. 10 MB / plik, do {MAX_STAGED_FILES} plików)
                      </span>
                    </div>
                    {stagedFiles.length > 0 && (
                      <ul className="text-sm space-y-1 border rounded-md p-3 bg-muted/30">
                        {stagedFiles.map((file, index) => (
                          <li key={`${file.name}-${file.size}-${index}`} className="flex justify-between gap-2">
                            <span className="truncate">{file.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeStagedFile(index)}>
                              Usuń
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </form>
        </div>

        <DialogFooter className="flex flex-col gap-0 border-t bg-muted/25 p-0 sm:flex-row sm:items-stretch sm:justify-start">
          <div
            className="flex gap-3 border-b px-4 py-3 sm:flex-1 sm:border-b-0 sm:border-r sm:px-5 sm:py-4"
            role="note"
          >
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="min-w-0 text-sm leading-relaxed text-foreground">
              <span className="font-semibold">Oferta jest wiążąca.</span>{' '}
              Po wysłaniu <span className="font-medium">nie można jej edytować</span>. Sprawdź dane przed wysłaniem.
            </p>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 sm:ml-auto sm:shrink-0 sm:items-center sm:px-5 sm:py-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isTender ? 'Wyślij wiążącą ofertę w przetargu' : 'Wyślij wiążącą ofertę'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationModal;
