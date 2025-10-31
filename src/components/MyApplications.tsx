import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ApplicationStatusCard } from './ApplicationStatusBadge';
import { 
  Eye, 
  MessageSquare, 
  Calendar, 
  Euro, 
  MapPin,
  Building,
  Clock,
  FileText,
  Download
} from 'lucide-react';

interface MyApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobLocation: string;
  jobCategory: string;
  proposedPrice: number;
  proposedTimeline: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: Date;
  lastUpdated: Date;
  coverLetter: string;
  experience: string;
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
}

interface MyApplicationsProps {
  onJobView?: (jobId: string) => void;
  onStartConversation?: (applicationId: string) => void;
}

// Mock data for contractor's applications
const mockApplications: MyApplication[] = [
  {
    id: 'app-1',
    jobId: '1',
    jobTitle: 'Kompleksowe sprzątanie klatek schodowych',
    jobCompany: 'Wspólnota Mieszkaniowa "Słoneczna"',
    jobLocation: 'Warszawa, Mokotów',
    jobCategory: 'Utrzymanie Czystości i Zieleni',
    proposedPrice: 2800,
    proposedTimeline: '2 tygodnie',
    status: 'accepted',
    submittedAt: new Date('2024-01-15T10:30:00'),
    lastUpdated: new Date('2024-01-18T14:20:00'),
    coverLetter: 'Dzień dobry, jesteśmy firmą z 5-letnim doświadczeniem w sprzątaniu budynków mieszkalnych...',
    experience: 'Realizowaliśmy podobne projekty dla Wspólnoty "Zielona" oraz SM "Centrum"...',
    attachments: [
      { id: 'att-1', name: 'portfolio.pdf', type: 'portfolio', url: '#' },
      { id: 'att-2', name: 'referencje.pdf', type: 'reference', url: '#' }
    ],
    certificates: ['ISO 9001', 'Certyfikat DDD'],
    reviewNotes: 'Bardzo dobre referencje i profesjonalne podejście. Zapraszamy do współpracy.',
    contractDetails: {
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-01-31'),
      totalValue: 33600,
      paymentSchedule: 'Miesięcznie do 10. każdego miesiąca'
    }
  },
  {
    id: 'app-2',
    jobId: '2',
    jobTitle: 'Remont elewacji budynku - 4-piętrowy',
    jobCompany: 'Wspólnota Mieszkaniowa ul. Parkowa 24',
    jobLocation: 'Kraków, Podgórze',
    jobCategory: 'Roboty Remontowo-Budowlane',
    proposedPrice: 75000,
    proposedTimeline: '4 tygodnie',
    status: 'under_review',
    submittedAt: new Date('2024-01-16T09:15:00'),
    lastUpdated: new Date('2024-01-17T11:30:00'),
    coverLetter: 'Oferujemy kompleksowy remont elewacji z wykorzystaniem najnowszych technologii...',
    experience: 'Specjalizujemy się w remontach elewacji budynków mieszkalnych od 2018 roku...',
    attachments: [
      { id: 'att-3', name: 'kosztorys_elewacja.pdf', type: 'estimate', url: '#' },
      { id: 'att-4', name: 'uprawnienia_budowlane.pdf', type: 'certificate', url: '#' }
    ],
    certificates: ['Certyfikat budowlany', 'Uprawnienia wysokościowe']
  },
  {
    id: 'app-3',
    jobId: '5',
    jobTitle: 'Deratyzacja i dezynsekcja',
    jobCompany: 'Wspólnota Mieszkaniowa "Osiedle Słoneczne"',
    jobLocation: 'Poznań',
    jobCategory: 'Specjalistyczne usługi',
    proposedPrice: 1200,
    proposedTimeline: '3 dni',
    status: 'rejected',
    submittedAt: new Date('2024-01-12T16:45:00'),
    lastUpdated: new Date('2024-01-14T10:00:00'),
    coverLetter: 'Posiadamy wszystkie wymagane certyfikaty DDD oraz wieloletnie doświadczenie...',
    experience: 'Obsługujemy wspólnoty mieszkaniowe w Poznaniu i okolicach od 2020 roku...',
    attachments: [
      { id: 'att-5', name: 'certyfikaty_DDD.pdf', type: 'certificate', url: '#' }
    ],
    certificates: ['Certyfikat DDD', 'Pozwolenie na biocydy'],
    reviewNotes: 'Dziękujemy za ofertę. Wybraliśmy firmę z większym doświadczeniem w tej lokalizacji.'
  },
  {
    id: 'app-4',
    jobId: '7',
    jobTitle: 'Naprawa instalacji hydraulicznej',
    jobCompany: 'Wspólnota Mieszkaniowa "Centrum"',
    jobLocation: 'Łódź',
    jobCategory: 'Instalacje i systemy',
    proposedPrice: 1800,
    proposedTimeline: '1 dzień',
    status: 'submitted',
    submittedAt: new Date('2024-01-18T08:30:00'),
    lastUpdated: new Date('2024-01-18T08:30:00'),
    coverLetter: 'Jesteśmy dostępni na interwencje 24/7. Posiadamy pełne wyposażenie do napraw hydraulicznych...',
    experience: 'Specjalizujemy się w naprawach awaryjnych instalacji w budynkach mieszkalnych...',
    attachments: [],
    certificates: ['Uprawnienia hydrauliczne', 'Certyfikat instalatorski']
  }
];

