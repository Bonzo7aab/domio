'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import type { ContestInfo } from '../../types/job';
import type {
  ContestOfferFormData,
  FormalRequirementKey,
  ResolvedContractorDocument,
} from '../../types/contest-offer';
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
  firstContestOfferStepWithErrors,
  filterFieldErrorsForStep,
  getContestOfferAllFieldErrors,
  getContestOfferStepFieldErrors,
  hasContestOfferFieldErrors,
  type ContestOfferFieldErrors,
  type ContestOfferWizardStep,
} from '../../lib/database/contest-offers';
import {
  applyProfileDocumentsToForm,
  buildFormalAttachmentFromProfile,
} from '../../lib/contest-offer/build-profile-formal-attachment';
import {
  loadContractorReferencesPrefill,
  resolveContractorDocuments,
} from '../../lib/contest-offer/resolve-contractor-documents';
import { ContestOfferWizardStepper } from './ContestOfferWizardStepper';
import { ContestOfferStepOverview } from './ContestOfferStepOverview';
import { ContestOfferStepSchedule } from './ContestOfferStepSchedule';
import { ContestOfferStepFormal } from './ContestOfferStepFormal';
import { ContestOfferStepFinancial } from './ContestOfferStepFinancial';

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
  const [currentStep, setCurrentStep] = useState<ContestOfferWizardStep>(1);
  const [form, setForm] = useState<ContestOfferFormData>(createEmptyContestOfferForm);
  const [resolvedDocs, setResolvedDocs] = useState<ResolvedContractorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ContestOfferFieldErrors>({});
  const profileDocsAppliedRef = useRef(false);

  const totalSteps = 4;

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
          if (step && step >= 1 && step <= 4) {
            setCurrentStep(step as ContestOfferWizardStep);
          }
        }
        hydrated.formalAttachments = applyProfileDocumentsToForm(
          docs,
          hydrated.formalAttachments,
        ) as ContestOfferFormData['formalAttachments'];
        setForm(hydrated);
      } else {
        const empty = createEmptyContestOfferForm();
        if (referencesPrefill) empty.referencesText = referencesPrefill;
        if (contestInfo.paymentTerms.mode === 'standard_14') {
          empty.paymentTermsAccepted = true;
        }
        empty.formalAttachments = applyProfileDocumentsToForm(
          docs,
          empty.formalAttachments,
        ) as ContestOfferFormData['formalAttachments'];
        setForm(empty);
        setCurrentStep(1);
        profileDocsAppliedRef.current = true;
      }
      setFieldErrors({});
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

  useEffect(() => {
    if (!isOpen) {
      profileDocsAppliedRef.current = false;
      setFieldErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep !== 3 || isLoading || profileDocsAppliedRef.current) return;
    profileDocsAppliedRef.current = true;
    setForm((prev) => ({
      ...prev,
      formalAttachments: applyProfileDocumentsToForm(
        resolvedDocs,
        prev.formalAttachments,
      ) as ContestOfferFormData['formalAttachments'],
    }));
  }, [currentStep, isLoading, resolvedDocs]);

  const displayedFieldErrors = useMemo(
    () => filterFieldErrorsForStep(currentStep, fieldErrors),
    [currentStep, fieldErrors],
  );

  const patchForm = (patch: Partial<ContestOfferFormData>): void => {
    setFieldErrors({});
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSaveDraft = async (): Promise<void> => {
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

  const handleSubmit = async (): Promise<void> => {
    const allErrors = getContestOfferAllFieldErrors(form, contestInfo);
    if (hasContestOfferFieldErrors(allErrors)) {
      setFieldErrors(allErrors);
      const targetStep = firstContestOfferStepWithErrors(allErrors);
      if (targetStep) setCurrentStep(targetStep);
      return;
    }
    setFieldErrors({});
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

  const handleNextStep = (): void => {
    const errors = getContestOfferStepFieldErrors(currentStep, form, contestInfo);
    if (hasContestOfferFieldErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setCurrentStep((s) => Math.min(totalSteps, s + 1) as ContestOfferWizardStep);
  };

  const handlePrevStep = (): void => {
    setFieldErrors({});
    setCurrentStep((s) => Math.max(1, s - 1) as ContestOfferWizardStep);
  };

  const stageFile = (key: keyof ContestOfferFormData['stagedFiles'], file: File): void => {
    setFieldErrors({});
    setForm((prev) => ({
      ...prev,
      stagedFiles: { ...prev.stagedFiles, [key]: [file] },
    }));
  };

  const removeFormalDocument = (key: FormalRequirementKey): void => {
    setForm((prev) => {
      const { [key]: _attachment, ...formalAttachments } = prev.formalAttachments;
      const { [key]: _staged, ...stagedFiles } = prev.stagedFiles;
      return { ...prev, formalAttachments, stagedFiles };
    });
    setFieldErrors({});
  };

  const replaceFormalDocument = (key: FormalRequirementKey, file: File): void => {
    setForm((prev) => {
      const { [key]: _attachment, ...formalAttachments } = prev.formalAttachments;
      return {
        ...prev,
        formalAttachments,
        stagedFiles: { ...prev.stagedFiles, [key]: [file] },
      };
    });
    setFieldErrors({});
  };

  const applyProfileDocument = (doc: ResolvedContractorDocument): void => {
    const attachment = buildFormalAttachmentFromProfile(doc);
    if (!attachment) return;
    setForm((prev) => {
      const { [doc.requirementKey]: _staged, ...stagedFiles } = prev.stagedFiles;
      return {
        ...prev,
        formalAttachments: {
          ...prev.formalAttachments,
          [doc.requirementKey]: attachment,
        },
        stagedFiles,
      };
    });
    setFieldErrors({});
  };

  const removeExtraAttachment = (id: string): void => {
    setFieldErrors({});
    setForm((prev) => ({
      ...prev,
      extraAttachments: prev.extraAttachments.filter((a) => a.id !== id),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] min-h-0 flex-col gap-0 overflow-hidden p-0 lg:max-w-4xl">
        <DialogHeader className="shrink-0 space-y-3 border-b bg-muted/30 px-6 py-4 pr-12">
          <div className="space-y-1">
            <DialogTitle className="text-left text-lg leading-snug">
              Składasz ofertę w konkursie
            </DialogTitle>
            <DialogDescription className="text-left text-sm">
              <span className="font-medium text-foreground">{jobTitle}</span>
            </DialogDescription>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <span>
              Czas na złożenie:{' '}
              <span className="font-medium text-foreground">
                {contestCountdownLabel(contestInfo.submissionDeadline)}
              </span>
            </span>
          </p>
          <ContestOfferWizardStepper
            currentStep={currentStep}
            totalSteps={totalSteps}
            labels={STEP_LABELS}
          />
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <ContestOfferStepOverview
                  description={description}
                  category={category}
                  subcategory={subcategory}
                  contestInfo={contestInfo}
                />
              )}
              {currentStep === 2 && (
                <ContestOfferStepSchedule
                  form={form}
                  contestInfo={contestInfo}
                  completionWarning={completionWarning}
                  fieldErrors={displayedFieldErrors}
                  onPatch={patchForm}
                />
              )}
              {currentStep === 3 && (
                <ContestOfferStepFormal
                  form={form}
                  contestInfo={contestInfo}
                  resolvedDocs={resolvedDocs}
                  fieldErrors={displayedFieldErrors}
                  onPatch={patchForm}
                  onUseProfile={applyProfileDocument}
                  onUploadFormal={replaceFormalDocument}
                  onRemoveFormal={removeFormalDocument}
                  onStageOther={(file) => stageFile('other', file)}
                  onRemoveExtra={removeExtraAttachment}
                />
              )}
              {currentStep === 4 && (
                <ContestOfferStepFinancial
                  form={form}
                  contestInfo={contestInfo}
                  grossDisplay={grossDisplay}
                  fieldErrors={displayedFieldErrors}
                  onPatch={patchForm}
                  onStageDeposit={(file) => stageFile('deposit', file)}
                />
              )}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep <= 1 || isLoading}
              onClick={handlePrevStep}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Wstecz
            </Button>
            {currentStep < totalSteps && (
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={handleNextStep}
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
