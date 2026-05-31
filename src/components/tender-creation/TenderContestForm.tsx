'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { File, FileText, Plus, Save, Send, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { FileRejection } from 'react-dropzone';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '../ui/dropzone';
import { useUserProfile } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase/client';
import { fetchUserPrimaryCompany } from '../../lib/database/companies';
import { fetchAllCategoriesWithSubcategories } from '../../lib/database/categories';
import type { CategoryWithSubcategories } from '../../lib/database/categories';
import { fetchCompanyBuildings } from '../../lib/database/buildings';
import type { Building } from '../../types/building';
import {
  formatGroupedBuildingLabel,
  groupBuildingsForSelection,
  resolvePrimaryBuildingId,
} from '../../lib/buildings/grouping';
import type {
  SelectionCriterionItem,
  TenderContestDocumentMeta,
  TenderContestFormData,
  WarrantyGuaranteePeriod,
} from '../../types/tender-contest';
import {
  createEmptyTenderContestForm,
  selectionCriteriaTotalWeight,
} from '../../types/tender-contest';

export interface TenderContestFormProps {
  onSubmit: (
    form: TenderContestFormData,
    newFiles: File[],
    keptDocuments: TenderContestDocumentMeta[],
    status: 'draft' | 'active',
  ) => void | Promise<void>;
  isSubmitting?: boolean;
  initialForm?: TenderContestFormData;
  existingDocuments?: TenderContestDocumentMeta[];
}