export const MyApplications: React.FC<MyApplicationsProps> = ({
  onJobView,
  onStartConversation
}) => {
  const [selectedTab, setSelectedTab] = useState('all');

  // Filter applications by status
  const filteredApplications = mockApplications.filter(app => {
    switch (selectedTab) {
      case 'pending':
        return app.status === 'submitted';
      case 'review':
        return app.status === 'under_review';
      case 'accepted':
        return app.status === 'accepted';
      case 'rejected':
        return app.status === 'rejected';
      default:
        return true;
    }
  });

  // Statistics
  const stats = {
    total: mockApplications.length,
    pending: mockApplications.filter(app => app.status === 'submitted').length,
    review: mockApplications.filter(app => app.status === 'under_review').length,
    accepted: mockApplications.filter(app => app.status === 'accepted').length,
    rejected: mockApplications.filter(app => app.status === 'rejected').length
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Moje aplikacje</h2>
        <p className="text-gray-600">Zarządzaj swoimi aplikacjami na zlecenia</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-gray-600">Wszystkie</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Wysłane</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.review}</div>
            <div className="text-sm text-gray-600">W ocenie</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600">Zaakceptowane</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Odrzucone</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Wszystkie ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Wysłane ({stats.pending})</TabsTrigger>
          <TabsTrigger value="review">W ocenie ({stats.review})</TabsTrigger>
          <TabsTrigger value="accepted">Zaakceptowane ({stats.accepted})</TabsTrigger>
          <TabsTrigger value="rejected">Odrzucone ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Brak aplikacji w tej kategorii
                </h3>
                <p className="text-gray-500">
                  {selectedTab === 'all' 
                    ? 'Nie masz jeszcze żadnych aplikacji. Przeglądaj zlecenia i aplikuj!'
                    : `Brak aplikacji o statusie "${selectedTab}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{application.jobTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>{application.jobCompany}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{application.jobLocation}</span>
                          </div>
                          <Badge variant="outline">{application.jobCategory}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatPrice(application.proposedPrice)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Wysłano {formatDate(application.submittedAt)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Application Status */}
                    <ApplicationStatusCard
                      status={application.status}
                      submittedAt={application.submittedAt}
                      lastUpdated={application.lastUpdated}
                      notes={application.reviewNotes}
                    />

                    {/* Application Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-lg font-semibold text-primary">
                          <Euro className="h-5 w-5" />
                          {formatPrice(application.proposedPrice)}
                        </div>
                        <p className="text-sm text-gray-600">Proponowana cena</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 font-medium">
                          <Clock className="h-4 w-4" />
                          {application.proposedTimeline}
                        </div>
                        <p className="text-sm text-gray-600">Czas realizacji</p>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{application.certificates.length}</div>
                        <p className="text-sm text-gray-600">Certyfikaty</p>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{application.attachments.length}</div>
                        <p className="text-sm text-gray-600">Załączniki</p>
                      </div>
                    </div>

                    {/* Interview/Contract Details for accepted applications */}
                    {application.status === 'accepted' && application.contractDetails && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-3">Szczegóły kontraktu</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Data rozpoczęcia:</span>
                            <div className="font-medium">{formatDate(application.contractDetails.startDate)}</div>
                          </div>
                          {application.contractDetails.endDate && (
                            <div>
                              <span className="text-gray-600">Data zakończenia:</span>
                              <div className="font-medium">{formatDate(application.contractDetails.endDate)}</div>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Wartość kontraktu:</span>
                            <div className="font-medium text-green-700">{formatPrice(application.contractDetails.totalValue)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Płatności:</span>
                            <div className="font-medium">{application.contractDetails.paymentSchedule}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {application.attachments.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Załączniki:</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.attachments.map((attachment) => (
                            <Button
                              key={attachment.id}
                              variant="outline"
                              size="sm"
                              className="h-auto p-2"
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {attachment.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => onJobView && onJobView(application.jobId)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Zobacz zlecenie
                      </Button>

                      <div className="flex gap-2">
                        {application.status === 'accepted' && (
                          <Button
                            onClick={() => onStartConversation && onStartConversation(application.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Napisz do zleceniodawcy
                          </Button>
                        )}
                        
                        {(application.status === 'submitted' || application.status === 'under_review') && (
                          <Button
                            variant="outline"
                            onClick={() => onStartConversation && onStartConversation(application.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Skontaktuj się
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyApplications;