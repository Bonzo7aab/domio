'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import type { ContestInfo } from '../../types/job';
import type { ContestOfferFormData, ResolvedContractorDocument } from '../../types/contest-offer';
import {
  computeGrossFromNet,
  createEmptyContestOfferForm,
} from '../../types/contest-offer';
import { createClient } from '../../lib/supabase/client';
import {
  completionDateWarning,
  contestCountdownLabel,
  fetchTenderBidDraft,
  hydrateContestOfferFormFromBid,
  submitTenderBid,
  upsertTenderBidDraft,
  validateContestOfferSubmit,
} from '../../lib/database/contest-offers';
import {
  loadContractorReferencesPrefill,
  resolveContractorDocuments,
} from '../../lib/contest-offer/resolve-contractor-documents';
import {
  formatMonthsLabel,
  warrantyMonthsOptions,
} from '../../lib/contest-offer/warranty-period-options';
import { CONTRACTOR_VERIFICATION_DOCUMENTS_PATH } from '../../lib/verification/documents-route';

const STEP_LABELS = [
  'Informacje',
  'Harmonogram',
  'Wymogi formalne',
  'Warunki finansowe',
];

export interface ContestOfferSubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: string;
  jobTitle: string;
  description: string;
  category?: string;
  subcategory?: string;
  contestInfo: ContestInfo;
  contractorId: string;
  onSubmitted?: () => void;
  onDraftSaved?: () => void;
}

