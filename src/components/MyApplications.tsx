import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  Download,
  X
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
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'cancelled';
  submittedAt: Date;
  lastUpdated: Date;
  coverLetter: string;
  experience: string;
  additionalNotes?: string; // Additional notes from the form
  postedTime?: string; // When the job was posted
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
  postType?: 'job' | 'tender'; // Optional field to distinguish bids from applications
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
    <div className="space-y-3 sm:space-y-4">
      {/* Filters */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        {/* Mobile Dropdown */}
        <div className="md:hidden mb-2 sm:mb-3">
          <Select value={selectedTab} onValueChange={setSelectedTab}>
            <SelectTrigger className="w-full h-12 text-sm font-semibold border shadow-sm bg-white border-gray-200">
              <SelectValue>
                {selectedTab === 'all' && `Wszystkie (${stats.total})`}
                {selectedTab === 'pending' && `Wysłane (${stats.pending})`}
                {selectedTab === 'review' && `W ocenie (${stats.review})`}
                {selectedTab === 'accepted' && `Zaakceptowane (${stats.accepted})`}
                {selectedTab === 'rejected' && `Odrzucone (${stats.rejected})`}
                {selectedTab === 'cancelled' && `Anulowane (${stats.cancelled})`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie ({stats.total})</SelectItem>
              <SelectItem value="pending">Wysłane ({stats.pending})</SelectItem>
              <SelectItem value="review">W ocenie ({stats.review})</SelectItem>
              <SelectItem value="accepted">Zaakceptowane ({stats.accepted})</SelectItem>
              <SelectItem value="rejected">Odrzucone ({stats.rejected})</SelectItem>
              <SelectItem value="cancelled">Anulowane ({stats.cancelled})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-6 gap-4 p-0 bg-transparent h-auto">
          <TabsTrigger 
            value="all" 
            className="h-auto p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary"
          >
            <div className="text-center w-full">
              <div className={`text-2xl font-bold ${selectedTab === 'all' ? 'text-white' : 'text-primary'}`}>{stats.total}</div>
              <div className={`text-sm ${selectedTab === 'all' ? 'text-white/90' : 'text-gray-600'}`}>Wszystkie</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="h-auto p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600"
          >
            <div className="text-center w-full">
              <div className={`text-2xl font-bold ${selectedTab === 'pending' ? 'text-white' : 'text-blue-600'}`}>{stats.pending}</div>
              <div className={`text-sm ${selectedTab === 'pending' ? 'text-white/90' : 'text-gray-600'}`}>Wysłane</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="review" 
            className="h-auto p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:border-orange-600"
          >
            <div className="text-center w-full">
              <div className={`text-2xl font-bold ${selectedTab === 'review' ? 'text-white' : 'text-orange-600'}`}>{stats.review}</div>
              <div className={`text-sm ${selectedTab === 'review' ? 'text-white/90' : 'text-gray-600'}`}>W ocenie</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="accepted" 
            className="h-auto p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:border-green-600"
          >
            <div className="text-center w-full">
              <div className={`text-2xl font-bold ${selectedTab === 'accepted' ? 'text-white' : 'text-green-600'}`}>{stats.accepted}</div>
              <div className={`text-sm ${selectedTab === 'accepted' ? 'text-white/90' : 'text-gray-600'}`}>Zaakceptowane</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className="h-auto p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:border-red-600"
          >
            <div className="text-center w-full">
              <div className={`text-2xl font-bold ${selectedTab === 'rejected' ? 'text-white' : 'text-red-600'}`}>{stats.rejected}</div>
              <div className={`text-sm ${selectedTab === 'rejected' ? 'text-white/90' : 'text-gray-600'}`}>Odrzucone</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled" 
            className="h-auto p-4 border border-border rounded-lg bg-card hover:shadow-md transition-all data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=active]:border-gray-600"
          >
            <div className="text-center w-full">
              <div className={`text-2xl font-bold ${selectedTab === 'cancelled' ? 'text-white' : 'text-gray-600'}`}>{stats.cancelled}</div>
              <div className={`text-sm ${selectedTab === 'cancelled' ? 'text-white/90' : 'text-gray-600'}`}>Anulowane</div>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-2 sm:mt-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-sm sm:text-base font-medium text-gray-600 mb-1 sm:mb-2">
                  Brak aplikacji w tej kategorii
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {selectedTab === 'all' 
                    ? 'Nie masz jeszcze żadnych aplikacji. Przeglądaj zlecenia i aplikuj!'
                    : `Brak aplikacji o statusie "${selectedTab}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold">{application.jobTitle}</h3>
                          {application.postType === 'tender' && (
                            <Badge variant="default" className="bg-blue-600 text-white text-xs">
                              Przetarg
                            </Badge>
                          )}
                          {application.postType === 'job' && (
                            <Badge variant="outline" className="bg-gray-100 text-xs">
                              Zlecenie
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{application.jobCompany}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{application.jobLocation}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{application.jobCategory}</Badge>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="text-base sm:text-lg font-semibold text-green-600">
                          {formatPrice(application.proposedPrice)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Wysłano {formatDate(application.submittedAt)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 sm:space-y-4">
                    {/* Application Status */}
                    <ApplicationStatusCard
                      status={application.status}
                      submittedAt={application.submittedAt}
                      lastUpdated={application.lastUpdated}
                      notes={application.reviewNotes}
                    />

                    {/* Application Details */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-base sm:text-lg font-semibold text-primary">
                          <Euro className="h-4 w-4 sm:h-5 sm:w-5" />
                          {formatPrice(application.proposedPrice)}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">Proponowana cena</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm sm:text-base font-medium">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {application.proposedTimeline}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">Czas realizacji</p>
                      </div>
                    </div>

                    {/* Cover Letter (Opis oferty) */}
                    {application.coverLetter && (
                      <div>
                        <h4 className="text-sm sm:text-base font-medium mb-1.5 sm:mb-2">Opis oferty</h4>
                        <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
                        </div>
                      </div>
                    )}

                    {/* Additional Notes (Dodatkowe uwagi) */}
                    {application.additionalNotes && (
                      <div>
                        <h4 className="text-sm sm:text-base font-medium mb-1.5 sm:mb-2">Dodatkowe uwagi</h4>
                        <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{application.additionalNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Interview/Contract Details for accepted applications */}
                    {application.status === 'accepted' && application.contractDetails && (
                      <div className="p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm sm:text-base font-semibold text-green-800 mb-2 sm:mb-2.5">Szczegóły kontraktu</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
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

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 pt-2 sm:pt-3 border-t">
                      <Button
                        variant="outline"
                        onClick={() => onJobView && onJobView(application.jobId)}
                        className="w-full sm:w-auto text-sm"
                        size="sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Zobacz zlecenie
                      </Button>

                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {application.status === 'accepted' && (
                          <Button
                            onClick={() => onStartConversation && onStartConversation(application.id)}
                            className="w-full sm:w-auto text-sm"
                            size="sm"
                          >
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Napisz do zleceniodawcy
                          </Button>
                        )}
                        
                        {(application.status === 'submitted' || application.status === 'under_review') && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => onStartConversation && onStartConversation(application.id)}
                              className="w-full sm:w-auto text-sm"
                              size="sm"
                            >
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Skontaktuj się
                            </Button>
                            {onWithdraw && application.postType && (
                              <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto text-sm"
                                size="sm"
                                onClick={() => onWithdraw(application.id, application.postType!)}
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                Anuluj ofertę
                              </Button>
                            )}
                          </>
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