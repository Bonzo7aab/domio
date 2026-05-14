import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Eye,
  ExternalLink,
  MessageSquare,
  X,
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

function grossFromNet(net: number, vatPct: 8 | 23): number {
  return Math.round(net * (1 + vatPct / 100) * 100) / 100;
}

function formatPlDateIso(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return iso;
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(dt);
}

function formatGuaranteeMonths(n: number): string {
  if (n === 1) return '1 miesiąc';
  if (n >= 2 && n <= 4) return `${n} miesiące`;
  return `${n} miesięcy`;
}

function formatMoneyPl(price: number, fractionDigits: 0 | 2): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(price);
}

interface MyApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobLocation: string;
  jobCategory: string;
  proposedPrice: number;
  proposedTimeline: string;
  /** Raw timeline in days (from DB), for „dni roboczych” label. */
  proposedTimelineDays?: number | null;
  /** VAT % on net price (job offers). */
  vatRate?: 8 | 23;
  proposedStartDate?: string;
  availableFrom?: string;
  guaranteePeriodMonths?: number;
  teamSize?: number;
  /** Przetarg: ważność oferty. */
  tenderValidUntil?: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'cancelled';
  submittedAt: Date;
  lastUpdated: Date;
  coverLetter: string;
  experience: string;
  additionalNotes?: string;
  postedTime?: string;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  certificates: string[];
  reviewNotes?: string;
  interviewDate?: Date;
  contractDetails?: {
    startDate: Date;
    endDate?: Date;
    totalValue: number;
    paymentSchedule: string;
  };
  postType?: 'job' | 'tender';
}

interface MyApplicationsProps {
  applications?: MyApplication[];
  loading?: boolean;
  onJobView?: (jobId: string) => void;
  onStartConversation?: (applicationId: string) => void;
  onWithdraw?: (applicationId: string, postType: 'job' | 'tender') => void;
}