export function ContestOfferSubmissionDialog({
  isOpen,
  onClose,
  tenderId,
  jobTitle,
  description,
  category,
  subcategory,
  contestInfo,
  contractorId,
  onSubmitted,
  onDraftSaved,
}: ContestOfferSubmissionDialogProps): React.ReactElement {
  const supabase = useMemo(() => createClient(), []);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<ContestOfferFormData>(createEmptyContestOfferForm);
  const [resolvedDocs, setResolvedDocs] = useState<ResolvedContractorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const warrantyOptions = warrantyMonthsOptions(contestInfo.warrantyPeriod);
  const guaranteeOptions = warrantyMonthsOptions(contestInfo.guaranteePeriod);

  const grossDisplay = useMemo(() => {
    const net = Number.parseFloat(form.netPrice);
    if (!form.netPrice.trim() || Number.isNaN(net) || net <= 0) return '—';
    return computeGrossFromNet(net, form.vatRate).toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [form.netPrice, form.vatRate]);

  const completionWarning = completionDateWarning(
    form.proposedCompletionDate,
    contestInfo.completionDate,
  );

  const loadInitial = useCallback(async () => {
    if (!isOpen || !contractorId) return;
    setIsLoading(true);
    try {
      const [{ data: draft }, docs, referencesPrefill] = await Promise.all([
        fetchTenderBidDraft(supabase, tenderId, contractorId),
        resolveContractorDocuments(supabase, contractorId, contestInfo.formalRequirements),
        loadContractorReferencesPrefill(supabase, contractorId),
      ]);
      setResolvedDocs(docs);

      if (draft) {
        const hydrated = hydrateContestOfferFormFromBid(draft);
        if (draft.offer_details && typeof draft.offer_details === 'object') {
          const step = (draft.offer_details as { currentStep?: number }).currentStep;
          if (step && step >= 1 && step <= 4) setCurrentStep(step);
        }
        setForm(hydrated);
      } else {
        const empty = createEmptyContestOfferForm();
        if (referencesPrefill) empty.referencesText = referencesPrefill;
        if (contestInfo.paymentTerms.mode === 'standard_14') {
          empty.paymentTermsAccepted = true;
        }
        setForm(empty);
        setCurrentStep(1);
      }
    } catch (e) {
      console.error(e);
      toast.error('Nie udało się załadować szkicu oferty');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, contractorId, supabase, tenderId, contestInfo]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const patchForm = (patch: Partial<ContestOfferFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const { error } = await upsertTenderBidDraft(
        supabase,
        tenderId,
        contractorId,
        form,
        currentStep,
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Szkic oferty został zapisany');
      onDraftSaved?.();
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    const err = validateContestOfferSubmit(form, contestInfo);
    if (err) {
      toast.error(err);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await submitTenderBid(
        supabase,
        tenderId,
        contractorId,
        form,
        contestInfo,
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Oferta została wysłana do sejfu');
      onSubmitted?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageFile = (key: keyof ContestOfferFormData['stagedFiles'], file: File) => {
    setForm((prev) => ({
      ...prev,
      stagedFiles: { ...prev.stagedFiles, [key]: [file] },
    }));
  };

  const applyProfileDocument = (doc: ResolvedContractorDocument) => {
    if (!doc.path) return;
    patchForm({
      formalAttachments: {
        ...form.formalAttachments,
        [doc.requirementKey]: {
          id: `profile-${doc.requirementKey}`,
          name: doc.fileName ?? doc.label,
          path: doc.path,
          url: doc.signedUrl ?? undefined,
          type: 'document',
          source: 'profile',
          requirementKey: doc.requirementKey,
        },
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] min-h-0 flex-col gap-0 overflow-hidden p-0 lg:max-w-3xl">
        <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4 pr-12">
          <DialogTitle className="text-left text-lg leading-snug">
            Składasz ofertę w konkursie: {jobTitle}
          </DialogTitle>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            Czas na złożenie oferty: {contestCountdownLabel(contestInfo.submissionDeadline)}
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Krok {currentStep} z {totalSteps}: {STEP_LABELS[currentStep - 1]}
              </span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-1.5" />
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Opis konkursu</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-4 grid gap-3 sm:grid-cols-2">
                    {category && (
                      <div>
                        <div className="text-xs text-muted-foreground">Kategoria</div>
                        <div className="font-medium">{category}</div>
                      </div>
                    )}
                    {subcategory && (
                      <div>
                        <div className="text-xs text-muted-foreground">Podkategoria</div>
                        <div className="font-medium">{subcategory}</div>
                      </div>
                    )}
                    {contestInfo.buildingName && (
                      <div>
                        <div className="text-xs text-muted-foreground">Nieruchomość</div>
                        <div className="font-medium">{contestInfo.buildingName}</div>
                      </div>
                    )}
                    {contestInfo.buildingAddress && (
                      <div>
                        <div className="text-xs text-muted-foreground">Adres</div>
                        <div className="font-medium">{contestInfo.buildingAddress}</div>
                      </div>
                    )}
                  </div>
                  {contestInfo.documents.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Dokumentacja</h3>
                      <ul className="space-y-2">
                        {contestInfo.documents.map((doc) => (
                          <li key={doc.id} className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 shrink-0" />
                            {doc.url ? (
                              <Link
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {doc.name}
                              </Link>
                            ) : (
                              <span>{doc.name}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Termin składania ofert</Label>
                    <p className="font-medium">
                      Oferty przyjmowane są do:{' '}
                      {new Date(contestInfo.submissionDeadline).toLocaleString('pl-PL', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="proposedCompletionDate">Oferowany termin wykonania *</Label>
                    <Input
                      id="proposedCompletionDate"
                      type="date"
                      value={form.proposedCompletionDate}
                      onChange={(e) => patchForm({ proposedCompletionDate: e.target.value })}
                      className="mt-1"
                    />
                    {completionWarning && (
                      <Alert variant="default" className="mt-2 border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-700" />
                        <AlertDescription className="text-amber-900">
                          {completionWarning}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Wizja lokalna</span>
                      <p className="font-medium">{contestInfo.siteVisitTypeLabel}</p>
                    </div>
                    {contestInfo.siteVisitNotes && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {contestInfo.siteVisitNotes}
                      </p>
                    )}
                    {contestInfo.siteVisitType === 'mandatory' && (
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={form.siteVisitConfirmed}
                          onCheckedChange={(v) => patchForm({ siteVisitConfirmed: v === true })}
                        />
                        <span className="text-sm leading-snug">
                          Potwierdzam odbycie wizji lokalnej w terminie wskazanym przez zarządcę.
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  {resolvedDocs.map((doc) => (
                    <FormalDocBlock
                      key={doc.requirementKey}
                      doc={doc}
                      attached={form.formalAttachments[doc.requirementKey]}
                      stagedName={form.stagedFiles[doc.requirementKey]?.[0]?.name}
                      onUseProfile={() => applyProfileDocument(doc)}
                      onUpload={(file) => stageFile(doc.requirementKey, file)}
                    />
                  ))}
                  {contestInfo.formalRequirements.references && (
                    <div>
                      <Label htmlFor="referencesText">Referencje – wykaz zrealizowanych prac *</Label>
                      {contestInfo.formalRequirementLines
                        .filter((l) => l.toLowerCase().includes('referenc'))
                        .map((line) => (
                          <p key={line} className="text-xs text-muted-foreground mt-1 mb-2">
                            {line}
                          </p>
                        ))}
                      <Textarea
                        id="referencesText"
                        rows={5}
                        value={form.referencesText}
                        onChange={(e) => patchForm({ referencesText: e.target.value })}
                      />
                    </div>
                  )}
                  <div>
                    <Label>Inne załączniki</Label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      className="mt-1"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) stageFile('other', file);
                      }}
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="netPrice">Cena NETTO za całość prac (zł) *</Label>
                      <Input
                        id="netPrice"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.netPrice}
                        onChange={(e) => patchForm({ netPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Stawka VAT *</Label>
                      <Select
                        value={form.vatRate}
                        onValueChange={(v) =>
                          patchForm({ vatRate: v as ContestOfferFormData['vatRate'] })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8">8%</SelectItem>
                          <SelectItem value="23">23%</SelectItem>
                          <SelectItem value="zw">zw.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Cena BRUTTO</Label>
                    <p className="text-lg font-semibold mt-1">{grossDisplay} zł</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Oferowany okres gwarancji *</Label>
                      <Select
                        value={form.warrantyMonths}
                        onValueChange={(v) => patchForm({ warrantyMonths: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Wybierz" />
                        </SelectTrigger>
                        <SelectContent>
                          {warrantyOptions.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              {formatMonthsLabel(m)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Oferowany okres rękojmi *</Label>
                      <Select
                        value={form.guaranteeMonths}
                        onValueChange={(v) => patchForm({ guaranteeMonths: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Wybierz" />
                        </SelectTrigger>
                        <SelectContent>
                          {guaranteeOptions.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              {formatMonthsLabel(m)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {contestInfo.depositRequired && (
                    <div className="rounded-lg border p-4 space-y-3">
                      <div>
                        <span className="font-medium">Wadium</span>
                        {contestInfo.depositAmount != null && (
                          <p className="text-sm">
                            Kwota: {contestInfo.depositAmount.toLocaleString('pl-PL')} zł
                          </p>
                        )}
                        {contestInfo.depositInstructions && (
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {contestInfo.depositInstructions}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Wgraj potwierdzenie przelewu wadium (PDF) *</Label>
                        <Input
                          type="file"
                          accept=".pdf,image/*"
                          className="mt-1"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) stageFile('deposit', file);
                          }}
                        />
                        {form.stagedFiles.deposit?.[0] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Wybrano: {form.stagedFiles.deposit[0].name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {contestInfo.paymentTerms.mode === 'custom' &&
                    (contestInfo.paymentTerms.customDays ?? 0) > 14 && (
                      <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                          checked={form.paymentTermsAccepted}
                          onCheckedChange={(v) => patchForm({ paymentTermsAccepted: v === true })}
                        />
                        <span className="text-sm leading-snug">
                          Akceptuję wymagany przez zarządcę termin płatności faktury wynoszący{' '}
                          {contestInfo.paymentTerms.customDays} dni.
                        </span>
                      </label>
                    )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep <= 1 || isLoading}
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Wstecz
            </Button>
            {currentStep < totalSteps && (
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => setCurrentStep((s) => Math.min(totalSteps, s + 1))}
              >
                Dalej
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingDraft || isLoading}
              onClick={() => void handleSaveDraft()}
            >
              {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Zapisz jako szkic
            </Button>
            {currentStep === totalSteps && (
              <Button
                type="button"
                className="bg-blue-800 hover:bg-blue-900"
                disabled={isSubmitting || isLoading}
                onClick={() => void handleSubmit()}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Wyślij ofertę do sejfu
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormalDocBlock({
  doc,
  attached,
  stagedName,
  onUseProfile,
  onUpload,
}: {
  doc: ResolvedContractorDocument;
  attached?: { name: string; source: string };
  stagedName?: string;
  onUseProfile: () => void;
  onUpload: (file: File) => void;
}): React.ReactElement {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="font-medium">{doc.label}</div>
      {doc.missing ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          Brak dokumentu w Twoim profilu.{' '}
          <Link
            href={CONTRACTOR_VERIFICATION_DOCUMENTS_PATH}
            className="text-primary inline-flex items-center gap-1 hover:underline"
          >
            Uzupełnij w profilu
            <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>Dokument w profilu:</span>
          {doc.signedUrl ? (
            <Link href={doc.signedUrl} target="_blank" className="text-primary hover:underline">
              {doc.fileName}
            </Link>
          ) : (
            <span>{doc.fileName}</span>
          )}
          {doc.hint && <Badge variant="secondary">{doc.hint}</Badge>}
          <Button type="button" size="sm" variant="outline" onClick={onUseProfile}>
            Użyj z profilu
          </Button>
        </div>
      )}
      <div>
        <Label className="text-xs">Lub wgraj dokument do tej oferty</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
          <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
        {(attached || stagedName) && (
          <p className="text-xs text-muted-foreground mt-1">
            Do oferty: {stagedName ?? attached?.name} ({attached?.source ?? 'nowy plik'})
          </p>
        )}
      </div>
    </div>
  );
}