const PERIOD_OPTIONS: { value: WarrantyGuaranteePeriod; label: string }[] = [
  { value: 'none', label: 'Brak' },
  { value: 'min_12', label: 'Min. 12 mies.' },
  { value: 'min_24', label: 'Min. 24 mies.' },
  { value: 'min_36', label: 'Min. 36 mies.' },
  { value: 'other', label: 'Inny' },
];

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDateInputValue(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isCompletionOnOrBeforeSubmission(completion: Date, submission: Date): boolean {
  const completionDay = new Date(completion);
  completionDay.setHours(0, 0, 0, 0);
  const submissionDay = new Date(submission);
  submissionDay.setHours(0, 0, 0, 0);
  return completionDay.getTime() <= submissionDay.getTime();
}

function minCompletionDateAfterSubmission(submission: Date): string {
  const min = new Date(submission);
  min.setDate(min.getDate() + 1);
  return toDateInputValue(min);
}

function validateContestFormConsistency(form: TenderContestFormData): string | null {
  if (
    form.evaluationDeadline &&
    form.submissionDeadline &&
    !Number.isNaN(form.submissionDeadline.getTime()) &&
    form.evaluationDeadline.getTime() <= form.submissionDeadline.getTime()
  ) {
    return 'Rozstrzygnięcie konkursu musi być po dacie zakończenia przyjmowania ofert';
  }
  if (
    (form.siteVisitType === 'optional' || form.siteVisitType === 'mandatory') &&
    !form.siteVisitNotes.trim()
  ) {
    return 'Podaj osobę do kontaktu i terminy wizji lokalnej';
  }
  if (
    form.completionDate &&
    form.submissionDeadline &&
    !Number.isNaN(form.submissionDeadline.getTime()) &&
    isCompletionOnOrBeforeSubmission(form.completionDate, form.submissionDeadline)
  ) {
    return 'Termin wykonania musi być po dacie zakończenia przyjmowania ofert';
  }
  if (form.depositRequired) {
    if (form.depositAmount == null || form.depositAmount <= 0) {
      return 'Podaj kwotę wadium';
    }
    if (!form.depositInstructions.trim()) return 'Podaj instrukcję wpłaty wadium';
  }
  if (form.paymentTerms.mode === 'custom') {
    const days = form.paymentTerms.customDays;
    if (days == null || days < 1) return 'Podaj liczbę dni na płatność faktury';
  }
  return null;
}

function validateContestForm(
  form: TenderContestFormData,
  pendingFiles: File[],
  existingDocs: TenderContestDocumentMeta[],
  hasBuildings: boolean,
  status: 'draft' | 'active',
): string | null {
  if (form.title.length > 75) return 'Tytuł może mieć maksymalnie 75 znaków';

  const consistencyError = validateContestFormConsistency(form);
  if (consistencyError) return consistencyError;

  if (status === 'draft') {
    return null;
  }

  if (!form.title.trim()) return 'Podaj tytuł konkursu';
  if (!form.description.trim()) return 'Podaj szczegółowy zakres i uwagi';
  if (hasBuildings && !form.buildingId) return 'Wybierz nieruchomość';
  if (!form.category) return 'Wybierz kategorię';
  if (!form.subcategory) return 'Wybierz podkategorię';
  if (pendingFiles.length + existingDocs.length < 1) {
    return 'Dodaj co najmniej jeden plik dokumentacji konkursowej';
  }
  if (!form.submissionDeadline || Number.isNaN(form.submissionDeadline.getTime())) {
    return 'Podaj datę i godzinę zakończenia przyjmowania ofert';
  }
  if (!form.evaluationDeadline || Number.isNaN(form.evaluationDeadline.getTime())) {
    return 'Podaj datę rozstrzygnięcia konkursu';
  }

  const criteriaItems = form.selectionCriteria.items;
  if (criteriaItems.length === 0) return 'Dodaj co najmniej jedno kryterium wyboru';
  for (const item of criteriaItems) {
    if (!item.name.trim()) return 'Podaj nazwę każdego kryterium wyboru';
  }
  const criteriaSum = selectionCriteriaTotalWeight(criteriaItems);
  if (criteriaSum !== 100) return 'Suma wag kryteriów wyboru musi wynosić 100%';

  return null;
}

export function TenderContestForm({
  onSubmit,
  isSubmitting = false,
  initialForm,
  existingDocuments,
}: TenderContestFormProps): React.ReactElement {
  const { user } = useUserProfile();
  const supabase = createClient();
  const [form, setForm] = useState<TenderContestFormData>(
    initialForm ?? createEmptyTenderContestForm(),
  );
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [categoriesFromDb, setCategoriesFromDb] = useState<CategoryWithSubcategories[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [keptDocuments, setKeptDocuments] = useState<TenderContestDocumentMeta[]>(
    () => existingDocuments ?? [],
  );

  const groupedBuildingOptions = useMemo(
    () => groupBuildingsForSelection(buildings),
    [buildings],
  );

  const hasValidSubmissionDeadline = useMemo(
    () => Boolean(form.submissionDeadline && !Number.isNaN(form.submissionDeadline.getTime())),
    [form.submissionDeadline],
  );

  const completionMinDate = useMemo(() => {
    if (!hasValidSubmissionDeadline) return undefined;
    return minCompletionDateAfterSubmission(form.submissionDeadline);
  }, [form.submissionDeadline, hasValidSubmissionDeadline]);

  useEffect(() => {
    if (!initialForm) return;
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    if (existingDocuments === undefined) return;
    setKeptDocuments(existingDocuments);
  }, [existingDocuments]);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!user?.id) {
        setIsLoadingMeta(false);
        return;
      }
      setIsLoadingMeta(true);
      try {
        const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);
        if (company?.id) {
          const { data: bld } = await fetchCompanyBuildings(supabase, company.id);
          if (bld?.length) setBuildings(bld);
        }
        const { data: cats } = await fetchAllCategoriesWithSubcategories(supabase);
        if (cats) setCategoriesFromDb(cats);
      } finally {
        setIsLoadingMeta(false);
      }
    };
    void load();
  }, [user?.id, supabase]);

  const patchForm = (patch: Partial<TenderContestFormData>): void => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleFileUpload = (accepted: File[], rejections: FileRejection[]): void => {
    if (rejections.length > 0) {
      toast.error(rejections[0].errors[0]?.message ?? 'Nieprawidłowy plik');
      return;
    }
    setPendingFiles((prev) => [...prev, ...accepted].slice(0, 20));
  };

  const handleSubmit = async (status: 'draft' | 'active'): Promise<void> => {
    const err = validateContestForm(
      form,
      pendingFiles,
      keptDocuments,
      buildings.length > 0,
      status,
    );
    if (err) {
      toast.error(err);
      return;
    }
    await onSubmit(form, pendingFiles, keptDocuments, status);
  };

  const updateCriterion = (
    id: string,
    patch: Partial<Pick<SelectionCriterionItem, 'name' | 'weight'>>,
  ): void => {
    setForm((prev) => ({
      ...prev,
      selectionCriteria: {
        items: prev.selectionCriteria.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      },
    }));
  };

  const addCriterion = (): void => {
    setForm((prev) => ({
      ...prev,
      selectionCriteria: {
        items: [
          ...prev.selectionCriteria.items,
          {
            id: `custom-${Date.now()}`,
            name: '',
            weight: 0,
            type: 'other',
          },
        ],
      },
    }));
  };

  const removeCriterion = (id: string): void => {
    setForm((prev) => {
      if (prev.selectionCriteria.items.length <= 1) return prev;
      return {
        ...prev,
        selectionCriteria: {
          items: prev.selectionCriteria.items.filter((item) => item.id !== id),
        },
      };
    });
  };

  const handleSubmissionDeadlineChange = (value: string): void => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return;
    setForm((prev) => {
      const next: TenderContestFormData = { ...prev, submissionDeadline: d };
      if (
        prev.completionDate &&
        isCompletionOnOrBeforeSubmission(prev.completionDate, d)
      ) {
        next.completionDate = null;
      }
      if (
        prev.evaluationDeadline &&
        prev.evaluationDeadline.getTime() <= d.getTime()
      ) {
        next.evaluationDeadline = null;
      }
      return next;
    });
  };

  const criteriaWeightSum = selectionCriteriaTotalWeight(form.selectionCriteria.items);

  return (
    <form
      className="space-y-6 pb-28"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit('active');
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informacje podstawowe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="contest-title">Tytuł konkursu *</Label>
            <Input
              id="contest-title"
              maxLength={75}
              value={form.title}
              onChange={(e) => patchForm({ title: e.target.value })}
              placeholder="np. Remont posadzek"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.title.length}/75</p>
          </div>

          <div>
            <Label htmlFor="contest-desc">Szczegółowy zakres i uwagi *</Label>
            <Textarea
              id="contest-desc"
              rows={6}
              value={form.description}
              onChange={(e) => patchForm({ description: e.target.value })}
              placeholder="Opisz zakres prac, oczekiwania i inne istotne informacje..."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Nazwa nieruchomości *</Label>
            {isLoadingMeta ? (
              <div className="h-10 bg-muted rounded-md animate-pulse mt-1" />
            ) : buildings.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                Brak zapisanych nieruchomości. Użyty zostanie adres firmy z profilu.
              </p>
            ) : (
              <Select
                value={form.buildingId || undefined}
                onValueChange={(v) =>
                  patchForm({ buildingId: resolvePrimaryBuildingId(v, buildings) })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Wybierz nieruchomość" />
                </SelectTrigger>
                <SelectContent>
                  {groupedBuildingOptions.map((group) => (
                    <SelectItem key={group.key} value={group.primaryBuildingId}>
                      {formatGroupedBuildingLabel(group)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Kategoria *</Label>
              <Select
                value={form.category || undefined}
                onValueChange={(v) => patchForm({ category: v, subcategory: '' })}
                disabled={isLoadingMeta}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesFromDb.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Podkategoria *</Label>
              <Select
                value={form.subcategory || undefined}
                onValueChange={(v) => patchForm({ subcategory: v })}
                disabled={!form.category || isLoadingMeta}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Wybierz podkategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesFromDb
                    .find((c) => c.name === form.category)
                    ?.subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.name}>
                        {sub.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Dokumentacja konkursowa *</Label>
            <Dropzone
              accept={{
                'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              }}
              maxFiles={20}
              maxSize={10 * 1024 * 1024}
              onDrop={handleFileUpload}
              src={pendingFiles}
              disabled={isSubmitting}
              className="mt-2"
            >
              <DropzoneEmptyState>
                <div className="flex flex-col items-center py-10">
                  <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                  <span className="text-lg font-semibold text-primary">Dodaj pliki</span>
                  <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
                    PDF, DOC, DOCX, XLS, XLSX, obrazy — min. 1 plik, max 10&nbsp;MB każdy.
                  </p>
                </div>
              </DropzoneEmptyState>
              <DropzoneContent />
            </Dropzone>

            {keptDocuments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {keptDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="truncate">📄 {doc.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setKeptDocuments((prev) => prev.filter((d) => d.id !== doc.id))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {pendingFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {pendingFiles.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <File className="h-4 w-4 shrink-0" />
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Harmonogram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="submission-deadline">Zakończenie przyjmowania ofert *</Label>
            <Input
              id="submission-deadline"
              type="datetime-local"
              className="mt-1"
              value={toDatetimeLocalValue(form.submissionDeadline)}
              onChange={(e) => handleSubmissionDeadlineChange(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="evaluation-deadline">Rozstrzygnięcia konkursu *</Label>
            <Input
              id="evaluation-deadline"
              type="date"
              className="mt-1"
              disabled={!hasValidSubmissionDeadline}
              min={minCompletionDateAfterSubmission(form.submissionDeadline)}
              value={toDateInputValue(form.evaluationDeadline)}
              onChange={(e) => {
                patchForm({
                  evaluationDeadline: e.target.value ? new Date(e.target.value) : null,
                });
              }}
            />
            {!hasValidSubmissionDeadline && (
              <p className="text-xs text-muted-foreground mt-1">
                Najpierw ustaw datę zakończenia przyjmowania ofert.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="completion-date">Termin wykonania</Label>
            <Input
              id="completion-date"
              type="date"
              className="mt-1"
              disabled={!hasValidSubmissionDeadline}
              min={completionMinDate}
              value={toDateInputValue(form.completionDate)}
              onChange={(e) => {
                patchForm({
                  completionDate: e.target.value ? new Date(e.target.value) : null,
                });
              }}
            />
            {!hasValidSubmissionDeadline && (
              <p className="text-xs text-muted-foreground mt-1">
                Najpierw ustaw datę i godzinę zakończenia przyjmowania ofert.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Wizja lokalna *</Label>
            <RadioGroup
              value={form.siteVisitType}
              onValueChange={(v) =>
                patchForm({
                  siteVisitType: v as TenderContestFormData['siteVisitType'],
                  siteVisitNotes: v === 'not_required' ? '' : form.siteVisitNotes,
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_required" id="sv-none" />
                <Label htmlFor="sv-none" className="font-normal">
                  Niewymagana
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="optional" id="sv-opt" />
                <Label htmlFor="sv-opt" className="font-normal">
                  Opcjonalna
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mandatory" id="sv-req" />
                <Label htmlFor="sv-req" className="font-normal">
                  Obowiązkowa
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(form.siteVisitType === 'optional' || form.siteVisitType === 'mandatory') && (
            <div>
              <Label htmlFor="site-visit-notes">Osoba do kontaktu i terminy wizji</Label>
              <Textarea
                id="site-visit-notes"
                rows={4}
                className="mt-1"
                value={form.siteVisitNotes}
                onChange={(e) => patchForm({ siteVisitNotes: e.target.value })}
                placeholder="Wizja lokalna odbędzie się w dniu..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wymogi (opcjonalne)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Zaznacz dokumenty i oświadczenia oczekiwane od firm składających oferty.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="req-oc"
              checked={form.formalRequirements.insuranceOc}
              onCheckedChange={(c) =>
                setForm((prev) => ({
                  ...prev,
                  formalRequirements: { ...prev.formalRequirements, insuranceOc: c === true },
                }))
              }
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="req-oc" className="font-normal">
                Aktualna polisa OC wykonawcy
              </Label>
              {form.formalRequirements.insuranceOc && (
                <Input
                  type="number"
                  min={0}
                  className="max-w-xs"
                  placeholder="Min. suma gwarancyjna (zł)"
                  value={form.formalRequirements.insuranceOcMinAmount ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      formalRequirements: {
                        ...prev.formalRequirements,
                        insuranceOcMinAmount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="req-zus"
              checked={form.formalRequirements.zusUsCertificates}
              onCheckedChange={(c) =>
                setForm((prev) => ({
                  ...prev,
                  formalRequirements: { ...prev.formalRequirements, zusUsCertificates: c === true },
                }))
              }
            />
            <Label htmlFor="req-zus" className="font-normal">
              Zaświadczenia o niezaleganiu w ZUS i US (nie starsze niż 3 miesiące)
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="req-ref"
              checked={form.formalRequirements.references}
              onCheckedChange={(c) =>
                setForm((prev) => ({
                  ...prev,
                  formalRequirements: { ...prev.formalRequirements, references: c === true },
                }))
              }
            />
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <Label htmlFor="req-ref" className="font-normal">
                Referencje — min.
              </Label>
              <Input
                type="number"
                min={1}
                className="w-16"
                disabled={!form.formalRequirements.references}
                value={form.formalRequirements.referencesMinCount ?? 2}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    formalRequirements: {
                      ...prev.formalRequirements,
                      referencesMinCount: Number(e.target.value) || 2,
                    },
                  }))
                }
              />
              <span className="text-sm">realizacji z ostatnich</span>
              <Input
                type="number"
                min={1}
                className="w-16"
                disabled={!form.formalRequirements.references}
                value={form.formalRequirements.referencesYears ?? 3}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    formalRequirements: {
                      ...prev.formalRequirements,
                      referencesYears: Number(e.target.value) || 3,
                    },
                  }))
                }
              />
              <span className="text-sm">lat</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="req-cert"
              checked={form.formalRequirements.professionalCertificates}
              onCheckedChange={(c) =>
                setForm((prev) => ({
                  ...prev,
                  formalRequirements: {
                    ...prev.formalRequirements,
                    professionalCertificates: c === true,
                  },
                }))
              }
            />
            <Label htmlFor="req-cert" className="font-normal">
              Certyfikaty zawodowe
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="req-lic"
              checked={form.formalRequirements.professionalLicenses}
              onCheckedChange={(c) =>
                setForm((prev) => ({
                  ...prev,
                  formalRequirements: {
                    ...prev.formalRequirements,
                    professionalLicenses: c === true,
                  },
                }))
              }
            />
            <Label htmlFor="req-lic" className="font-normal">
              Uprawnienia zawodowe
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warunki (opcjonalne)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Kryteria wyboru wykonawcy</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Określ wagę każdego kryterium. Suma musi wynosić 100%.
            </p>
            <div className="space-y-2 max-w-lg">
              {form.selectionCriteria.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Nazwa kryterium"
                    value={item.name}
                    onChange={(e) => updateCriterion(item.id, { name: e.target.value })}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20"
                      value={item.weight}
                      onChange={(e) =>
                        updateCriterion(item.id, {
                          weight: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                      aria-label={`Waga: ${item.name || 'kryterium'}`}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={form.selectionCriteria.items.length <= 1}
                    onClick={() => removeCriterion(item.id)}
                    aria-label="Usuń kryterium"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={addCriterion}
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj kryterium
            </Button>
            <p
              className={`text-xs mt-2 ${criteriaWeightSum === 100 ? 'text-muted-foreground' : 'text-destructive'}`}
            >
              Suma: {criteriaWeightSum}% (wymagane 100%)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Wymagany okres gwarancji</Label>
              <Select
                value={form.warrantyPeriod || undefined}
                onValueChange={(v) =>
                  patchForm({ warrantyPeriod: v as WarrantyGuaranteePeriod })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Wybierz" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rękojmia</Label>
              <Select
                value={form.guaranteePeriod || undefined}
                onValueChange={(v) =>
                  patchForm({ guaranteePeriod: v as WarrantyGuaranteePeriod })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Wybierz" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Wadium</Label>
            <RadioGroup
              value={form.depositRequired ? 'required' : 'none'}
              onValueChange={(v) =>
                patchForm({
                  depositRequired: v === 'required',
                  depositAmount: v === 'required' ? form.depositAmount : null,
                  depositInstructions: v === 'required' ? form.depositInstructions : '',
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="wad-none" />
                <Label htmlFor="wad-none" className="font-normal">
                  Brak wadium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="required" id="wad-req" />
                <Label htmlFor="wad-req" className="font-normal">
                  Wymagane wadium
                </Label>
              </div>
            </RadioGroup>

            {form.depositRequired && (
              <div className="space-y-3 pl-4 border-l-2">
                <div>
                  <Label>Kwota wadium (zł)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="mt-1 max-w-xs"
                    value={form.depositAmount ?? ''}
                    onChange={(e) =>
                      patchForm({
                        depositAmount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Instrukcja wpłaty</Label>
                  <Textarea
                    rows={3}
                    className="mt-1"
                    value={form.depositInstructions}
                    onChange={(e) => patchForm({ depositInstructions: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Termin płatności faktury</Label>
            <RadioGroup
              value={form.paymentTerms.mode}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  paymentTerms: {
                    mode: v as 'standard_14' | 'custom',
                    customDays: v === 'custom' ? prev.paymentTerms.customDays ?? 30 : undefined,
                  },
                }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard_14" id="pay-14" />
                <Label htmlFor="pay-14" className="font-normal">
                  Standardowy (14 dni)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="pay-custom" />
                <Label htmlFor="pay-custom" className="font-normal">
                  Wydłużony (inny)
                </Label>
              </div>
            </RadioGroup>
            {form.paymentTerms.mode === 'custom' && (
              <div className="flex items-center gap-2 pl-4">
                <Label className="font-normal">Liczba dni:</Label>
                <Input
                  type="number"
                  min={1}
                  className="w-24"
                  value={form.paymentTerms.customDays ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentTerms: {
                        ...prev.paymentTerms,
                        customDays: Number(e.target.value) || undefined,
                      },
                    }))
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => void handleSubmit('draft')}
          >
            <Save className="h-4 w-4 mr-2" />
            Zapisz jako szkic
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Publikowanie…' : 'Opublikuj konkurs'}
          </Button>
        </div>
      </div>
    </form>
  );
}
