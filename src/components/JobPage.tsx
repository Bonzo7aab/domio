"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Clock, Building, Star, Award, CheckCircle, AlertCircle, Gavel, AlertTriangle, Bookmark, HelpCircle, Image as ImageIcon, FileText, ExternalLink } from 'lucide-react';
import { ImageZoom } from './ui/image-zoom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

import JobApplicationModal from './JobApplicationModal';
import { AskQuestionModal } from './AskQuestionModal';
import SimilarJobs from './SimilarJobs';
import { useUserProfile } from '../contexts/AuthContext';
import { getStoredJobs, Job as StoredJob } from '../utils/jobStorage';
import { addBookmark, removeBookmark, isJobBookmarked } from '../utils/bookmarkStorage';
import { toast } from 'sonner';
import { getJobById, getTenderById } from '../lib/data';
import { incrementJobViews, incrementTenderViews, type JobWithCompany, type TenderWithCompany } from '../lib/database/jobs';
import { formatBudget, budgetFromDatabase, type Budget } from '../types/budget';
import { type Job, type TenderInfo } from '../types/job';

interface JobPageProps {
  jobId: string;
  onBack?: () => void;
  onJobSelect?: (jobId: string) => void;
}

// Extended Job type for component display with additional fields
interface JobDisplayData extends Job {
  address?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  published_at?: string | null;
  expires_at?: string | null;
}

// Helper function to convert date to "time ago" format
function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Przed chwilą';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min temu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} godz. temu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dni temu`;
  
  return past.toLocaleDateString('pl-PL');
}

// Helper function to map company type to client type
function mapCompanyTypeToClientType(companyType?: string): string {
  switch (companyType) {
    case 'spółdzielnia':
      return 'Spółdzielnia Mieszkaniowa';
    case 'wspólnota':
      return 'Wspólnota Mieszkaniowa';
    case 'housing_association':
      return 'Wspólnota Mieszkaniowa';
    case 'cooperative':
      return 'Spółdzielnia Mieszkaniowa';
    case 'condo_management':
      return 'Wspólnota Mieszkaniowa';
    case 'property_management':
      return 'Wspólnota Mieszkaniowa';
    default:
      return 'Wspólnota Mieszkaniowa';
  }
}

// Helper function to format location (string or object)
function formatLocation(location: string | { city: string; sublocality_level_1?: string } | undefined): string {
  if (!location) return 'Unknown';
  
  if (typeof location === 'string') {
    return location;
  }
  
  if (typeof location === 'object' && location !== null && 'city' in location) {
    if (location.sublocality_level_1) {
      return `${location.city || 'Unknown'}, ${location.sublocality_level_1}`;
    }
    return location.city || 'Unknown';
  }
  
  return 'Unknown';
}

