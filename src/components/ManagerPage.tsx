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
import { useEffect, useState, useRef } from 'react';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserProfile } from '../contexts/AuthContext';
import { getManagerById, mockApplications } from '../mocks';
import { createClient } from '../lib/supabase/client';
import { createTender, updateTender, fetchTenderById, fetchJobApplicationsByJobId, fetchJobById, fetchTenderBidsByTenderId } from '../lib/database/jobs';
import { fetchUserPrimaryCompany, type CompanyData } from '../lib/database/companies';
import { fetchCompanyBuildings } from '../lib/database/buildings';
import { fetchContractorsByWorkHistory } from '../lib/database/contractors';
import type { Building } from '../types/building';
import { BUILDING_TYPE_OPTIONS } from '../types/building';
import { toast } from 'sonner';
import { formatBudget, budgetFromDatabase } from '../types/budget';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { TenderWithCompany, type JobWithCompany } from '../lib/database/jobs';
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
  const searchParams = useSearchParams();
  
  // URL-based tab management (similar to ContractorPage)
  const [activeTab, setActiveTab] = useState('overview');
  const hasInitializedTabFromUrl = useRef(false);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<string | null>(null);
  const [showTenderCreation, setShowTenderCreation] = useState(false);
  const [showBidEvaluation, setShowBidEvaluation] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [editingTenderId, setEditingTenderId] = useState<string | null>(null);
  const [editingTenderData, setEditingTenderData] = useState<TenderWithCompany | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
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
  // Job details dialog state
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<string | null>(null);
  const [jobDetailsData, setJobDetailsData] = useState<JobWithCompany | null>(null);
  const [isLoadingJobDetails, setIsLoadingJobDetails] = useState(false);
  const [showJobDetailsDialog, setShowJobDetailsDialog] = useState(false);
  
  // Tab-specific loading states
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingContractors, setLoadingContractors] = useState(false);
  
  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  
  // Tab-specific data state
  const [recentJobs, setRecentJobs] = useState<Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    budget: string;
    applications: number;
    deadline: string;
    address: string;
  }>>([]);
  const [contractors, setContractors] = useState<Array<{
    id: string;
    name: string;
    specialization: string;
    rating: number;
    completedJobs: number;
    currentJob: string;
    avatar: string;
  }>>([]);
  const [dashboardStats, setDashboardStats] = useState<{
    totalProperties: number;
    totalUnits: number;
    activeJobs: number;
    completedJobs: number;
    avgRating: number;
    monthlyBudget: number;
  } | null>(null);

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

  // Helper function to map company type to Polish display name
  const getCompanyTypeDisplayName = (type: string | null): string => {
    const typeMap: { [key: string]: string } = {
      'wspólnota': 'Wspólnota Mieszkaniowa',
      'spółdzielnia': 'Spółdzielnia Mieszkaniowa',
      'property_management': 'Firma zarządzająca nieruchomościami',
      'housing_association': 'Stowarzyszenie Mieszkaniowe',
      'cooperative': 'Spółdzielnia',
      'condo_management': 'Zarządca Nieruchomości',
    };
    return typeMap[type || ''] || 'Organizacja zarządzająca';
  };

  // Format full address from company data
  const getCompanyAddress = (company: CompanyData | null): string => {
    if (!company) return '';
    const parts = [
      company.address,
      company.postal_code,
      company.city
    ].filter(Boolean);
    return parts.join(', ') || '';
  };

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
    
    // Initialize tab from URL on mount (only once)
    if (!hasInitializedTabFromUrl.current) {
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl && ['overview', 'jobs', 'tenders', 'properties', 'contractors'].includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      }
      hasInitializedTabFromUrl.current = true;
    }
  }, [searchParams]);

  // Persist tab state in URL
  useEffect(() => {
    if (!isMounted || !hasInitializedTabFromUrl.current) return;
    
    const currentTab = searchParams.get('tab') || 'overview';
    if (currentTab === activeTab) return; // No change needed
    
    const params = new URLSearchParams(searchParams);
    if (activeTab !== 'overview') {
      params.set('tab', activeTab);
    } else {
      params.delete('tab');
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [activeTab, isMounted, router, searchParams]);

  // Auto-open tender form if requested from main page
  useEffect(() => {
    if (shouldOpenTenderForm && isMounted && hasInitializedTabFromUrl.current) {
      setActiveTab('tenders');
      setShowTenderCreation(true);
      onTenderFormOpened?.();
    }
  }, [shouldOpenTenderForm, onTenderFormOpened, isMounted]);

  // Fetch company on initial load (needed for header)
  useEffect(() => {
    async function loadCompany() {
      if (!user?.id) return;

      // Priority 3: Prevent concurrent fetches
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setIsLoadingCompany(true);
      try {
        const supabase = createClient();
        const { data: companyData, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
        
        if (companyError || !companyData) {
          setCompany(null);
          setCompanyId(null);
          setIsLoadingCompany(false);
          isFetchingRef.current = false;
          return;
        }

        setCompany(companyData);
        setCompanyId(companyData.id);
      } catch (err) {
        console.error('Error loading company:', err);
        setCompany(null);
        setCompanyId(null);
      } finally {
        setIsLoadingCompany(false);
        // Priority 3: Reset fetch flag
        isFetchingRef.current = false;
      }
    }

    loadCompany();

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

  // Fetch job details when a job is selected for details dialog
  useEffect(() => {
    async function loadJobDetails() {
      if (!selectedJobForDetails || !showJobDetailsDialog) {
        return;
      }

      setIsLoadingJobDetails(true);
      try {
        const supabase = createClient();
        const { data: jobData, error: jobError } = await fetchJobById(supabase, selectedJobForDetails);
        
        if (jobError || !jobData) {
          console.error('Error fetching job details:', jobError);
          toast.error('Nie udało się załadować szczegółów zlecenia');
          setJobDetailsData(null);
        } else {
          setJobDetailsData(jobData);
        }
      } catch (err) {
        console.error('Error loading job details:', err);
        toast.error('Wystąpił błąd podczas ładowania szczegółów zlecenia');
        setJobDetailsData(null);
      } finally {
        setIsLoadingJobDetails(false);
      }
    }

    loadJobDetails();
  }, [selectedJobForDetails, showJobDetailsDialog]);

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

  // Fetch overview tab data when tab is opened
  useEffect(() => {
    const fetchOverviewData = async () => {
      if (activeTab !== 'overview' || !companyId || loadedTabs.has('overview')) {
        return;
      }

      const supabase = createClient();
      
      try {
        setLoadingOverview(true);
        
        // Fetch buildings count for stats
        const { data: buildingsData, error: buildingsError } = await fetchCompanyBuildings(supabase, companyId);
        const buildingsCount = buildingsData?.length || 0;
        const totalUnits = buildingsData?.reduce((sum, b) => sum + (b.units_count || 0), 0) || 0;
        
        // Fetch jobs count for stats (active jobs)
        const { count: activeJobsCount } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'active');
        
        const { count: completedJobsCount } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'completed');
        
        // Fetch recent jobs (limit 5 for overview)
        const { data: jobsData } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            budget_min,
            budget_max,
            budget_type,
            currency,
            deadline,
            status,
            job_categories (name),
            location
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Format jobs for display
        const formattedJobs = (jobsData || []).map((job: any) => {
          const location = typeof job.location === 'string' 
            ? job.location 
            : job.location?.city || 'Nieznana lokalizacja';
          
          return {
            id: job.id,
            title: job.title,
            category: job.job_categories?.name || 'Inne',
            status: job.status || 'active',
            budget: job.budget_min?.toString() || '0',
            applications: 0, // Would need to fetch separately
            deadline: job.deadline || '',
            address: location
          };
        });
        
        // Fetch recent contractors (limit 5 for overview)
        // For now, use mock data - can be replaced with actual query later
        const mockContractors = [
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
        
        // Set stats
        setDashboardStats({
          totalProperties: buildingsCount,
          totalUnits: totalUnits,
          activeJobs: activeJobsCount || 0,
          completedJobs: completedJobsCount || 0,
          avgRating: managerData.stats.avgRating,
          monthlyBudget: managerData.stats.monthlyBudget
        });
        
        setRecentJobs(formattedJobs);
        setContractors(mockContractors.slice(0, 3));
        
        setLoadedTabs(prev => new Set(prev).add('overview'));
      } catch (error) {
        console.error('Error fetching overview data:', error);
      } finally {
        setLoadingOverview(false);
      }
    };

    fetchOverviewData();
  }, [activeTab, companyId, loadedTabs, managerData.stats.avgRating, managerData.stats.monthlyBudget]);

  // Fetch jobs tab data when tab is opened
  useEffect(() => {
    const fetchJobsData = async () => {
      if (activeTab !== 'jobs' || !companyId || loadedTabs.has('jobs')) {
        return;
      }

      const supabase = createClient();
      
      try {
        setLoadingJobs(true);
        
        // Fetch all jobs for the company (similar to tenders tab)
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            budget_min,
            budget_max,
            budget_type,
            currency,
            deadline,
            status,
            job_categories (name),
            location
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (jobsError) {
          console.error('Error fetching jobs:', jobsError);
          toast.error('Nie udało się załadować zleceń');
          setRecentJobs([]);
          return;
        }

        // Get all job IDs to count applications
        const jobIds = (jobsData || []).map((job: any) => job.id);

        // Count applications for each job (all statuses)
        const applicationCounts: { [key: string]: number } = {};
        if (jobIds.length > 0) {
          const { data: applicationsData } = await (supabase as any)
            .from('job_applications')
            .select('job_id')
            .in('job_id', jobIds);

          if (applicationsData) {
            for (const app of applicationsData) {
              const jobId = app.job_id;
              if (jobId) {
                applicationCounts[jobId] = (applicationCounts[jobId] || 0) + 1;
              }
            }
          }
        }

        // Import budget helper
        const { budgetFromDatabase } = await import('../types/budget');

        // Format jobs for display
        const formattedJobs = (jobsData || []).map((job: any) => {
          const location = typeof job.location === 'string' 
            ? job.location 
            : job.location?.city || 'Nieznana lokalizacja';

          // Format budget
          const budget = budgetFromDatabase({
            budget_min: job.budget_min ?? null,
            budget_max: job.budget_max ?? null,
            budget_type: (job.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
            currency: job.currency || 'PLN',
          });
          const budgetStr = formatBudget(budget);

          return {
            id: job.id,
            title: job.title,
            category: job.job_categories?.name || 'Inne',
            status: job.status || 'active',
            budget: budgetStr,
            applications: applicationCounts[job.id] || 0,
            deadline: job.deadline || '',
            address: location
          };
        });
        
        setRecentJobs(formattedJobs);
        
        setLoadedTabs(prev => new Set(prev).add('jobs'));
      } catch (error) {
        console.error('Error fetching jobs data:', error);
        toast.error('Nie udało się załadować zleceń');
        setRecentJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobsData();
  }, [activeTab, companyId, loadedTabs]);

  // Fetch properties tab data when tab is opened
  useEffect(() => {
    const fetchPropertiesData = async () => {
      if (activeTab !== 'properties' || !companyId || loadedTabs.has('properties')) {
        return;
      }

      const supabase = createClient();
      
      try {
        setIsLoadingBuildings(true);
        
        // Fetch buildings from database
        const { data: buildingsData, error: buildingsError } = await fetchCompanyBuildings(supabase, companyId);
        
        if (buildingsError) {
          console.error('Error fetching buildings:', buildingsError);
          setBuildings([]);
        } else {
          setBuildings(buildingsData || []);
        }
        
        setLoadedTabs(prev => new Set(prev).add('properties'));
      } catch (error) {
        console.error('Error fetching properties data:', error);
        setBuildings([]);
      } finally {
        setIsLoadingBuildings(false);
      }
    };

    fetchPropertiesData();
  }, [activeTab, companyId, loadedTabs]);

  // Fetch contractors tab data when tab is opened
  useEffect(() => {
    const fetchContractorsData = async () => {
      if (activeTab !== 'contractors' || loadedTabs.has('contractors') || !companyId) {
        return;
      }

      try {
        setLoadingContractors(true);
        
        const supabase = createClient();
        const contractorsData = await fetchContractorsByWorkHistory(supabase, companyId);
        
        setContractors(contractorsData);
        
        setLoadedTabs(prev => new Set(prev).add('contractors'));
      } catch (error) {
        console.error('Error fetching contractors data:', error);
        toast.error('Nie udało się załadować wykonawców');
        setContractors([]);
      } finally {
        setLoadingContractors(false);
      }
    };

    fetchContractorsData();
  }, [activeTab, loadedTabs, companyId]);

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
    // Stay in tenders tab to view bids
  };

  const handleAwardTender = (bidId: string, notes: string) => {
    // In real app, this would award the tender
    setShowBidEvaluation(false);
  };

  const handleRejectBid = (bidId: string, reason: string) => {
    // In real app, this would reject the bid
  };

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
                <AvatarImage src={company?.logo_url || ''} />
                <AvatarFallback className="bg-primary text-white">
                  {(company?.name || user?.company || 'N').split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{company?.name || user?.company || 'Nowa organizacja'}</h1>
                <p className="text-gray-600">{getCompanyTypeDisplayName(company?.type || null)}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  {getCompanyAddress(company) && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{getCompanyAddress(company)}</span>
                    </div>
                  )}
                  {company?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {(company?.email || user?.email) && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{company?.email || user?.email}</span>
                    </div>
                  )}
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="jobs">Zlecenia</TabsTrigger>
            <TabsTrigger value="tenders">Przetargi</TabsTrigger>
            <TabsTrigger value="properties">Nieruchomości</TabsTrigger>
            <TabsTrigger value="contractors">Wykonawcy</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loadingOverview ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-2 text-sm text-muted-foreground">Ładowanie danych...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Nieruchomości</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats?.totalProperties || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardStats?.totalUnits || 0} lokali mieszkalnych
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Aktywne zlecenia</CardTitle>
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats?.activeJobs || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardStats?.completedJobs || 0} zakończonych w tym roku
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ocena wykonawców</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats?.avgRating || 0}</div>
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
                      <div className="text-2xl font-bold">{(dashboardStats?.monthlyBudget || 0).toLocaleString()} zł</div>
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
                      {recentJobs.length > 0 ? recentJobs.slice(0, 3).map((job) => (
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
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Brak zleceń</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sprawdzeni wykonawcy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contractors.length > 0 ? contractors.slice(0, 3).map((contractor) => (
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
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Brak wykonawców</p>
                  )}
                </CardContent>
              </Card>
            </div>
              </>
            )}
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

            {loadingJobs ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-2 text-sm text-muted-foreground">Ładowanie zleceń...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {recentJobs.length > 0 ? recentJobs.map((job) => (
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedJobForDetails(job.id);
                              setShowJobDetailsDialog(true);
                            }}
                          >
                            Szczegóły
                          </Button>
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
              )) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">Brak zleceń</p>
                  </CardContent>
                </Card>
              )}
            </div>
            )}
          </TabsContent>

          {/* Tenders Tab */}
          <TabsContent value="tenders" className="space-y-6">
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
              <TenderSystem 
                userRole="manager"
                onTenderCreate={handleTenderCreate}
                onTenderSelect={handleTenderSelect}
                onTenderEdit={handleTenderEdit}
                onViewBids={(tenderId) => {
                  setSelectedTenderId(tenderId);
                  setShowBidEvaluation(true);
                }}
              />
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
            </div>
            
            {loadingContractors ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-2 text-sm text-muted-foreground">Ładowanie wykonawców...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {contractors.length > 0 ? (
                  contractors.map((contractor) => (
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
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">Brak wykonawców</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
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

      {/* Job Details Dialog */}
      <Dialog open={showJobDetailsDialog} onOpenChange={(open) => {
        setShowJobDetailsDialog(open);
        if (!open) {
          setSelectedJobForDetails(null);
          setJobDetailsData(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Szczegóły zlecenia</DialogTitle>
            <DialogDescription>
              Pełne informacje o zleceniu
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingJobDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">Ładowanie szczegółów...</p>
            </div>
          ) : jobDetailsData ? (
            <div className="space-y-4">
              {/* Title and Status */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{jobDetailsData.title}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    {getStatusBadge(jobDetailsData.status)}
                    <span className="text-sm text-gray-600">
                      {jobDetailsData.category?.name || 'Inne'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-lg">
                  {jobDetailsData.budget 
                    ? formatBudget(jobDetailsData.budget)
                    : formatBudget(budgetFromDatabase({
                        budget_min: jobDetailsData.budget_min ?? null,
                        budget_max: jobDetailsData.budget_max ?? null,
                        budget_type: (jobDetailsData.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
                        currency: jobDetailsData.currency || 'PLN',
                      }))}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {typeof jobDetailsData.location === 'string' 
                    ? jobDetailsData.location 
                    : jobDetailsData.location?.city || 'Nieznana lokalizacja'}
                </span>
              </div>

              {/* Deadline */}
              {jobDetailsData.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    Termin: {new Date(jobDetailsData.deadline).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              )}

              {/* Description */}
              {jobDetailsData.description && (
                <div>
                  <h3 className="font-semibold mb-2">Opis zlecenia</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{jobDetailsData.description}</p>
                </div>
              )}

              {/* Requirements */}
              {jobDetailsData.requirements && jobDetailsData.requirements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Wymagania</h3>
                  <ul className="space-y-1">
                    {jobDetailsData.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Responsibilities */}
              {jobDetailsData.responsibilities && jobDetailsData.responsibilities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Zakres prac</h3>
                  <ul className="space-y-1">
                    {jobDetailsData.responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-gray-700">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Required */}
              {jobDetailsData.skills_required && jobDetailsData.skills_required.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Wymagane umiejętności</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobDetailsData.skills_required.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(jobDetailsData.contact_person || jobDetailsData.contact_phone || jobDetailsData.contact_email) && (
                <div>
                  <h3 className="font-semibold mb-2">Informacje kontaktowe</h3>
                  <div className="space-y-1 text-sm">
                    {jobDetailsData.contact_person && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_person}</span>
                      </div>
                    )}
                    {jobDetailsData.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_phone}</span>
                      </div>
                    )}
                    {jobDetailsData.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{jobDetailsData.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Building Information */}
              {jobDetailsData.building_type && (
                <div>
                  <h3 className="font-semibold mb-2">Informacje o budynku</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>Typ budynku: {jobDetailsData.building_type}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nie udało się załadować szczegółów zlecenia</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}