export const MyApplications: React.FC<MyApplicationsProps> = ({
  applications: providedApplications,
  loading = false,
  onJobView,
  onStartConversation,
  onWithdraw
}) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // Use provided applications or fallback to empty array
  const applications = providedApplications || [];

  // Filter applications by status
  const filteredApplications = applications.filter(app => {
    switch (selectedTab) {
      case 'pending':
        return app.status === 'submitted';
      case 'review':
        return app.status === 'under_review';
      case 'accepted':
        return app.status === 'accepted';
      case 'rejected':
        return app.status === 'rejected';
      case 'cancelled':
        return app.status === 'cancelled';
      default:
        return true;
    }
  });

  // Statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'submitted').length,
    review: applications.filter(app => app.status === 'under_review').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    cancelled: applications.filter(app => app.status === 'cancelled').length
  };

  const selectedOffer = applications.find((item) => item.id === selectedOfferId) || null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(price);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getStatusLabel = (status: MyApplication['status']) => {
    switch (status) {
      case 'submitted':
        return 'Oczekująca';
      case 'under_review':
        return 'W ocenie';
      case 'accepted':
        return 'Zaakceptowana';
      case 'rejected':
        return 'Odrzucona';
      case 'cancelled':
        return 'Anulowana';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: MyApplication['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 'accepted') return 'default';
    if (status === 'rejected' || status === 'cancelled') return 'destructive';
    if (status === 'under_review') return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Moje aplikacje</h2>
          <p className="text-gray-600">Zarządzaj swoimi aplikacjami na zlecenia</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Wszystkie ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Oczekujące ({stats.pending + stats.review})</TabsTrigger>
          <TabsTrigger value="accepted">Zaakceptowane ({stats.accepted})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-base font-medium text-gray-600 mb-2">
                  Brak aplikacji w tej kategorii
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedTab === 'all' 
                    ? 'Nie masz jeszcze żadnych aplikacji. Przeglądaj zlecenia i aplikuj!'
                    : `Brak aplikacji o statusie "${selectedTab}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Moje Oferty</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nazwa zgłoszenia</TableHead>
                      <TableHead>Twoja kwota (Netto)</TableHead>
                      <TableHead>Termin złożenia</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.jobTitle}</TableCell>
                        <TableCell>{formatPrice(application.proposedPrice)}</TableCell>
                        <TableCell>{formatDate(application.submittedAt)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(application.status)}>{getStatusLabel(application.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedOfferId(application.id)}>
                              Szczegóły mojej oferty
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => onJobView && onJobView(application.jobId)}>
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              Zgłoszenie
                            </Button>
                            {(application.status === 'accepted' ||
                              application.status === 'submitted' ||
                              application.status === 'under_review') && (
                              <Button size="sm" variant="outline" onClick={() => onStartConversation && onStartConversation(application.id)}>
                                <MessageSquare className="mr-2 h-3.5 w-3.5" />
                                Wiadomość
                              </Button>
                            )}
                            {onWithdraw && application.postType && (application.status === 'submitted' || application.status === 'under_review') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => onWithdraw(application.id, application.postType!)}
                              >
                                <X className="mr-2 h-3.5 w-3.5" />
                                Anuluj
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedOffer)} onOpenChange={(open) => !open && setSelectedOfferId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Szczegóły mojej oferty</DialogTitle>
          </DialogHeader>
          {selectedOffer ? (
            <ScrollArea className="max-h-[min(70vh,620px)] pr-4">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-base font-semibold">{selectedOffer.jobTitle}</p>
                  <p className="text-muted-foreground">{selectedOffer.jobCompany}</p>
                  <p className="text-muted-foreground mt-1">
                    {selectedOffer.jobLocation}
                    {selectedOffer.jobCategory ? ` · ${selectedOffer.jobCategory}` : ''}
                  </p>
                  {selectedOffer.postType && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedOffer.postType === 'tender' ? 'Przetarg' : 'Zlecenie'}
                    </p>
                  )}
                </div>

                <div className="rounded-md border p-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">
                        {selectedOffer.postType === 'tender' ? 'Kwota oferty' : 'Kwota netto'}
                      </p>
                      <p className="font-medium">{formatMoneyPl(selectedOffer.proposedPrice, 2)}</p>
                    </div>
                    {selectedOffer.postType !== 'tender' && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Stawka VAT</p>
                          <p className="font-medium">{selectedOffer.vatRate ?? 23}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Kwota brutto (szac.)</p>
                          <p className="font-medium">
                            {formatMoneyPl(
                              grossFromNet(selectedOffer.proposedPrice, selectedOffer.vatRate ?? 23),
                              2,
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-3 border-t pt-3">
                    <p className="text-muted-foreground">Termin realizacji</p>
                    <p className="font-medium">{selectedOffer.proposedTimeline}</p>
                    {selectedOffer.proposedTimelineDays != null &&
                      selectedOffer.proposedTimelineDays > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ({selectedOffer.proposedTimelineDays}{' '}
                          {selectedOffer.proposedTimelineDays === 1
                            ? 'dzień roboczy wg kalendarza'
                            : 'dni roboczych wg kalendarza'}
                          )
                        </p>
                      )}
                  </div>
                </div>

                {(selectedOffer.proposedStartDate || selectedOffer.availableFrom) && (
                  <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                    {selectedOffer.proposedStartDate && (
                      <div>
                        <p className="text-muted-foreground">Proponowany start</p>
                        <p className="font-medium">{formatPlDateIso(selectedOffer.proposedStartDate)}</p>
                      </div>
                    )}
                    {selectedOffer.availableFrom &&
                      selectedOffer.availableFrom !== selectedOffer.proposedStartDate && (
                        <div>
                          <p className="text-muted-foreground">Dostępność od</p>
                          <p className="font-medium">{formatPlDateIso(selectedOffer.availableFrom)}</p>
                        </div>
                      )}
                  </div>
                )}

                {selectedOffer.guaranteePeriodMonths != null &&
                  selectedOffer.guaranteePeriodMonths > 0 && (
                    <div className="rounded-md border p-3">
                      <p className="text-muted-foreground">Okres gwarancji</p>
                      <p className="font-medium">{formatGuaranteeMonths(selectedOffer.guaranteePeriodMonths)}</p>
                    </div>
                  )}

                {selectedOffer.teamSize != null && selectedOffer.teamSize > 0 && (
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Wielkość zespołu</p>
                    <p className="font-medium">{selectedOffer.teamSize} os.</p>
                  </div>
                )}

                {selectedOffer.tenderValidUntil && (
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Oferta ważna do</p>
                    <p className="font-medium">{formatPlDateIso(selectedOffer.tenderValidUntil)}</p>
                  </div>
                )}

                <div>
                  <p className="mb-1 font-medium">
                    {selectedOffer.postType === 'tender' ? 'Propozycja techniczna' : 'Treść oferty'}
                  </p>
                  <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-wrap">
                    {selectedOffer.coverLetter?.trim() || '—'}
                  </div>
                </div>

                {selectedOffer.experience?.trim() ? (
                  <div>
                    <p className="mb-1 font-medium">Doświadczenie</p>
                    <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-wrap">
                      {selectedOffer.experience}
                    </div>
                  </div>
                ) : null}

                {selectedOffer.additionalNotes?.trim() ? (
                  <div>
                    <p className="mb-1 font-medium">Dodatkowe uwagi</p>
                    <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-wrap">
                      {selectedOffer.additionalNotes}
                    </div>
                  </div>
                ) : null}

                {selectedOffer.attachments.length > 0 && (
                  <div>
                    <p className="mb-2 font-medium">Załączniki</p>
                    <ul className="space-y-2">
                      {selectedOffer.attachments.map((att) => (
                        <li key={att.id}>
                          {att.url ? (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                              {att.name || 'Załącznik'}
                            </a>
                          ) : (
                            <span>{att.name || 'Załącznik'}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedOffer.certificates.length > 0 && (
                  <div>
                    <p className="mb-2 font-medium">Certyfikaty</p>
                    <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                      {selectedOffer.certificates.map((c, i) => (
                        <li key={`${c}-${i}`}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="mb-1 font-medium">Wiadomość zwrotna od Zarządcy</p>
                  <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-wrap">
                    {selectedOffer.reviewNotes?.trim() || 'Brak wiadomości zwrotnej.'}
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyApplications;