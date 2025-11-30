"use client";

import {
  Building as BuildingIcon,
  Building2,
  Calendar,
  ClipboardList,
  Euro,
  Mail,
  MapPin,
  Phone,
  Star,
  UserCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../contexts/AuthContext';
import { getManagerById, mockApplications } from '../mocks';
import { createClient } from '../lib/supabase/client';
import { createTender, updateTender, fetchTenderById, fetchJobApplicationsByJobId, fetchJobById, fetchTenderBidsByTenderId } from '../lib/database/jobs';
import { fetchUserPrimaryCompany } from '../lib/database/companies';
import { fetchCompanyBuildings } from '../lib/database/buildings';
import type { Building } from '../types/building';
import { BUILDING_TYPE_OPTIONS } from '../types/building';
import { toast } from 'sonner';
import { formatBudget } from '../types/budget';
import type { Budget } from '../types/budget';
import BidEvaluationPanel from './BidEvaluationPanel';
import JobApplicationsList from './JobApplicationsList';
import TenderCreationForm from './TenderCreationForm';
import TenderSystem from './TenderSystem';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TenderWithCompany } from '../lib/database/jobs';
import Image from 'next/image';

interface ManagerPageProps {
  onBack: () => void;
  onPostJob: () => void;
  shouldOpenTenderForm?: boolean;
  onTenderFormOpened?: () => void;
}

