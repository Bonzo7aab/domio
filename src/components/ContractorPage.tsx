"use client";

import {
  Award,
  BarChart3,
  Camera,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Euro,
  Eye,
  Loader2,
  MapPin,
  MessageSquare,
  Save,
  Send,
  Shield,
  Star,
  TrendingUp,
  Upload
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../contexts/AuthContext';
import { createClient } from '../lib/supabase/client';
import { 
  fetchContractorDashboardData,
  fetchCompletedProjects,
  type ContractorProfile,
  type ContractorApplication,
  type ContractorBid,
  type ContractorStats,
  type Certificate
} from '../lib/database/contractors';
import { fetchUserPrimaryCompany } from '../lib/database/companies';
import BidSubmissionForm from './BidSubmissionForm';
import MessagingSystem from './MessagingSystem';
import MyApplications from './MyApplications';
import TenderSystem from './TenderSystem';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { getTenderById } from '../mocks';

interface ContractorPageProps {
  onBack: () => void;
  onBrowseJobs: () => void;
}

export default function ContractorPage({ onBack, onBrowseJobs }: ContractorPageProps) {
  const { user } = useUserProfile();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMessaging, setShowMessaging] = useState(false);
  const [showBidSubmission, setShowBidSubmission] = useState(false);
  const [selectedTender, setSelectedTender] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleMessagesClick = () => {
    router.push('/messages');
  };

  // State for Supabase data
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [applications, setApplications] = useState<ContractorApplication[]>([]);
  const [bids, setBids] = useState<ContractorBid[]>([]);
  const [stats, setStats] = useState<ContractorStats | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);

  // Fetch contractor data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
      try {
        setLoading(true);

        // First, fetch the user's primary company
        const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
        
        if (companyError || !company) {
          console.error('Error fetching user company:', companyError);
          console.log('User may not have a company set up yet');
          setLoading(false);
          return;
        }

        // Use company ID instead of user ID
        const companyId = company.id;

        // Fetch all dashboard data using the company ID
        const dashboardData = await fetchContractorDashboardData(supabase, companyId);
        
        setProfile(dashboardData.profile);
        setApplications(dashboardData.applications);
        setBids(dashboardData.bids);
        setStats(dashboardData.stats);
        setCertificates(dashboardData.certificates);

        // Fetch completed projects separately using company ID
        const projectsResult = await fetchCompletedProjects(supabase, companyId, 10);
        setCompletedProjects(projectsResult || []);

      } catch (error) {
        console.error('Error fetching contractor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Transform Supabase data to component format
  const contractorData = profile ? {
    name: profile.name,
    shortName: profile.name.split(' ')[0],
    type: 'Wykonawca',
    specialization: profile.services?.primary?.join(', ') || 'Różne usługi budowlane',
    address: profile.contactInfo?.address || 'Brak adresu',
    phone: profile.contactInfo?.phone || user?.phone || 'Brak telefonu',
    email: profile.contactInfo?.email || user?.email || 'Brak email',
    website: profile.contactInfo?.website || 'Brak strony www',
    avatar: profile.avatar || user?.avatar || '',
    verified: profile.verification?.status === 'verified',
    premium: profile.plan === 'pro',
    rating: stats?.averageRating || 0,
    completedJobs: stats?.completedProjects || 0,
    responseTime: '24h', // Could be calculated from applications
    founded: profile.businessInfo?.yearEstablished?.toString() || new Date().getFullYear().toString(),
    employees: profile.businessInfo?.employeeCount || '1-5',
    licenses: certificates.map(c => c.name),
    description: `${profile.name} - profesjonalna firma budowlana.`,
    stats: {
      activeOffers: stats?.totalApplications || 0,
      pendingJobs: stats?.totalBids || 0,
      monthlyEarnings: stats?.totalEarnings || 0,
      clientSatisfaction: stats?.averageRating ? (stats.averageRating / 5) * 100 : 0,
      avgJobValue: 0, // Would need to calculate from applications
      completionRate: stats?.completedProjects || 0
    }
  } : {
    // Fallback data for users without profile
    name: user?.company || user?.firstName || "Nowa firma",
    shortName: user?.company?.split(' ')[0] || user?.firstName?.charAt(0) || "NF",
    type: "Firma budowlana",
    specialization: "Roboty remontowo-budowlane",
    address: "Brak adresu",
    phone: user?.phone || "Brak telefonu",
    email: user?.email || "Brak email",
    website: "Brak strony www",
    avatar: user?.avatar || "",
    verified: user?.isVerified || false,
    premium: false,
    rating: 0,
    completedJobs: 0,
    responseTime: "Brak danych",
    founded: new Date().getFullYear().toString(),
    employees: "1",
    licenses: [],
    description: "Profil w trakcie uzupełniania. Skontaktuj się z nami po więcej informacji.",
    stats: {
      activeOffers: 0,
      pendingJobs: 0,
      monthlyEarnings: 0,
      clientSatisfaction: 0,
      avgJobValue: 0,
      completionRate: 0
    }
  };

  const handleJobView = (jobId: string) => {
    // Navigate to job details - this should be implemented with proper routing
    console.log('View job:', jobId);
  };

  const handleStartConversation = (applicationId: string) => {
    setShowMessaging(true);
  };

  const handleTenderSelect = (tenderId: string) => {
    // In real app, this would navigate to tender details
    console.log('View tender:', tenderId);
  };

  const handleBidSubmit = (tenderId: string) => {
    const tender = getTenderById(tenderId) || getTenderById('tender-1');

    if (!tender) {
      console.warn('Tender not found for bid submission');
      return;
    }

    setSelectedTender({
      id: tender.id,
      title: tender.title,
      deadline: tender.submissionDeadline || new Date(),
      value: tender.estimatedValue || '0',
      currency: tender.currency || 'PLN',
      evaluationCriteria: tender.evaluationCriteria || [],
      requirements: tender.requirements || []
    });
    setShowBidSubmission(true);
  };

  const handleBidFormSubmit = (bid: any) => {
    // In real app, this would submit bid to backend
    console.log('Bid submitted:', bid);
    setShowBidSubmission(false);
    setSelectedTender(null);
  };

  // Transform applications and bids to activeOffers format
  const activeOffers = [
    ...applications.map(app => ({
      id: app.id,
      title: app.jobTitle || 'Untitled Job',
      client: app.companyName || 'Unknown Client',
      location: 'Unknown', // Not available in ContractorApplication
      budget: app.proposedPrice || '0',
      status: app.status === 'pending' ? 'pending' : 
              app.status === 'accepted' ? 'won' :
              app.status === 'rejected' ? 'rejected' : 'pending',
      submittedAt: new Date(app.appliedAt).toLocaleDateString('pl-PL'),
      responses: 0, // Not available in ContractorApplication
      myOffer: app.proposedPrice || '0',
      description: app.coverLetter?.substring(0, 100) || 'Brak opisu'
    })),
    ...bids.map(bid => ({
      id: bid.id,
      title: bid.tenderTitle || 'Untitled Tender',
      client: bid.companyName || 'Unknown Client',
      location: 'Unknown', // Not available in ContractorBid
      budget: bid.bidAmount || '0',
      status: bid.status === 'pending' ? 'pending' : 
              bid.status === 'accepted' ? 'won' :
              bid.status === 'rejected' ? 'rejected' : 'pending',
      submittedAt: new Date(bid.submittedAt).toLocaleDateString('pl-PL'),
      responses: 0, // Not available in ContractorBid
      myOffer: bid.bidAmount || '0',
      description: 'Brak opisu' // Not available in ContractorBid
    }))
  ];

  // Transform completed projects to recentJobs format
  const recentJobs = completedProjects.length > 0 ? completedProjects.map(project => ({
    id: project.id,
    title: project.title,
    client: project.client,
    location: project.location,
    completedAt: new Date(project.completedAt).toLocaleDateString('pl-PL'),
    rating: stats?.averageRating || 5,
    earnings: project.earnings,
    duration: project.duration,
    feedback: project.description?.substring(0, 150) || 'Projekt ukończony pomyślnie'
  })) : [{
    id: '1',
    title: 'Brak ukończonych projektów',
    client: 'N/A',
    location: 'N/A',
    completedAt: new Date().toLocaleDateString('pl-PL'),
    rating: 0,
    earnings: '0 zł',
    duration: 'N/A',
    feedback: 'Rozpocznij składanie ofert, aby budować swoją historię projektów'
  }];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Oczekująca', color: 'bg-yellow-100 text-yellow-800' },
      shortlisted: { label: 'Shortlista', color: 'bg-blue-100 text-blue-800' },
      won: { label: 'Wygrana', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Odrzucona', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Ładowanie profilu wykonawcy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={contractorData.avatar} />
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {contractorData.shortName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {contractorData.premium && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{contractorData.name}</h1>
                  {contractorData.verified && (
                    <Badge className="bg-green-100 text-green-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Zweryfikowana
                    </Badge>
                  )}
                  {contractorData.premium && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Award className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-1">{contractorData.specialization}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{contractorData.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{contractorData.rating} ({contractorData.completedJobs} projektów)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Odpowiada w ciągu {contractorData.responseTime}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack}>
                Wróć do zleceń
              </Button>
              <Button onClick={onBrowseJobs}>
                Przeglądaj zlecenia
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="applications">Moje aplikacje</TabsTrigger>
            <TabsTrigger value="tenders">Przetargi</TabsTrigger>
            <TabsTrigger value="offers">Moje oferty</TabsTrigger>
            <TabsTrigger value="projects">Projekty</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="analytics">Analityka</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aktywne oferty</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contractorData.stats.activeOffers}</div>
                  <p className="text-xs text-muted-foreground">
                    {contractorData.stats.pendingJobs} oczekujące na decyzję
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Miesięczne zarobki</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contractorData.stats.monthlyEarnings.toLocaleString()} zł</div>
                  <p className="text-xs text-muted-foreground">
                    Średnia wartość zlecenia: {contractorData.stats.avgJobValue.toLocaleString()} zł
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satysfakcja klientów</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contractorData.stats.clientSatisfaction}%</div>
                  <p className="text-xs text-muted-foreground">
                    Ocena: {contractorData.rating}/5.0
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Realizacja na czas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contractorData.stats.completionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {contractorData.completedJobs} ukończonych projektów
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Szybkie akcje</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start" onClick={onBrowseJobs}>
                    <Eye className="w-4 h-4 mr-2" />
                    Przeglądaj nowe zlecenia
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Aktualizuj portfolio
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleMessagesClick}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Sprawdź wiadomości
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Pobierz raport miesięczny
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ostatnie aktywności</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Wygrałeś ofertę na wymianę okien</p>
                        <p className="text-xs text-gray-500">2 godziny temu</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Nowe zlecenie pasuje do Twojego profilu</p>
                        <p className="text-xs text-gray-500">4 godziny temu</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Otrzymałeś nową recenzję (5 gwiazdek)</p>
                        <p className="text-xs text-gray-500">wczoraj</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Twój profil był przeglądany 23 razy</p>
                        <p className="text-xs text-gray-500">wczoraj</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <MyApplications 
              onJobView={handleJobView}
              onStartConversation={handleStartConversation}
            />
          </TabsContent>

          {/* Tenders Tab */}
          <TabsContent value="tenders" className="space-y-6">
            <TenderSystem 
              userRole="contractor"
              onTenderSelect={handleTenderSelect}
              onBidSubmit={handleBidSubmit}
            />
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Moje oferty</h2>
              <Button onClick={onBrowseJobs}>Znajdź nowe zlecenia</Button>
            </div>

            {activeOffers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Send className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Brak złożonych ofert</h3>
                  <p className="text-gray-600 mb-6">
                    Rozpocznij przeglądanie dostępnych zleceń i składaj oferty, aby rozwijać swój biznes.
                  </p>
                  <Button onClick={onBrowseJobs}>
                    <Eye className="w-4 h-4 mr-2" />
                    Przeglądaj zlecenia
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeOffers.map((offer) => (
                <Card key={offer.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{offer.title}</h3>
                          {getStatusBadge(offer.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="font-medium">{offer.client}</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{offer.location}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm mb-3">{offer.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span>Złożono: {offer.submittedAt}</span>
                          <span>Ofert: {offer.responses}</span>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">Budżet klienta</p>
                          <p className="font-bold text-lg">{offer.budget} zł</p>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Twoja oferta</p>
                          <p className="font-bold text-lg text-green-600">{offer.myOffer} zł</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edytuj</Button>
                          <Button size="sm">Szczegóły</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <h2 className="text-2xl font-bold">Historia projektów</h2>
            
            <div className="grid gap-4">
              {recentJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="font-medium">{job.client}</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <span>Ukończono: {job.completedAt}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{job.rating}/5.0</span>
                          </div>
                          <span>Czas realizacji: {job.duration}</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">"{job.feedback}"</p>
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-2xl font-bold text-green-600">{job.earnings} zł</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Zobacz szczegóły
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Profil firmy</h2>
              <Button 
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Zapisz zmiany
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edytuj profil
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Podstawowe informacje</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nazwa firmy</Label>
                        <Input 
                          value={contractorData.name} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Specjalizacja</Label>
                        <Input 
                          value={contractorData.specialization} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Telefon</Label>
                        <Input 
                          value={contractorData.phone} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input 
                          value={contractorData.email} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Strona internetowa</Label>
                        <Input 
                          value={contractorData.website} 
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>Rok założenia</Label>
                        <Input 
                          value={contractorData.founded} 
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Adres</Label>
                      <Input 
                        value={contractorData.address} 
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Opis firmy</Label>
                      <Textarea 
                        value={contractorData.description}
                        disabled={!isEditing}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certyfikaty i licencje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contractorData.licenses.map((license, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <span>{license}</span>
                          </div>
                          {isEditing && (
                            <Button variant="ghost" size="sm">
                              Usuń
                            </Button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Button variant="outline" className="w-full">
                          Dodaj certyfikat
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Zdjęcie profilowe</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={contractorData.avatar} />
                      <AvatarFallback className="text-2xl">
                        {contractorData.shortName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button variant="outline">
                        <Camera className="w-4 h-4 mr-2" />
                        Zmień zdjęcie
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ustawienia profilu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Profil publiczny</p>
                        <p className="text-sm text-gray-500">Widoczny dla klientów</p>
                      </div>
                      <Switch checked disabled={!isEditing} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Powiadomienia email</p>
                        <p className="text-sm text-gray-500">O nowych zleceniach</p>
                      </div>
                      <Switch checked disabled={!isEditing} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Automatyczne oferty</p>
                        <p className="text-sm text-gray-500">Dla dopasowanych zleceń</p>
                      </div>
                      <Switch disabled={!isEditing} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analityka i statystyki</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Skuteczność ofert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Wygrane oferty</span>
                        <span>35%</span>
                      </div>
                      <Progress value={35} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Shortlista</span>
                      <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Odrzucone</span>
                        <span>20%</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Miesięczne zarobki
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">45,000 zł</div>
                      <p className="text-sm text-gray-600">Luty 2024</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">38,500 zł</div>
                      <p className="text-sm text-gray-600">Styczeń 2024</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">+17%</div>
                      <p className="text-sm text-gray-600">Wzrost m/m</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">8,750 zł</div>
                      <p className="text-sm text-gray-600">Średnie zlecenie</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kategorie zleceń</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Remonty mieszkań</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Roboty budowlane</span>
                        <span>25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Instalacje</span>
                        <span>15%</span>
                      </div>
                      <Progress value={15} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Oceny klientów</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-yellow-500">{contractorData.rating}</div>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1,2,3,4,5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-5 h-5 ${star <= Math.floor(contractorData.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">Na podstawie {contractorData.completedJobs} opinii</p>
                  </div>
                  <div className="space-y-2">
                    {[5,4,3,2,1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm w-8">{stars}★</span>
                        <Progress value={stars === 5 ? 70 : stars === 4 ? 25 : 5} className="flex-1 h-2" />
                        <span className="text-sm text-gray-500 w-8">{stars === 5 ? '70%' : stars === 4 ? '25%' : '5%'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Messaging System Modal */}
      {showMessaging && (
        <MessagingSystem 
          onClose={() => setShowMessaging(false)}
        />
      )}

      {/* Bid Submission Modal */}
      {showBidSubmission && selectedTender && (
        <BidSubmissionForm
          tenderId={selectedTender.id}
          tenderTitle={selectedTender.title}
          tenderDeadline={selectedTender.deadline}
          tenderValue={selectedTender.value}
          tenderCurrency={selectedTender.currency}
          evaluationCriteria={selectedTender.evaluationCriteria}
          tenderRequirements={selectedTender.requirements}
          onClose={() => {
            setShowBidSubmission(false);
            setSelectedTender(null);
          }}
          onSubmit={handleBidFormSubmit}
        />
      )}
    </div>
  );
}