// Get status badge variant
function getStatusBadgeVariant(status?: string) {
  switch (status) {
    case 'active':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'paused':
      return 'outline';
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
}

// Get status label in Polish
function getStatusLabel(status?: string): string {
  switch (status) {
    case 'active':
      return 'Aktywne';
    case 'draft':
      return 'Szkic';
    case 'paused':
      return 'Wstrzymane';
    case 'completed':
      return 'Zakończone';
    case 'cancelled':
      return 'Anulowane';
    default:
      return 'Aktywne';
  }
}

/**
 * Unified function to normalize job/tender data from various sources
 */
function normalizeJobData(
  data: JobWithCompany | TenderWithCompany | StoredJob | null,
  source: 'job' | 'tender' | 'stored'
): JobDisplayData | null {
  if (!data) return null;

  // Handle stored job from localStorage
  if (source === 'stored') {
    const storedJob = data as StoredJob;
    const locationData = typeof storedJob.location === 'string' 
      ? { city: storedJob.location }
      : storedJob.location;
    
    // Parse budget if it's a string
    let budget: Budget;
    if (typeof storedJob.budget === 'string') {
      // Try to parse budget string
      const budgetMatch = storedJob.budget.match(/(\d+(?:\s*\d+)*)\s*(?:-\s*(\d+(?:\s*\d+)*))?\s*(PLN|zł)?/i);
      if (budgetMatch) {
        const min = parseInt(budgetMatch[1].replace(/\s+/g, ''));
        const max = budgetMatch[2] ? parseInt(budgetMatch[2].replace(/\s+/g, '')) : null;
        budget = {
          min,
          max,
          type: (storedJob.budgetType || 'fixed') as Budget['type'],
          currency: 'PLN',
        };
      } else {
        budget = {
          min: null,
          max: null,
          type: 'negotiable',
          currency: 'PLN',
        };
      }
    } else {
      budget = storedJob.budget as Budget;
    }

    return {
      id: storedJob.id,
      postType: storedJob.postType || 'job',
      title: storedJob.title,
      company: storedJob.company,
      location: locationData,
      type: storedJob.type,
      description: storedJob.description,
      postedTime: storedJob.postedTime || getTimeAgo(new Date().toISOString()),
      salary: formatBudget(budget),
      budget,
      requirements: storedJob.requirements ? (typeof storedJob.requirements === 'string' 
        ? storedJob.requirements.split('\n').filter(r => r.trim())
        : []) : [],
      responsibilities: [],
      skills: storedJob.searchKeywords || [],
      applications: storedJob.applications || 0,
      visits_count: storedJob.visits_count || 0,
      bookmarks_count: storedJob.bookmarks_count || 0,
      verified: storedJob.verified || false,
      urgent: storedJob.urgent || false,
      urgency: storedJob.urgency || 'medium',
      isPremium: storedJob.premium || false,
      category: storedJob.category || 'Inne',
      subcategory: storedJob.subcategory,
      clientType: storedJob.clientType,
      deadline: storedJob.deadline,
      projectDuration: 'Do uzgodnienia',
      contactPerson: storedJob.contactName,
      contactPhone: storedJob.contactPhone,
      contactEmail: storedJob.contactEmail,
      buildingType: storedJob.organizationType,
      buildingYear: undefined,
      surface: undefined,
      additionalInfo: storedJob.additionalInfo,
      companyInfo: undefined,
      images: [],
      lat: storedJob.lat,
      lng: storedJob.lng,
      address: storedJob.address,
      certificates: storedJob.certificates || [],
      tenderInfo: storedJob.postType === 'tender' && storedJob.tenderInfo ? {
        tenderType: 'Zamówienie publiczne',
        phases: storedJob.tenderInfo.phases?.map((phase: string) => ({ name: phase, status: 'pending' as const, deadline: '' })) || [],
        currentPhase: storedJob.tenderInfo.currentPhase || 'Składanie ofert',
        wadium: storedJob.tenderInfo.wadium || '0 PLN',
        evaluationCriteria: storedJob.tenderInfo.evaluationCriteria || [],
        documentsRequired: storedJob.tenderInfo.documentsRequired || [],
        submissionDeadline: storedJob.tenderInfo.submissionDeadline || '',
        projectDuration: storedJob.tenderInfo.projectDuration || 'Do uzgodnienia',
        technicalSpecifications: {},
      } : undefined,
    };
  }

  // Handle database job
  if (source === 'job') {
    const dbJob = data as JobWithCompany;
    const locationData = typeof dbJob.location === 'string' 
      ? { city: dbJob.location }
      : dbJob.location || { city: 'Unknown' };
    
    const budget = budgetFromDatabase({
      budget_min: dbJob.budget_min ?? null,
      budget_max: dbJob.budget_max ?? null,
      budget_type: (dbJob.budget_type || 'fixed') as Budget['type'],
      currency: dbJob.currency || 'PLN',
    });

    return {
      id: dbJob.id,
      postType: 'job',
      title: dbJob.title,
      company: dbJob.company?.name || 'Unknown',
      location: locationData,
      type: dbJob.type,
      description: dbJob.description,
      postedTime: dbJob.published_at ? getTimeAgo(dbJob.published_at) : getTimeAgo(dbJob.created_at),
      salary: formatBudget(budget),
      budget,
      requirements: dbJob.requirements || [],
      responsibilities: dbJob.responsibilities || [],
      skills: dbJob.skills_required || [],
      applications: dbJob.applications_count || 0,
      visits_count: dbJob.views_count || 0,
      bookmarks_count: dbJob.bookmarks_count || 0,
      verified: dbJob.company?.is_verified || false,
      urgent: dbJob.urgency === 'high',
      urgency: dbJob.urgency as 'low' | 'medium' | 'high',
      isPremium: dbJob.type === 'premium',
      category: dbJob.category?.name || 'Inne',
      subcategory: dbJob.subcategory || undefined,
      clientType: undefined, // Company type not available in current query
      deadline: dbJob.deadline || undefined,
      projectDuration: dbJob.project_duration || undefined,
      contactPerson: dbJob.contact_person || undefined,
      contactPhone: dbJob.contact_phone || undefined,
      contactEmail: dbJob.contact_email || undefined,
      buildingType: dbJob.building_type || undefined,
      buildingYear: undefined, // Not in current JobWithCompany schema
      surface: undefined, // Not in current JobWithCompany schema
      additionalInfo: undefined, // Not in current schema
      companyInfo: dbJob.company ? {
        id: dbJob.company.id,
        logo_url: dbJob.company.logo_url,
        is_verified: dbJob.company.is_verified,
      } : undefined,
      images: dbJob.images || [],
      lat: dbJob.latitude || undefined,
      lng: dbJob.longitude || undefined,
      certificates: [], // Not in current JobWithCompany schema
      status: dbJob.status as JobDisplayData['status'],
      published_at: dbJob.published_at,
      expires_at: undefined, // Not in current JobWithCompany interface
    };
  }

  // Handle database tender
  if (source === 'tender') {
    const dbTender = data as TenderWithCompany;
    const locationData = typeof dbTender.location === 'string' 
      ? { city: dbTender.location }
      : dbTender.location || { city: 'Unknown' };
    
    const budget: Budget = {
      min: dbTender.estimated_value,
      max: dbTender.estimated_value,
      type: 'fixed',
      currency: dbTender.currency || 'PLN',
    };

    // Parse evaluation criteria
    let evaluationCriteria: TenderInfo['evaluationCriteria'] = [];
    if (dbTender.evaluation_criteria) {
      if (Array.isArray(dbTender.evaluation_criteria)) {
        evaluationCriteria = dbTender.evaluation_criteria;
      } else if (dbTender.evaluation_criteria.criteria) {
        evaluationCriteria = dbTender.evaluation_criteria.criteria;
      } else if (typeof dbTender.evaluation_criteria === 'object') {
        evaluationCriteria = Object.entries(dbTender.evaluation_criteria).map(([name, weight]) => ({
          name,
          weight: typeof weight === 'number' ? weight : 0,
        }));
      }
    }

    // Parse phases
    let phases: TenderInfo['phases'] = [];
    if (dbTender.phases && Array.isArray(dbTender.phases)) {
      phases = dbTender.phases;
    }

    return {
      id: dbTender.id,
      postType: 'tender',
      title: dbTender.title,
      company: dbTender.company?.name || 'Unknown',
      location: locationData,
      type: 'Przetarg',
      description: dbTender.description,
      postedTime: dbTender.published_at ? getTimeAgo(dbTender.published_at) : getTimeAgo(dbTender.created_at),
      salary: formatBudget(budget),
      budget,
      requirements: dbTender.requirements || [],
      responsibilities: [],
      skills: [],
      applications: dbTender.bids_count || 0,
      visits_count: dbTender.views_count || 0,
      bookmarks_count: 0,
      verified: dbTender.company?.is_verified || false,
      urgent: false,
      urgency: 'medium',
      isPremium: false, // Tenders don't have premium status
      category: dbTender.category?.name || 'Inne',
      deadline: dbTender.submission_deadline,
      projectDuration: dbTender.project_duration || undefined,
      contactPerson: undefined,
      contactPhone: undefined,
      contactEmail: undefined,
      companyInfo: dbTender.company ? {
        id: dbTender.company.id,
        logo_url: dbTender.company.logo_url,
        is_verified: dbTender.company.is_verified,
      } : undefined,
      images: [],
      lat: dbTender.latitude || undefined,
      lng: dbTender.longitude || undefined,
      certificates: [], // Not in current TenderWithCompany schema
      status: dbTender.status as JobDisplayData['status'],
      published_at: dbTender.published_at,
      tenderInfo: {
        tenderType: 'Zamówienie publiczne',
        phases,
        currentPhase: dbTender.current_phase || 'Składanie ofert',
        wadium: dbTender.wadium ? `${dbTender.wadium} ${dbTender.currency}` : '0 PLN',
        evaluationCriteria,
        documentsRequired: dbTender.requirements || [],
        submissionDeadline: dbTender.submission_deadline,
        projectDuration: dbTender.project_duration || 'Do uzgodnienia',
        technicalSpecifications: {},
      },
    };
  }

  return null;
}

const JobPage: React.FC<JobPageProps> = ({ jobId, onBack, onJobSelect }) => {
  const { user, supabase } = useUserProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAskQuestionModal, setShowAskQuestionModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    proposedPrice: '',
    estimatedCompletion: '',
    coverLetter: '',
    additionalNotes: ''
  });

  const [jobData, setJobData] = useState<JobDisplayData | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const hasIncrementedViews = useRef<string | null>(null);

  // Fetch job data from database
  useEffect(() => {
    hasIncrementedViews.current = null;
    
    async function loadJobData() {
      setIsLoadingJob(true);
      console.log('🔍 JobPage - Loading job data for ID:', jobId);
      
      // Try to fetch from database first
      const { data: dbJob, error: jobError } = await getJobById(jobId);
      const { data: dbTender, error: tenderError } = await getTenderById(jobId);
      
      if (dbJob && !jobError) {
        console.log('✅ JobPage - Found job in database:', dbJob);
        const normalizedJob = normalizeJobData(dbJob, 'job');
        if (normalizedJob) {
          setJobData(normalizedJob);
          setIsLoadingJob(false);
          
          // Increment views count (only once per job)
          if (hasIncrementedViews.current !== jobId && supabase) {
            hasIncrementedViews.current = jobId;
            incrementJobViews(supabase, jobId).catch(err => {
              console.error('Failed to increment job views:', err);
            });
          }
          return;
        }
      }
      
      if (dbTender && !tenderError) {
        console.log('✅ JobPage - Found tender in database:', dbTender);
        const normalizedTender = normalizeJobData(dbTender, 'tender');
        if (normalizedTender) {
          setJobData(normalizedTender);
          setIsLoadingJob(false);
          
          // Increment views count (only once per tender)
          if (hasIncrementedViews.current !== jobId && supabase) {
            hasIncrementedViews.current = jobId;
            incrementTenderViews(supabase, jobId).catch(err => {
              console.error('Failed to increment tender views:', err);
            });
          }
          return;
        }
      }
      
      // Fallback to localStorage
      const storedJobs = getStoredJobs();
      const storedJob = storedJobs.find(job => job.id === jobId);
      
      if (storedJob) {
        console.log('🔍 JobPage - Found job in localStorage:', storedJob);
        const normalizedStoredJob = normalizeJobData(storedJob, 'stored');
        if (normalizedStoredJob) {
          setJobData(normalizedStoredJob);
          setIsLoadingJob(false);
          return;
        }
      }
      
      console.log('❌ JobPage - Job not found:', jobId);
      setJobData(null);
      setIsLoadingJob(false);
    }
    
    loadJobData();
  }, [jobId, supabase]);

  // Check if job is bookmarked
  useEffect(() => {
    if (jobData) {
      setIsBookmarked(isJobBookmarked(jobData.id));
    }
  }, [jobData]);

  // Early returns AFTER all hooks
  if (isLoadingJob) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl mb-4">Ładowanie ogłoszenia...</h1>
            <p className="text-muted-foreground mb-6">Proszę czekać</p>
          </div>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl mb-4">Ogłoszenie nie zostało znalezione</h1>
            <p className="text-muted-foreground mb-6">
              Ogłoszenie o ID "{jobId}" nie istnieje lub zostało usunięte.
            </p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do listy
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const job = jobData;

  const handleApplicationSubmit = () => {
    if (!user) {
      toast.error('Musisz się zalogować aby złożyć ofertę');
      return;
    }
    
    if (user?.userType !== 'contractor') {
      toast.error('Tylko wykonawcy mogą składać oferty');
      return;
    }

    setShowApplicationForm(true);
  };

  const handleApplicationFormSubmit = (applicationData: any) => {
    console.log('Application submitted:', applicationData);
    toast.success(job.postType === 'tender' ? 'Oferta w przetargu została złożona!' : 'Oferta została złożona!');
    setShowApplicationForm(false);
  };

  const handleBookmark = () => {
    if (!job) return;
    
    if (isBookmarked) {
      removeBookmark(job.id);
      setIsBookmarked(false);
      toast.success('Usunięto z zapisanych');
    } else {
      const bookmarkData = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: typeof job.location === 'string' ? job.location : job.location?.city || 'Unknown',
        postType: job.postType,
        budget: formatBudget(job.budget),
        deadline: job.deadline
      };
      addBookmark(bookmarkData);
      setIsBookmarked(true);
      toast.success('Dodano do zapisanych');
    }
  };

  const handleAskQuestion = () => {
    setShowAskQuestionModal(true);
  };

  const handleJobSelect = (selectedJobId: string) => {
    onJobSelect?.(selectedJobId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Powrót do listy
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-16 h-16 bg-gray-100 border-2 border-border">
                      <AvatarImage src={job.companyInfo?.logo_url || undefined} alt={job.company} />
                      <AvatarFallback className="text-lg font-semibold">
                        {job.company?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                          {job.title}
                        </h1>
                        {job.status && (
                          <Badge variant={getStatusBadgeVariant(job.status)} className="shrink-0">
                            {getStatusLabel(job.status)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm mb-3">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-4 h-4 shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{formatLocation(job.location)}</span>
                          {job.address && (
                            <span className="text-xs text-muted-foreground/70">({job.address})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{job.postedTime}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {job.verified && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Zweryfikowany
                          </Badge>
                        )}
                        {job.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pilne
                          </Badge>
                        )}
                        {job.isPremium && (
                          <Badge variant="default" className="text-xs bg-yellow-500">
                            <Star className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {typeof job.category === 'string' ? job.category : job.category?.name || 'Inne'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Key Tender Information - only for tenders */}
            {job.postType === 'tender' && job.tenderInfo && (
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Gavel className="w-5 h-5" />
                    Kluczowe informacje przetargu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Termin składania</div>
                      <div className="font-bold text-foreground text-sm">
                        {new Date(job.tenderInfo.submissionDeadline).toLocaleDateString('pl-PL')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Wadium</div>
                      <div className="font-bold text-warning text-sm">{job.tenderInfo.wadium}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Budżet</div>
                      <div className="font-bold text-success text-sm">{formatBudget(job.budget)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Czas realizacji</div>
                      <div className="font-bold text-foreground text-sm">{job.tenderInfo.projectDuration}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Złożone oferty</div>
                      <div className="font-bold text-primary text-sm">{job.applications}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-medium mb-1">Status</div>
                      <Badge variant="default" className="bg-primary text-xs">
                        {job.tenderInfo.currentPhase}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Images */}
            {job.images && job.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Zdjęcia zlecenia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {job.images.map((imageUrl, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                        <ImageZoom>
                          <img
                            src={imageUrl}
                            alt={`Zdjęcie ${index + 1} zlecenia ${job.title}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-zoom-in"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/api/placeholder/800/600';
                            }}
                          />
                        </ImageZoom>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Details Tabs */}
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                {job.postType === 'tender' ? (
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="overview">Przegląd</TabsTrigger>
                    <TabsTrigger value="requirements">Wymagania</TabsTrigger>
                    <TabsTrigger value="procedure">Procedura</TabsTrigger>
                    <TabsTrigger value="documents">Dokumenty</TabsTrigger>
                    <TabsTrigger value="object">Obiekt</TabsTrigger>
                  </TabsList>
                ) : (
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="overview">Przegląd</TabsTrigger>
                    <TabsTrigger value="requirements">Wymagania</TabsTrigger>
                    <TabsTrigger value="object">Obiekt</TabsTrigger>
                  </TabsList>
                )}

                {/* Overview Tab */}
                <TabsContent value="overview" className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Opis {job.postType === 'tender' ? 'przetargu' : 'zlecenia'}</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
                  </div>

                  {job.responsibilities && job.responsibilities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Zakres prac</h3>
                      <ul className="space-y-2">
                        {job.responsibilities.map((responsibility, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.postType === 'tender' && job.tenderInfo && job.tenderInfo.evaluationCriteria && job.tenderInfo.evaluationCriteria.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Kryteria oceny ofert</h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <ul className="space-y-2">
                          {job.tenderInfo.evaluationCriteria.map((criterion, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-green-600 shrink-0" />
                              <span>
                                {typeof criterion === 'string' 
                                  ? criterion 
                                  : `${criterion.name} (${criterion.weight}%)`
                                }
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Contract Conditions - Only for jobs, merged into overview */}
                  {job.postType === 'job' && (
                    <div className="space-y-6 pt-6 border-t border-border">
                      <h3 className="text-lg font-semibold mb-3">Warunki umowy</h3>
                      
                      {/* Podstawowe warunki - Always visible, not collapsible */}
                      <div>
                        <h4 className="text-base font-medium mb-3">Podstawowe warunki</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Typ umowy</div>
                              <div className="font-medium">{job.contractDetails?.contractType || 'Umowa o świadczenie usług'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Czas realizacji</div>
                              <div className="font-medium">{job.projectDuration || 'Do uzgodnienia'}</div>
                            </div>
                            {job.deadline && (
                              <div>
                                <div className="text-sm text-muted-foreground">Termin</div>
                                <div className="font-medium">{new Date(job.deadline).toLocaleDateString('pl-PL')}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-sm text-muted-foreground">Budżet</div>
                              <div className="font-medium">{formatBudget(job.budget)}</div>
                              {job.budget.type === 'hourly' && (
                                <div className="text-xs text-muted-foreground mt-1">Stawka godzinowa</div>
                              )}
                              {job.budget.type === 'negotiable' && (
                                <div className="text-xs text-muted-foreground mt-1">Do negocjacji</div>
                              )}
                            </div>
                            {job.contactPerson && (
                              <div>
                                <div className="text-sm text-muted-foreground">Osoba kontaktowa</div>
                                <div className="font-medium">{job.contactPerson}</div>
                              </div>
                            )}
                            {job.contactPhone && (
                              <div>
                                <div className="text-sm text-muted-foreground">Telefon</div>
                                <div className="font-medium">{job.contactPhone}</div>
                              </div>
                            )}
                            {job.contactEmail && (
                              <div>
                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="font-medium">{job.contactEmail}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Other contract details - Collapsible accordion */}
                      {job.contractDetails && (
                        <Accordion type="multiple" className="w-full">
                          <AccordionItem value="payment-conditions">
                            <AccordionTrigger className="text-left">
                              Warunki płatności
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="space-y-2">
                                  {job.contractDetails.paymentTerms && (
                                    <div>
                                      <div className="text-sm text-muted-foreground mb-1">Warunki płatności</div>
                                      <div className="text-sm">{job.contractDetails.paymentTerms}</div>
                                    </div>
                                  )}
                                  {job.contractDetails.warrantyPeriod && (
                                    <div>
                                      <div className="text-sm text-muted-foreground mb-1">Okres gwarancji</div>
                                      <div className="text-sm">{job.contractDetails.warrantyPeriod}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="termination-conditions">
                            <AccordionTrigger className="text-left">
                              Warunki rozwiązania
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="text-sm text-muted-foreground">
                                  {job.contractDetails.terminationConditions || 'Warunki rozwiązania umowy do uzgodnienia.'}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Requirements Tab */}
                <TabsContent value="requirements" className="p-6 space-y-6">
                  {job.requirements && job.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Wymagania wobec wykonawców</h3>
                      <ul className="space-y-3">
                        {job.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.skills && job.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Wymagane umiejętności</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.certificates && job.certificates.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Wymagane certyfikaty</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.certificates.map((cert, index) => (
                          <Badge key={index} variant="secondary">
                            <Award className="w-3 h-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.postType === 'tender' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-800 mb-2">Uwaga dla przetargu</h4>
                          <p className="text-sm text-amber-700">
                            Wszystkie wymagania są obowiązkowe. Brak spełnienia któregokolwiek z wymagań 
                            skutkuje odrzuceniem oferty na etapie weryfikacji formalnej.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Procedure Tab - Only for tenders */}
                {job.postType === 'tender' && (
                  <TabsContent value="procedure" className="p-6 space-y-6">
                    <h3 className="text-lg font-semibold mb-3">Harmonogram przetargu</h3>
                    {job.tenderInfo?.phases && job.tenderInfo.phases.length > 0 ? (
                      <div className="space-y-4">
                        {job.tenderInfo.phases.map((phase, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              phase.status === 'completed' ? 'bg-green-500 text-white' :
                              phase.status === 'active' ? 'bg-blue-500 text-white' :
                              'bg-gray-300 text-gray-600'
                            }`}>
                              {phase.status === 'completed' ? '✓' : index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{phase.name}</div>
                              {phase.deadline && (
                                <div className="text-sm text-muted-foreground">{phase.deadline}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">Harmonogram przetargu nie jest dostępny.</div>
                    )}
                  </TabsContent>
                )}

                {/* Documents Tab - Only for tenders */}
                {job.postType === 'tender' && (
                  <TabsContent value="documents" className="p-6 space-y-6">
                    <h3 className="text-lg font-semibold mb-3">Dokumentacja przetargowa</h3>
                    {job.tenderInfo?.documentsRequired && job.tenderInfo.documentsRequired.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium mb-3">Wymagane dokumenty</h4>
                        <div className="space-y-2">
                          {job.tenderInfo.documentsRequired.map((doc, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-white border rounded-lg">
                              <FileText className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                              <span className="text-sm">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">Dokumentacja przetargowa nie jest dostępna.</div>
                    )}
                  </TabsContent>
                )}

                {/* Object Tab */}
                <TabsContent value="object" className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold mb-3">Informacje o obiekcie</h3>
                  
                  <div className="space-y-4">
                    {(job.buildingType || job.buildingYear || job.surface || job.address) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-3">Dane podstawowe</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {job.buildingType && (
                            <div>
                              <div className="text-sm text-muted-foreground">Typ budynku</div>
                              <div className="font-medium">{job.buildingType}</div>
                            </div>
                          )}
                          {job.buildingYear && (
                            <div>
                              <div className="text-sm text-muted-foreground">Rok budowy</div>
                              <div className="font-medium">{job.buildingYear}</div>
                            </div>
                          )}
                          {job.surface && (
                            <div>
                              <div className="text-sm text-muted-foreground">Powierzchnia</div>
                              <div className="font-medium">{job.surface}</div>
                            </div>
                          )}
                          {job.address && (
                            <div>
                              <div className="text-sm text-muted-foreground">Adres</div>
                              <div className="font-medium">{job.address}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {job.additionalInfo && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Dodatkowe informacje</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.additionalInfo}</p>
                      </div>
                    )}

                    {!job.buildingType && !job.buildingYear && !job.surface && !job.address && !job.additionalInfo && (
                      <div className="text-muted-foreground text-sm text-center py-8">
                        Informacje o obiekcie nie są dostępne.
                      </div>
                    )}
                  </div>
                </TabsContent>

              </Tabs>
            </Card>

            {/* Similar Jobs Widget */}
            <SimilarJobs 
              currentJobId={job.id}
              currentJobCategory={typeof job.category === 'string' ? job.category : job.category?.name}
              currentJobType={job.postType}
              onJobSelect={handleJobSelect}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button 
                    onClick={handleApplicationSubmit}
                    className="w-full bg-blue-800 hover:bg-blue-900 text-white"
                    size="lg"
                  >
                    {job.postType === 'tender' ? 'Złóż ofertę' : 'Złóż ofertę'}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleBookmark}
                      className="flex items-center gap-2"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      <span className="truncate">
                        {isBookmarked ? 'Zapisano' : 'Zapisz'}
                      </span>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleAskQuestion}
                      className="flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span className="truncate">Pytanie</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statystyki</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Wyświetlenia</span>
                  <span className="font-semibold">{job.visits_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Aplikacje</span>
                  <span className="font-semibold">{job.applications || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Zapisane</span>
                  <span className="font-semibold">{job.bookmarks_count || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={showAskQuestionModal}
        onClose={() => setShowAskQuestionModal(false)}
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.company}
      />

      {/* Application Modal */}
      <JobApplicationModal
        isOpen={showApplicationForm}
        onClose={() => setShowApplicationForm(false)}
        jobTitle={job.title}
        companyName={job.company}
        onApplicationSubmit={handleApplicationFormSubmit}
        applicationForm={applicationForm}
        setApplicationForm={setApplicationForm}
        postType={job.postType}
      />
    </div>
  );
};

export default JobPage;
