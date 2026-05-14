'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Upload,
  FileText,
  Shield,
  Check,
  AlertTriangle,
  Info,
  X,
  Clock,
  ShieldCheck,
  ShieldX,
  CalendarClock,
  Calendar,
  Download,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useUserProfile } from '../contexts/AuthContext';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from './ui/dropzone';
import type { FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { submitVerificationDocumentsAction } from '../app/verification/actions';
import {
  getContractorAccountSettings,
  upsertContractorAccountSettings,
} from '../lib/database/contractor-account';
import type { VerificationStatus } from '../lib/database/verification';
import type {
  DocumentReview,
  DocumentReviewMap,
  VerificationDocumentEntry,
} from '../lib/database/admin-verification';

interface VerificationPageProps {
  initialStatus: VerificationStatus;
  existingDocuments: VerificationDocumentEntry[];
  /**
   * Per-document admin review map keyed by document type. Renders status
   * badges + rejection reasons next to each uploaded document so the user
   * understands which files passed and which need re-submission.
   */
  documentReviews?: DocumentReviewMap;
}

type DocumentReviewState = 'approved' | 'rejected' | 'pending' | 'stale';

interface DocumentUpload {
  type: string;
  file: File | null;
  description: string;
  required: boolean;
}

function formatDateTime(value: string | null): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

interface StateBannerProps {
  status: VerificationStatus;
  onAction?: () => void;
}

/**
 * Single, consistent banner for every verification state. The visual language
 * (icon disc + heading + meta strip + body + optional CTA) is unified across
 * approved / pending / rejected / unsubmitted so the user always sees a clear
 * decision at the top of the page.
 */
function VerificationStateBanner({ status, onAction }: StateBannerProps) {
  const { state, submittedAt, decidedAt, reason } = status;

  if (state === 'approved') {
    return (
      <Card className="overflow-hidden border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                Zaakceptowano
              </Badge>
              <h3 className="text-xl font-semibold text-emerald-700">Konto zweryfikowane</h3>
              <p className="text-sm text-muted-foreground">
                Twoja firma została zweryfikowana przez administratora. Otrzymujesz oznaczenie
                &quot;Zweryfikowany&quot; w profilu publicznym oraz lepszą widoczność w wynikach
                wyszukiwania.
              </p>
            </div>
          </div>
          {onAction && (
            <Button onClick={onAction} className="self-start sm:self-center" variant="outline">
              Powrót do konta
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (state === 'pending') {
    return (
      <Card className="overflow-hidden border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <Badge className="border border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10">
                W trakcie weryfikacji
              </Badge>
              <h3 className="text-xl font-semibold text-blue-700">
                Dokumenty oczekują na decyzję
              </h3>
              <p className="text-sm text-muted-foreground">
                Dziękujemy za przesłanie dokumentów. Administrator sprawdzi je w ciągu
                1–3 dni roboczych. Otrzymasz powiadomienie e-mail oraz w aplikacji o wyniku
                weryfikacji.
              </p>
              {submittedAt && (
                <div className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-background px-2 py-1 text-xs text-blue-700">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Przesłano: {formatDateTime(submittedAt)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'rejected') {
    return (
      <Card className="overflow-hidden border-2 border-destructive/40 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm">
              <ShieldX className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <Badge variant="destructive">Odrzucono</Badge>
              <h3 className="text-xl font-semibold text-destructive">Weryfikacja odrzucona</h3>
              {decidedAt && (
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Decyzja z dnia {formatDateTime(decidedAt)}
                </div>
              )}
            </div>
          </div>
          {reason && (
            <div className="rounded-md border border-destructive/30 bg-background p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-destructive">
                Powód odrzucenia
              </div>
              <p className="mt-1 text-sm text-foreground whitespace-pre-line">{reason}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Popraw wskazane elementy i prześlij dokumenty ponownie poniżej. Możesz zachować
            dotychczas przesłane pliki i zastąpić tylko te, które wymagają korekty.
          </p>
        </CardContent>
      </Card>
    );
  }

  // unsubmitted
  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <CardContent className="flex items-start gap-4 p-6">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Shield className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <Badge variant="outline">Niezweryfikowane</Badge>
          <h3 className="text-xl font-semibold">Konto wymaga weryfikacji</h3>
          <p className="text-sm text-muted-foreground">
            Prześlij wymagane dokumenty, aby zweryfikować swoje konto. Proces jest bezpłatny i
            zajmuje 1–3 dni robocze.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExistingDocChipProps {
  doc: VerificationDocumentEntry;
  review?: DocumentReview | null;
  reviewState?: DocumentReviewState;
  /**
   * When provided, renders a "Zastąp" button (or "Anuluj" while open) left of
   * "Otwórz" so the user can toggle the upload section visible without showing
   * the full dropzone by default.
   */
  onReplace?: () => void;
  /** True while the upload section for this doc is open. */
  isReplacing?: boolean;
}

function ReviewBadge({ state }: { state: DocumentReviewState }) {
  if (state === 'approved') {
    return (
      <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
        <Check className="h-3 w-3" />
        Zaakceptowany
      </Badge>
    );
  }
  if (state === 'rejected') {
    return (
      <Badge variant="destructive">
        <X className="h-3 w-3" />
        Odrzucony
      </Badge>
    );
  }
  if (state === 'stale') {
    return (
      <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
        <RefreshCw className="h-3 w-3" />
        Oczekuje na ponowną ocenę
      </Badge>
    );
  }
  return (
    <Badge className="border border-blue-500/40 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10">
      <Clock className="h-3 w-3" />
      Oczekuje na ocenę
    </Badge>
  );
}

function ExistingDocChip({
  doc,
  review = null,
  reviewState = 'pending',
  onReplace,
  isReplacing = false,
}: ExistingDocChipProps) {
  const uploadedLabel = formatDateTime(doc.uploadedAt);
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Aktualny plik
              </span>
              <ReviewBadge state={reviewState} />
            </div>
            <div className="truncate text-sm" title={doc.filename}>
              {doc.filename}
            </div>
            {uploadedLabel && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3 w-3" />
                Przesłano: {uploadedLabel}
              </div>
            )}
            {doc.error && <div className="text-xs text-destructive">{doc.error}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onReplace && (
            <Button
              type="button"
              size="sm"
              variant={isReplacing ? 'ghost' : 'default'}
              onClick={onReplace}
            >
              {isReplacing ? (
                <>
                  <X className="mr-1 h-3.5 w-3.5" /> Anuluj
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Zastąp
                </>
              )}
            </Button>
          )}
          <Button asChild size="sm" variant="outline" disabled={!doc.viewUrl}>
            {doc.viewUrl ? (
              <a href={doc.viewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Otwórz
              </a>
            ) : (
              <span>
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Otwórz
              </span>
            )}
          </Button>
          <Button asChild size="sm" variant="secondary" disabled={!doc.downloadUrl}>
            {doc.downloadUrl ? (
              <a href={doc.downloadUrl} download={doc.filename}>
                <Download className="mr-1 h-3.5 w-3.5" /> Pobierz
              </a>
            ) : (
              <span>
                <Download className="mr-1 h-3.5 w-3.5" /> Pobierz
              </span>
            )}
          </Button>
        </div>
      </div>
      {reviewState === 'rejected' && review?.reason && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-destructive">
            Powód odrzucenia
          </div>
          <p className="mt-1 whitespace-pre-line text-foreground">{review.reason}</p>
        </div>
      )}
      {reviewState === 'stale' && (
        <div className="rounded-md border border-amber-500/30 bg-background p-2 text-xs text-muted-foreground">
          Plik został zaktualizowany po ostatniej ocenie. Administrator oceni go ponownie.
        </div>
      )}
    </div>
  );
}

/**
 * Mirror of the staleness rule used in the admin component: a stored review
 * stops applying once the user re-uploads the underlying file.
 */
function deriveDocumentReviewState(
  doc: VerificationDocumentEntry,
  review: DocumentReview | null | undefined
): DocumentReviewState {
  if (!review) return 'pending';
  if (doc.uploadedAt) {
    const docMs = Date.parse(doc.uploadedAt);
    const reviewMs = Date.parse(review.reviewedAt);
    if (Number.isFinite(docMs) && Number.isFinite(reviewMs) && docMs > reviewMs) {
      return 'stale';
    }
  }
  return review.status;
}

export const VerificationPage: React.FC<VerificationPageProps> = ({
  initialStatus,
  existingDocuments,
  documentReviews,
}) => {
  const { user } = useUserProfile();
  const router = useRouter();
  const [uploads, setUploads] = useState<Record<string, DocumentUpload>>({});
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasOcPolicyInAccount, setHasOcPolicyInAccount] = useState(false);
  const [replaceMode, setReplaceMode] = useState<Record<string, boolean>>({});
  // OC validity date mirrored from /account?tab=contractor-data so the user
  // can complete the OC information in one place. Stored separately because
  // it lives in `contractor_account_settings`, not in the verification doc
  // payload.
  const [ocValidUntil, setOcValidUntil] = useState<string>('');
  const [initialOcValidUntil, setInitialOcValidUntil] = useState<string>('');
  const [isSavingOcDate, setIsSavingOcDate] = useState(false);

  const isContractor = user?.userType === 'contractor';
  const status = initialStatus.state;
  const showUploadForm = status !== 'approved';

  const existingByKey = useMemo(() => {
    const map: Record<string, VerificationDocumentEntry> = {};
    for (const d of existingDocuments) {
      map[d.key] = d;
    }
    return map;
  }, [existingDocuments]);

  const reviewByKey = documentReviews ?? {};

  useEffect(() => {
    if (!user?.id || !isContractor) {
      setHasOcPolicyInAccount(false);
      setOcValidUntil('');
      setInitialOcValidUntil('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const settings = await getContractorAccountSettings(user.id);
        if (!cancelled) {
          setHasOcPolicyInAccount(Boolean(settings.ocPolicyScanPath));
          const dateValue = settings.ocValidUntil ?? '';
          setOcValidUntil(dateValue);
          setInitialOcValidUntil(dateValue);
        }
      } catch {
        if (!cancelled) {
          setHasOcPolicyInAccount(false);
          setOcValidUntil('');
          setInitialOcValidUntil('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isContractor]);

  const handleSaveOcValidUntil = async () => {
    if (!user?.id) {
      toast.error('Musisz być zalogowany.');
      return;
    }
    try {
      setIsSavingOcDate(true);
      const saved = await upsertContractorAccountSettings(user.id, {
        ocValidUntil: ocValidUntil ? ocValidUntil : null,
      });
      const newDate = saved.ocValidUntil ?? '';
      setOcValidUntil(newDate);
      setInitialOcValidUntil(newDate);
      toast.success('Data ważności OC zapisana');
      router.refresh();
    } catch (error) {
      console.error('Error saving OC valid until from verification page:', error);
      toast.error('Nie udało się zapisać daty ważności OC');
    } finally {
      setIsSavingOcDate(false);
    }
  };

  const ocDateDirty = ocValidUntil !== initialOcValidUntil;

  const contractorDocuments = [
    {
      type: 'company_registration',
      name: 'Wypis z KRS/CEIDG',
      description: 'Aktualny wypis potwierdzający rejestrację firmy',
      required: true,
    },
    {
      type: 'insurance',
      name: 'Ubezpieczenie OC',
      description: 'Polisa ubezpieczenia odpowiedzialności cywilnej (ważna minimum 6 miesięcy)',
      required: true,
    },
    {
      type: 'certifications',
      name: 'Certyfikaty zawodowe',
      description: 'Skany certyfikatów i uprawnień zawodowych',
      required: false,
    },
    {
      type: 'references',
      name: 'Referencje',
      description: 'Opinie z poprzednich projektów, rekomendacje klientów',
      required: false,
    },
  ];

  const managerDocuments = [
    {
      type: 'company_registration',
      name: 'Wypis z KRS/CEIDG',
      description: 'Aktualny wypis potwierdzający rejestrację firmy zarządzającej',
      required: true,
    },
    {
      type: 'insurance',
      name: 'Ubezpieczenie OC zarządcy',
      description: 'Polisa ubezpieczenia odpowiedzialności cywilnej zarządcy',
      required: true,
    },
    {
      type: 'management_license',
      name: 'Licencja zarządcy',
      description: 'Certyfikat lub licencja zarządcy nieruchomości',
      required: false,
    },
    {
      type: 'management_contracts',
      name: 'Umowy zarządzania',
      description: 'Przykłady umów zarządzania nieruchomościami (dane osobowe zamazane)',
      required: false,
    },
  ];

  const documents = isContractor ? contractorDocuments : managerDocuments;

  const handleFileChange = (documentType: string, file: File | null) => {
    setUploads(prev => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        file,
        type: documentType,
        required: documents.find(d => d.type === documentType)?.required || false,
      },
    }));
  };

  const handleFileDrop = (documentType: string, acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const error = rejection.errors[0];
      if (error.code === 'file-too-large') {
        toast.error(`Plik "${rejection.file.name}" jest zbyt duży. Maksymalny rozmiar: 10MB`);
      } else if (error.code === 'file-invalid-type') {
        toast.error(`Nieprawidłowy typ pliku "${rejection.file.name}". Dozwolone: PDF, JPG, PNG`);
      } else {
        toast.error(`Błąd przy dodawaniu pliku "${rejection.file.name}": ${error.message}`);
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      handleFileChange(documentType, file);
      toast.success(`Dodano plik: ${file.name}`);
    }
  };

  const removeFile = (documentType: string) => {
    handleFileChange(documentType, null);
    toast.info('Plik usunięty');
  };

  const toggleReplace = (documentType: string) => {
    const wasOn = !!replaceMode[documentType];
    if (wasOn) {
      // Cancel: drop any pending file selection so we don't ship a stale file.
      handleFileChange(documentType, null);
    }
    setReplaceMode(prev => ({ ...prev, [documentType]: !wasOn }));
  };

  const handleDescriptionChange = (documentType: string, description: string) => {
    setUploads(prev => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        description,
        type: documentType,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Musisz być zalogowany.');
      return;
    }
    setIsSubmitting(true);

    try {
      const fd = new FormData();
      for (const doc of documents) {
        const file = uploads[doc.type]?.file;
        if (file) {
          fd.append(doc.type, file);
        }
      }

      const result = await submitVerificationDocumentsAction(fd);
      if (!result.ok) {
        toast.error(result.error ?? 'Nie udało się przesłać dokumentów');
        return;
      }
      toast.success('Dokumenty zostały przesłane do weryfikacji');
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error('Wystąpił błąd podczas przesyłania dokumentów');
    } finally {
      setIsSubmitting(false);
    }
  };

  // A required doc is "covered" if there's a new file OR a previously uploaded
  // file. Contractor OC is also covered by an OC scan stored in account settings.
  const requiredDocumentsUploaded = documents.filter(doc => doc.required).every(doc => {
    const hasExisting = Boolean(existingByKey[doc.type]);
    const hasNew = Boolean(uploads[doc.type]?.file);
    if (doc.type === 'insurance' && isContractor) {
      return hasNew || hasExisting || hasOcPolicyInAccount;
    }
    return hasNew || hasExisting;
  });

  const newUploadsCount = documents.reduce(
    (count, doc) => count + (uploads[doc.type]?.file ? 1 : 0),
    0
  );

  const submitLabel = (() => {
    if (status === 'rejected') {
      return newUploadsCount > 0 ? 'Prześlij ponownie' : 'Wyślij ponownie do weryfikacji';
    }
    if (existingDocuments.length > 0 && newUploadsCount > 0) {
      return 'Zapisz zmiany i wyślij';
    }
    return 'Prześlij dokumenty';
  })();

  const headerSubtitle =
    status === 'approved'
      ? 'Twoje konto jest zweryfikowane'
      : status === 'pending'
        ? 'Oczekujemy na decyzję moderatora'
        : status === 'rejected'
          ? 'Weryfikacja została odrzucona — możesz przesłać dokumenty ponownie'
          : 'Prześlij dokumenty aby zweryfikować swoje konto';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/account')}
              className="hidden md:flex text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Weryfikacja konta</h1>
              <p className="text-sm text-muted-foreground">{headerSubtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* State banner */}
          <VerificationStateBanner
            status={initialStatus}
            onAction={status === 'approved' ? () => router.push('/account') : undefined}
          />

          {/* Approved: read-only documents list */}
          {status === 'approved' && existingDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Twoje dokumenty weryfikacyjne</CardTitle>
                <CardDescription>
                  Dokumenty zatwierdzone przez administratora podczas weryfikacji konta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingDocuments.map(doc => {
                  const review = reviewByKey[doc.key] ?? null;
                  return (
                    <ExistingDocChip
                      key={doc.key}
                      doc={doc}
                      review={review}
                      reviewState={deriveDocumentReviewState(doc, review)}
                    />
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Info Header — keep on every state for context */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Shield className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-primary mb-2">
                    Weryfikacja konta {isContractor ? 'wykonawcy' : 'zarządcy'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Zweryfikowane konto otrzymuje więcej {isContractor ? 'zgłoszeń' : 'ofert'} i
                    wyższą pozycję w wynikach wyszukiwania. Proces weryfikacji jest bezpłatny i
                    dobrowolny.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span>Bezpłatna weryfikacja</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span>Pełna ochrona danych</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span>Weryfikacja w 1-3 dni</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-success" />
                        <span>Oznaczenie &quot;Zweryfikowany&quot;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {showUploadForm && (
            <>
              {/* Documents Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {existingDocuments.length > 0 ? 'Twoje dokumenty' : 'Dokumenty do przesłania'}
                  </h3>
                  {existingDocuments.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Wybierz nowy plik dla danego dokumentu, aby go zastąpić.
                    </p>
                  )}
                </div>

                {(() => {
                  const rejectedCount = existingDocuments.filter(d => {
                    const r = reviewByKey[d.key] ?? null;
                    return deriveDocumentReviewState(d, r) === 'rejected';
                  }).length;
                  if (rejectedCount === 0) return null;
                  return (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {rejectedCount === 1
                          ? 'Jeden z Twoich dokumentów został odrzucony przez administratora. Zastąp go zaktualizowanym plikiem i prześlij ponownie.'
                          : `Liczba odrzuconych dokumentów: ${rejectedCount}. Zastąp je zaktualizowanymi plikami i prześlij ponownie.`}
                      </AlertDescription>
                    </Alert>
                  );
                })()}

                {documents.map(doc => {
                  const existing = existingByKey[doc.type];
                  const newFile = uploads[doc.type]?.file ?? null;
                  const willReplace = Boolean(existing && newFile);
                  const review = existing ? reviewByKey[existing.key] ?? null : null;
                  const reviewState = existing
                    ? deriveDocumentReviewState(existing, review)
                    : 'pending';
                  const isReplacing = !!replaceMode[doc.type];
                  // Show the upload section either when there is no existing
                  // doc (initial submission) or when the user explicitly opted
                  // into replacing the existing one via the "Zastąp" button.
                  const showUploadSection = !existing || isReplacing;
                  const cardBorder =
                    reviewState === 'rejected'
                      ? 'border-destructive/40'
                      : reviewState === 'approved'
                        ? 'border-emerald-500/30'
                        : '';

                  return (
                    <Card key={doc.type} className={cardBorder}>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{doc.name}</span>
                              {doc.required && <span className="text-destructive text-sm">*</span>}
                            </CardTitle>
                            <CardDescription>{doc.description}</CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {existing ? (
                              <ReviewBadge state={reviewState} />
                            ) : doc.required ? (
                              <Badge variant="destructive">Wymagany</Badge>
                            ) : (
                              <Badge variant="outline">Opcjonalny</Badge>
                            )}
                            {willReplace && (
                              <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                                <RefreshCw className="h-3 w-3" />
                                Zostanie zastąpiony
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {existing && (
                          <ExistingDocChip
                            doc={existing}
                            review={review}
                            reviewState={reviewState}
                            onReplace={() => toggleReplace(doc.type)}
                            isReplacing={isReplacing}
                          />
                        )}

                        {doc.type === 'insurance' && isContractor && (
                          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                            <Label
                              htmlFor="oc-valid-until-verification"
                              className="flex items-center gap-2 text-sm"
                            >
                              <Calendar className="h-4 w-4 text-primary" />
                              Data ważności OC
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Uzupełnij datę ważności polisy OC. Wartość jest współdzielona z
                              ustawieniami konta wykonawcy.
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Input
                                id="oc-valid-until-verification"
                                type="date"
                                value={ocValidUntil}
                                onChange={e => setOcValidUntil(e.target.value)}
                                disabled={isSavingOcDate}
                                className="sm:max-w-xs"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant={ocDateDirty ? 'default' : 'outline'}
                                disabled={!ocDateDirty || isSavingOcDate}
                                onClick={handleSaveOcValidUntil}
                              >
                                {isSavingOcDate ? 'Zapisywanie...' : 'Zapisz datę'}
                              </Button>
                            </div>
                          </div>
                        )}

                        {showUploadSection && (
                          <>
                            <div className="space-y-2">
                              {!existing && <Label>Plik dokumentu</Label>}
                              <Dropzone
                                accept={{
                                  'application/pdf': ['.pdf'],
                                  'image/*': ['.jpg', '.jpeg', '.png'],
                                }}
                                maxFiles={1}
                                maxSize={10 * 1024 * 1024}
                                minSize={1024}
                                onDrop={(acceptedFiles, fileRejections) =>
                                  handleFileDrop(doc.type, acceptedFiles, fileRejections)
                                }
                                disabled={isSubmitting}
                                src={newFile ? [newFile] : []}
                                className={existing ? '' : 'mt-2'}
                              >
                                <DropzoneEmptyState>
                                  <div className="flex flex-col items-center justify-center">
                                    <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                      <Upload className="h-4 w-4" />
                                    </div>
                                    <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                                      Przeciągnij plik tutaj lub kliknij, aby wybrać
                                    </p>
                                    <p className="w-full truncate text-wrap text-muted-foreground text-xs">
                                      Obsługiwane formaty: PDF, JPG, PNG. Maksymalnie 10MB.
                                    </p>
                                  </div>
                                </DropzoneEmptyState>
                                <DropzoneContent>
                                  {newFile && (
                                    <div className="flex flex-col items-center justify-center w-full">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium truncate max-w-[200px]">
                                          {newFile.name}
                                        </span>
                                        <div className="flex items-center space-x-1 text-success">
                                          <Check className="h-4 w-4" />
                                          <span className="text-xs">Wybrano</span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {formatFileSize(newFile.size)} • Kliknij, aby zmienić
                                      </p>
                                    </div>
                                  )}
                                </DropzoneContent>
                              </Dropzone>
                              {newFile && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFile(doc.type)}
                                  className="w-full"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Usuń wybrany plik
                                </Button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`desc-${doc.type}`}>
                                Dodatkowe informacje (opcjonalnie)
                              </Label>
                              <Textarea
                                id={`desc-${doc.type}`}
                                placeholder="Dodaj komentarz do dokumentu..."
                                value={uploads[doc.type]?.description || ''}
                                onChange={e => handleDescriptionChange(doc.type, e.target.value)}
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Dodatkowe informacje</CardTitle>
                  <CardDescription>
                    Możesz dodać dodatkowe informacje które pomogą w procesie weryfikacji
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder="Opisz dodatkowe kwalifikacje, doświadczenie lub inne informacje które mogą być istotne dla weryfikacji..."
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Warnings */}
              <Alert variant="destructive" className="bg-red-50 border-red-200 border-2">
                <div className="flex gap-3 w-max">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <AlertDescription className="text-red-900">
                    <strong className="text-base block mb-2">Ważne informacje:</strong>
                    <ul className="space-y-1.5 text-sm">
                      <li>• Dokumenty muszą być aktualne (nie starsze niż 6 miesięcy)</li>
                      <li>• Wszystkie dane muszą być czytelne</li>
                      <li>• W przypadku dokumentów w językach obcych dołącz tłumaczenie</li>
                      <li className="font-semibold pt-1">
                        • Przesłanie fałszywych dokumentów skutkuje trwałym zablokowaniem konta
                      </li>
                    </ul>
                  </AlertDescription>
                </div>
              </Alert>

              {/* Submit */}
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => router.push('/account')}>
                  Anuluj
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!requiredDocumentsUploaded || isSubmitting}
                  className="min-w-32"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Przesyłanie...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {submitLabel}
                    </>
                  )}
                </Button>
              </div>

              {!requiredDocumentsUploaded && (
                <Alert>
                  <AlertDescription>
                    Aby przesłać dokumenty, musisz załączyć wszystkie wymagane pliki oznaczone
                    gwiazdką (*).
                  </AlertDescription>
                </Alert>
              )}

              {/* RODO Information */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Informacja o przetwarzaniu danych osobowych (RODO):</strong>
                  <br />
                  Przesłane dokumenty przetwarzamy wyłącznie w celu weryfikacji kwalifikacji i
                  budowania zaufania na platformie. Podstawą prawną jest uzasadniony interes
                  (art. 6 ust. 1 lit. f RODO). Dokumenty przechowujemy bezpiecznie, a dostęp mają
                  tylko upoważnieni pracownicy. Po zakończeniu weryfikacji dokumenty są
                  automatycznie usuwane.{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
                    Więcej informacji w Polityce prywatności
                  </Link>
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