export default function ManagerPage({ onBack, onPostJob, shouldOpenTenderForm, onTenderFormOpened }: ManagerPageProps) {
  const { user, isLoading } = useUserProfile();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<string | null>(null);
  const [showTenderCreation, setShowTenderCreation] = useState(false);
  const [showBidEvaluation, setShowBidEvaluation] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [editingTenderId, setEditingTenderId] = useState<string | null>(null);
  const [editingTenderData, setEditingTenderData] = useState<TenderWithCompany | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  // Priority 3: Prevent concurrent fetches
  const isFetchingRef = React.useRef(false);
  // Track client-side mount to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  // Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [selectedJobData, setSelectedJobData] = useState<{ title: string; budget: string } | null>(null);
  // Tender bids state
  const [tenderBids, setTenderBids] = useState<any[]>([]);
  const [isLoadingTenderBids, setIsLoadingTenderBids] = useState(false);
  const [selectedTenderData, setSelectedTenderData] = useState<{ title: string } | null>(null);

  // Helper function to get public URL for building images
  const getBuildingImageUrl = React.useCallback((imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Otherwise, convert storage path to public URL
    const supabase = createClient();
    const { data } = supabase.storage
      .from('building-images')
      .getPublicUrl(imagePath);
    
    return data.publicUrl;
  }, []);

  // Pobierz dane zarządcy na podstawie profileId z konta użytkownika
  const managerProfile = user?.id ? getManagerById(user.id) : null;

  // Jeśli brak profilu, użyj domyślnych danych
  const managerData = managerProfile ? {
    name: managerProfile.name,
    type: managerProfile.organizationType === 'wspólnota' ? 'Wspólnota Mieszkaniowa' :
          managerProfile.organizationType === 'spółdzielnia' ? 'Spółdzielnia Mieszkaniowa' :
          managerProfile.organizationType === 'zarządca' ? 'Firma zarządzająca nieruchomościami' :
          managerProfile.organizationType === 'deweloper' ? 'Deweloper' :
          'Administracja nieruchomości',
    address: managerProfile.contactInfo.address,
    phone: managerProfile.contactInfo.phone,
    email: managerProfile.contactInfo.email,
    avatar: managerProfile.avatar || '',
    managerName: managerProfile.contactInfo.contactPerson,
    managerPosition: managerProfile.contactInfo.position,
    license: managerProfile.verification.badges.join(', '),
    experience: `${managerProfile.experience.yearsActive} lat`,
    managedProperties: managerProfile.portfolio.managedBuildings.map(building => ({
      name: building.name,
      type: building.type,
      image: building.images?.[0] || '/api/placeholder/400/300',
      location: building.address,
      buildings: building.type === 'Bloki mieszkalne' ? 10 : 1,
      units: building.unitsCount,
      since: building.yearBuilt.toString()
    })),
    stats: {
      totalProperties: managerProfile.managedProperties.buildingsCount,
      totalUnits: managerProfile.managedProperties.unitsCount,
      activeJobs: 8, // Te dane mogą pochodzić z backendu
      completedJobs: managerProfile.experience.completedProjects,
      avgRating: managerProfile.rating.overall,
      monthlyBudget: 125000 // Przykładowy budżet
    }
  } : {
    // Fallback data dla użytkowników bez pełnego profilu
    name: user?.company || "Nowa organizacja",
    type: "Organizacja zarządzająca",
    address: "ul. Przykładowa 1, 00-000 Warszawa",
    phone: user?.phone || "+48 123 456 789",
    email: user?.email || "kontakt@example.pl",
    avatar: "",
    managerName: `${user?.firstName} ${user?.lastName}` || "Imię Nazwisko",
    managerPosition: "Zarządca",
    license: "Brak licencji",
    experience: "Brak danych",
    managedProperties: [],
    stats: {
      totalProperties: 0,
      totalUnits: 0,
      activeJobs: 0,
      completedJobs: 0,
      avgRating: 0,
      monthlyBudget: 0
    }
  };

  // Track client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-open tender form if requested from main page
  useEffect(() => {
    if (shouldOpenTenderForm) {
      setActiveTab('tenders');
      setShowTenderCreation(true);
      onTenderFormOpened?.();
    }
  }, [shouldOpenTenderForm, onTenderFormOpened]);

  // Fetch company and buildings
  useEffect(() => {
    async function loadBuildings() {
      if (!user?.id) return;

      // Priority 3: Prevent concurrent fetches
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setIsLoadingBuildings(true);
      try {
        const supabase = createClient();
        const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
        
        if (companyError || !company) {
          setBuildings([]);
          setCompanyId(null);
          return;
        }

        setCompanyId(company.id);

        // Fetch buildings from database
        const { data: buildingsData, error: buildingsError } = await fetchCompanyBuildings(supabase, company.id);
        
        if (buildingsError) {
          console.error('Error fetching buildings:', buildingsError);
          setBuildings([]);
        } else {
          setBuildings(buildingsData || []);
        }
      } catch (err) {
        console.error('Error loading buildings:', err);
        setBuildings([]);
      } finally {
        setIsLoadingBuildings(false);
        // Priority 3: Reset fetch flag
        isFetchingRef.current = false;
      }
    }

    loadBuildings();

    // Cleanup function
    return () => {
      isFetchingRef.current = false;
    };
  }, [user?.id]);

  const handleStatusChange = (applicationId: string, status: string, notes?: string) => {
    // In real app, this would update the application in the backend
  };

  const handleStartConversation = (contractorId: string) => {
    // In real app, this would open messaging interface
  };

  // Fetch applications when a job is selected
  useEffect(() => {
    async function loadApplications() {
      if (!selectedJobForApplications) {
        setApplications([]);
        setSelectedJobData(null);
        return;
      }

      setIsLoadingApplications(true);
      try {
        const supabase = createClient();
        
        // Fetch job data to get title and budget
        const { data: jobData, error: jobError } = await fetchJobById(supabase, selectedJobForApplications);
        
        if (jobError || !jobData) {
          console.error('Error fetching job data:', jobError);
          toast.error('Nie udało się załadować danych zlecenia');
          setSelectedJobData(null);
        } else {
          // Format budget from raw fields
          const { budgetFromDatabase } = await import('../types/budget');
          const budget = jobData.budget || budgetFromDatabase({
            budget_min: jobData.budget_min ?? null,
            budget_max: jobData.budget_max ?? null,
            budget_type: (jobData.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
            currency: jobData.currency || 'PLN',
          });
          
          const budgetStr = formatBudget(budget);
          
          setSelectedJobData({
            title: jobData.title,
            budget: budgetStr
          });
        }
        
        // Fetch applications
        const { data: applicationsData, error: applicationsError } = await fetchJobApplicationsByJobId(
          supabase,
          selectedJobForApplications
        );
        
        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
          toast.error('Nie udało się załadować ofert');
          setApplications([]);
        } else {
          setApplications(applicationsData || []);
        }
      } catch (err) {
        console.error('Error loading applications:', err);
        toast.error('Wystąpił błąd podczas ładowania ofert');
        setApplications([]);
      } finally {
        setIsLoadingApplications(false);
      }
    }

    loadApplications();
  }, [selectedJobForApplications]);

  // Fetch tender bids when a tender is selected for evaluation
  useEffect(() => {
    async function loadTenderBids() {
      if (!selectedTenderId || !showBidEvaluation) {
        setTenderBids([]);
        setSelectedTenderData(null);
        return;
      }

      setIsLoadingTenderBids(true);
      try {
        const supabase = createClient();
        
        // Fetch tender data to get title
        const { data: tenderData, error: tenderError } = await fetchTenderById(supabase, selectedTenderId);
        
        if (tenderError || !tenderData) {
          console.error('Error fetching tender data:', tenderError);
          toast.error('Nie udało się załadować danych przetargu');
          setSelectedTenderData(null);
        } else {
          setSelectedTenderData({
            title: tenderData.title
          });
        }
        
        // Fetch bids
        const { data: bidsData, error: bidsError } = await fetchTenderBidsByTenderId(
          supabase,
          selectedTenderId
        );
        
        if (bidsError) {
          console.error('Error fetching tender bids:', bidsError);
          toast.error('Nie udało się załadować ofert');
          setTenderBids([]);
        } else {
          setTenderBids(bidsData || []);
        }
      } catch (err) {
        console.error('Error loading tender bids:', err);
        toast.error('Wystąpił błąd podczas ładowania ofert');
        setTenderBids([]);
      } finally {
        setIsLoadingTenderBids(false);
      }
    }

    loadTenderBids();
  }, [selectedTenderId, showBidEvaluation]);

  const handleTenderCreate = () => {
    setEditingTenderId(null);
    setEditingTenderData(null);
    setShowTenderCreation(true);
  };

  const handleTenderEdit = async (tenderId: string) => {
    try {
      const supabase = createClient();
      const { data: tenderData, error } = await fetchTenderById(supabase, tenderId);
      
      if (error || !tenderData) {
        toast.error('Nie udało się załadować danych przetargu');
        console.error('Error fetching tender:', error);
        return;
      }

      // Verify it's a draft tender
      if (tenderData.status !== 'draft') {
        toast.error('Tylko przetargi w statusie szkicu mogą być edytowane');
        return;
      }

      setEditingTenderId(tenderId);
      setEditingTenderData(tenderData);
      setShowTenderCreation(true);
    } catch (error) {
      toast.error('Wystąpił błąd podczas ładowania przetargu');
      console.error('Error in handleTenderEdit:', error);
    }
  };

  const handleTenderSubmit = async (tender: any, tenderId?: string) => {
    if (!user?.id) {
      toast.error('Musisz być zalogowany, aby utworzyć przetarg');
      return;
    }

    try {
      const supabase = createClient();
      
      // Check if we're editing or creating
      const isEditing = !!tenderId;
      
      if (isEditing) {
        // Update existing tender
        const { data: updatedTender, error: updateError } = await updateTender(supabase, tenderId, tender);
        
        if (updateError) {
          toast.error('Nie udało się zaktualizować przetargu: ' + (updateError.message || 'Nieznany błąd'));
          console.error('Error updating tender:', updateError);
          return;
        }

        toast.success(tender.status === 'draft' ? 'Przetarg zaktualizowany jako szkic' : 'Przetarg został zaktualizowany i opublikowany');
      } else {
        // Create new tender
        // Get user's primary company
        const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
        
        if (companyError || !company) {
          toast.error('Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.');
          console.error('Error fetching company:', companyError);
          return;
        }

        // Save tender to database
        const { data: savedTender, error: saveError } = await createTender(supabase, {
          ...tender,
          managerId: user.id,
          companyId: company.id,
        });

        if (saveError) {
          toast.error('Nie udało się zapisać przetargu: ' + (saveError.message || 'Nieznany błąd'));
          console.error('Error saving tender:', saveError);
          return;
        }

        toast.success(tender.status === 'draft' ? 'Przetarg zapisany jako szkic' : 'Przetarg został opublikowany');
      }

      // Reset editing state
      setEditingTenderId(null);
      setEditingTenderData(null);
      setShowTenderCreation(false);
      
      // Refresh the page to show the updated/new tender
      window.location.reload();
    } catch (error) {
      toast.error('Wystąpił błąd podczas zapisywania przetargu');
      console.error('Error in handleTenderSubmit:', error);
    }
  };

  const handleTenderSelect = (tenderId: string) => {
    setSelectedTenderId(tenderId);
    setShowBidEvaluation(true);
    // Switch to tender-bids tab to view bids
    setActiveTab('tender-bids');
  };

  const handleAwardTender = (bidId: string, notes: string) => {
    // In real app, this would award the tender
    setShowBidEvaluation(false);
  };

  const handleRejectBid = (bidId: string, reason: string) => {
    // In real app, this would reject the bid
  };

  // Mockowe dane - w przyszłości z backendu
  const recentJobs = [
    {
      id: '1',
      title: 'Malowanie klatki schodowej - budynek A',
      category: 'Roboty Remontowo-Budowlane',
      status: 'active',
      budget: '12000',
      applications: 7,
      deadline: '2024-02-15',
      address: managerData.managedProperties[0]?.name || 'ul. Kwiatowa 15A'
    },
    {
      id: '2', 
      title: 'Konserwacja wind w budynku B',
      category: 'Utrzymanie techniczne i konserwacja',
      status: 'completed',
      budget: '8500',
      applications: 3,
      deadline: '2024-01-30',
      address: managerData.managedProperties[1]?.name || 'ul. Kwiatowa 15B'
    },
    {
      id: '3',
      title: 'Odśnieżanie parkingu',
      category: 'Utrzymanie Czystości i Zieleni',
      status: 'pending',
      budget: '3000',
      applications: 12,
      deadline: '2024-02-01',
      address: 'Parking - ' + (managerData.managedProperties[0]?.name || 'ul. Kwiatowa 15')
    }
  ];

  const contractors = [
    {
      id: '1',
      name: 'Firma Malarze Sp. z o.o.',
      specialization: 'Roboty malarskie',
      rating: 4.8,
      completedJobs: 23,
      currentJob: 'Malowanie klatki schodowej',
      avatar: ''
    },
    {
      id: '2',
      name: 'TechService Windy',
      specialization: 'Konserwacja wind',
      rating: 4.9,
      completedJobs: 15,
      currentJob: 'Przegląd roczny wind',
      avatar: ''
    },
    {
      id: '3',
      name: 'Zielona Firma',
      specialization: 'Utrzymanie zieleni',
      rating: 4.5,
      completedJobs: 31,
      currentJob: 'Przycinanie krzewów',
      avatar: ''
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Aktywne', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Zakończone', variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Oczekujące', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Priority 2: Standardize loading states - show loading spinner during auth checks
  // Must be after all hooks to follow Rules of Hooks
  // Prevent hydration mismatch by not rendering loading state during SSR
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Ładowanie...</p>
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
              <Avatar className="w-16 h-16">
                <AvatarImage src={managerData.avatar} />
                <AvatarFallback className="bg-primary text-white">
                  {managerData.name.split(' ').map(word => word[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{managerData.name}</h1>
                <p className="text-gray-600">{managerData.type}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{managerData.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{managerData.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{managerData.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack}>
                Powrót do listy zleceń
              </Button>
              <Button variant="outline" onClick={handleTenderCreate}>
                Utwórz przetarg
              </Button>
              <Button onClick={onPostJob}>
                Opublikuj zlecenie
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="jobs">Zlecenia</TabsTrigger>
            <TabsTrigger value="applications">Otrzymane oferty</TabsTrigger>
            <TabsTrigger value="tenders">Przetargi</TabsTrigger>
            <TabsTrigger value="tender-bids">Oferty przetargowe</TabsTrigger>
            <TabsTrigger value="properties">Nieruchomości</TabsTrigger>
            <TabsTrigger value="contractors">Wykonawcy</TabsTrigger>
            <TabsTrigger value="analytics">Analityka</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nieruchomości</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{buildings.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {buildings.reduce((sum, b) => sum + (b.units_count || 0), 0)} lokali mieszkalnych
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aktywne zlecenia</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{managerData.stats.activeJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    {managerData.stats.completedJobs} zakończonych w tym roku
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocena wykonawców</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{managerData.stats.avgRating}</div>
                  <p className="text-xs text-muted-foreground">
                    Średnia ocena z ostatnich projektów
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Budżet miesięczny</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{managerData.stats.monthlyBudget.toLocaleString()} zł</div>
                  <p className="text-xs text-muted-foreground">
                    Planowany na luty 2024
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Najnowsze zlecenia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentJobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(job.status)}
                          <span className="text-xs text-gray-500">{job.applications} ofert</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatBudget(
                            typeof job.budget === 'string' 
                              ? {
                                  min: parseFloat(job.budget) || null,
                                  max: parseFloat(job.budget) || null,
                                  type: 'fixed',
                                  currency: 'PLN',
                                }
                              : job.budget
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{job.deadline}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sprawdzeni wykonawcy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contractors.slice(0, 3).map((contractor) => (
                    <div key={contractor.id} className="flex items-center gap-3 border-b pb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contractor.avatar} />
                        <AvatarFallback>{contractor.name.split(' ')[0][0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{contractor.name}</h4>
                        <p className="text-sm text-gray-600">{contractor.specialization}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{contractor.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">{contractor.completedJobs} projektów</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Zarządzanie zleceniami</h2>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleTenderCreate}>
                  Utwórz przetarg
                </Button>
                <Button onClick={onPostJob}>
                  Dodaj zlecenie
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {recentJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          {getStatusBadge(job.status)}
                        </div>
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
                          {formatBudget(
                            typeof job.budget === 'string' 
                              ? {
                                  min: parseFloat(job.budget) || null,
                                  max: parseFloat(job.budget) || null,
                                  type: 'fixed',
                                  currency: 'PLN',
                                }
                              : job.budget
                          )}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm">Szczegóły</Button>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedJobForApplications(job.id)}
                          >
                            Zobacz oferty
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            {selectedJobForApplications ? (
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedJobForApplications(null)}
                  className="mb-4"
                >
                  ← Powrót do listy ofert
                </Button>
                {isLoadingApplications ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="ml-2 text-sm text-muted-foreground">Ładowanie ofert...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <JobApplicationsList
                    jobId={selectedJobForApplications}
                    jobTitle={selectedJobData?.title || 'Zlecenie'}
                    jobBudget={selectedJobData?.budget}
                    applications={applications}
                    onStatusChange={handleStatusChange}
                    onStartConversation={handleStartConversation}
                  />
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">Zarządzanie ofertami</h2>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">23</div>
                      <div className="text-sm text-gray-600">Nowe oferty</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">12</div>
                      <div className="text-sm text-gray-600">W trakcie oceny</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">8</div>
                      <div className="text-sm text-gray-600">Zaakceptowane</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">5</div>
                      <div className="text-sm text-gray-600">Odrzucone</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Jobs with Applications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Zlecenia z ofertami</h3>
                  {recentJobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{job.title}</h3>
                              {getStatusBadge(job.status)}
                            </div>
                            <p className="text-gray-600 mb-2">{job.category}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{job.address}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <UserCheck className="w-4 h-4" />
                                <span>{job.applications} ofert</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Termin: {job.deadline}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                          {formatBudget(
                            typeof job.budget === 'string' 
                              ? {
                                  min: parseFloat(job.budget) || null,
                                  max: parseFloat(job.budget) || null,
                                  type: 'fixed',
                                  currency: 'PLN',
                                }
                              : job.budget
                          )}
                        </p>
                            <div className="flex gap-2 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedJobForApplications(job.id)}
                              >
                                Zobacz oferty ({job.applications})
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tenders Tab */}
          <TabsContent value="tenders" className="space-y-6">
            <TenderSystem 
              userRole="manager"
              onTenderCreate={handleTenderCreate}
              onTenderSelect={handleTenderSelect}
              onTenderEdit={handleTenderEdit}
            />
          </TabsContent>

          {/* Tender Bids Tab */}
          <TabsContent value="tender-bids" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Oferty przetargowe</h2>
            </div>

            {selectedTenderId && showBidEvaluation ? (
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedTenderId(null);
                    setShowBidEvaluation(false);
                  }}
                  className="mb-4"
                >
                  ← Powrót do listy przetargów
                </Button>
                {isLoadingTenderBids ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="ml-2 text-sm text-muted-foreground">Ładowanie ofert...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <BidEvaluationPanel
                    tenderId={selectedTenderId}
                    tenderTitle={selectedTenderData?.title || 'Przetarg'}
                    evaluationCriteria={[
                      { id: 'price', name: 'Cena oferty', description: 'Łączna cena realizacji', weight: 40, type: 'price' },
                      { id: 'quality', name: 'Jakość wykonania', description: 'Doświadczenie i referencje', weight: 30, type: 'quality' },
                      { id: 'time', name: 'Termin realizacji', description: 'Czas wykonania prac', weight: 20, type: 'time' },
                      { id: 'warranty', name: 'Gwarancja', description: 'Okres gwarancji i serwis', weight: 10, type: 'quality' }
                    ]}
                    bids={tenderBids}
                    onClose={() => {
                      setShowBidEvaluation(false);
                      setSelectedTenderId(null);
                    }}
                    onAwardTender={handleAwardTender}
                    onRejectBid={handleRejectBid}
                  />
                )}
              </div>
            ) : (
              <div>
                <Card>
                  <CardContent className="p-8 text-center">
                    <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-2">Wybierz przetarg</h3>
                    <p className="text-gray-600 mb-6">
                      Przejdź do zakładki "Przetargi" i wybierz przetarg, aby zobaczyć złożone oferty.
                    </p>
                    <Button onClick={() => setActiveTab('tenders')}>
                      Przejdź do przetargów
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            {isLoadingBuildings ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-2 text-sm text-muted-foreground">Ładowanie budynków...</p>
                  </div>
                </CardContent>
              </Card>
            ) : buildings && buildings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {buildings.map((building) => {
                  // Get first image URL if available
                  const firstImage = building.images && building.images.length > 0 
                    ? building.images[0] 
                    : null;
                  const imageUrl = getBuildingImageUrl(firstImage);
                  
                  return (
                  <Card key={building.id}>
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden flex items-center justify-center relative">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={building.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <Building2 className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle>{building.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{building.street_address}, {building.city}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {building.building_type && (
                          <Badge variant="secondary">
                            {BUILDING_TYPE_OPTIONS.find(opt => opt.value === building.building_type)?.label || building.building_type}
                          </Badge>
                        )}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          {building.year_built && (
                            <div>
                              <div className="font-bold text-lg">{building.year_built}</div>
                              <div className="text-sm text-gray-600">Rok budowy</div>
                            </div>
                          )}
                          {building.units_count !== null && (
                            <div>
                              <div className="font-bold text-lg">{building.units_count}</div>
                              <div className="text-sm text-gray-600">Lokali</div>
                            </div>
                          )}
                          {building.floors_count !== null && (
                            <div>
                              <div className="font-bold text-lg">{building.floors_count}</div>
                              <div className="text-sm text-gray-600">Pięter</div>
                            </div>
                          )}
                        </div>
                        {building.notes && (
                          <p className="text-sm text-gray-600 mt-2">{building.notes}</p>
                        )}
                        {building.postal_code && (
                          <p className="text-xs text-gray-500">Kod pocztowy: {building.postal_code}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <BuildingIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Brak zarejestrowanych budynków</h3>
                  <p className="text-gray-600 mb-4">Nie posiadasz jeszcze zarejestrowanych budynków w portfolio.</p>
                  <p className="text-sm text-gray-500">
                    Przejdź do sekcji "Firma" w ustawieniach konta, aby dodać budynki.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contractors Tab */}
          <TabsContent value="contractors" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Wykonawcy</h2>
              <Button variant="outline" onClick={() => router.push('/contractors')}>
                Przeglądaj wszystkich wykonawców
              </Button>
            </div>
            
            <div className="grid gap-4">
              {contractors.map((contractor) => (
                <Card key={contractor.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={contractor.avatar} />
                        <AvatarFallback>{contractor.name.split(' ')[0][0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{contractor.name}</h3>
                        <p className="text-gray-600 mb-2">{contractor.specialization}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{contractor.rating} • {contractor.completedJobs} projektów</span>
                          </div>
                          <Badge variant="outline">{contractor.currentJob}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Kliknij "Zobacz profil", aby zobaczyć portfolio wykonawcy
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Wyślij wiadomość</Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/contractors/${contractor.id}`)}
                        >
                          Zobacz profil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Analityka i raporty</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Wydatki miesięczne</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Wykres wydatków
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Efektywność wykonawców</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Wykres efektywności
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showTenderCreation && (
        <TenderCreationForm
          onClose={() => {
            setShowTenderCreation(false);
            setEditingTenderId(null);
            setEditingTenderData(null);
          }}
          onSubmit={handleTenderSubmit}
          tenderId={editingTenderId || undefined}
          initialData={editingTenderData || undefined}
        />
      )}

      {/* Bid Evaluation Modal - Only show if not in tender-bids tab */}
      {showBidEvaluation && selectedTenderId && activeTab !== 'tender-bids' && (
        <>
          {isLoadingTenderBids ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Ładowanie ofert...</p>
                </div>
              </div>
            </div>
          ) : (
            <BidEvaluationPanel
              tenderId={selectedTenderId}
              tenderTitle={selectedTenderData?.title || 'Przetarg'}
              evaluationCriteria={[
                { id: 'price', name: 'Cena oferty', description: 'Łączna cena realizacji', weight: 40, type: 'price' },
                { id: 'quality', name: 'Jakość wykonania', description: 'Doświadczenie i referencje', weight: 30, type: 'quality' },
                { id: 'time', name: 'Termin realizacji', description: 'Czas wykonania prac', weight: 20, type: 'time' },
                { id: 'warranty', name: 'Gwarancja', description: 'Okres gwarancji i serwis', weight: 10, type: 'quality' }
              ]}
              bids={tenderBids}
              onClose={() => {
                setShowBidEvaluation(false);
                setSelectedTenderId(null);
              }}
              onAwardTender={handleAwardTender}
              onRejectBid={handleRejectBid}
            />
          )}
        </>
      )}
    </div>
  );
}