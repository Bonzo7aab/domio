"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, Building, Star, Award, CheckCircle, AlertCircle, Gavel, AlertTriangle, Bookmark, HelpCircle } from 'lucide-react';
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
import { getStoredJobs, Job } from '../utils/jobStorage';
import { addBookmark, removeBookmark, isJobBookmarked } from '../utils/bookmarkStorage';
import { toast } from 'sonner';
import { createClient } from '../lib/supabase/client';
import { getJobById, getTenderById } from '../lib/data';

interface JobPageProps {
  jobId: string;
  onBack?: () => void;
  onJobSelect?: (jobId: string) => void;
}

// Helper function to convert stored job to detailed format
const convertStoredJobToDetailedFormat = (storedJob: Job): any => {
  return {
    id: storedJob.id,
    postType: storedJob.postType || 'job',
    title: storedJob.title,
    company: storedJob.company,
    location: storedJob.location,
    type: storedJob.type,
    salary: storedJob.salary,
    description: storedJob.description,
    requirements: storedJob.requirements ? storedJob.requirements.split('\n').filter(r => r.trim()) : [
      'Minimum 2 lata doświadczenia w branży',
      'Własne narzędzia i sprzęt',
      'Ubezpieczenie OC min. 500 000 PLN',
      'Pozytywne referencje z ostatnich 3 realizacji'
    ],
    responsibilities: [
      'Wykonanie zlecenia zgodnie z opisem',
      'Terminowe wykonanie prac',
      'Zapewnienie wysokiej jakości usług',
      'Utrzymanie porządku na terenie prac'
    ],
    skills: storedJob.searchKeywords || [],
    postedTime: storedJob.postedTime,
    applications: storedJob.applications,
    rating: storedJob.rating,
    verified: storedJob.verified,
    urgent: storedJob.urgent,
    category: storedJob.category,
    subcategory: storedJob.subcategory,
    clientType: storedJob.clientType,
    isPremium: storedJob.premium,
    hasInsurance: storedJob.hasInsurance,
    completedJobs: storedJob.completedJobs || 0,
    certificates: storedJob.certificates || [],
    deadline: storedJob.deadline,
    budget: storedJob.budget,
    projectDuration: 'Do uzgodnienia',
    contractDetails: {
      contractType: 'Umowa o świadczenie usług',
      paymentTerms: 'Do uzgodnienia z wykonawcą',
      warrantyPeriod: 'Zgodnie z przepisami',
      terminationConditions: 'Zgodnie z kodeksem cywilnym'
    },
    contactPerson: storedJob.contactName || 'Przedstawiciel organizacji',
    contactPhone: storedJob.contactPhone || '+48 000 000 000',
    contactEmail: storedJob.contactEmail || 'kontakt@organizacja.pl',
    buildingType: storedJob.organizationType || 'Budynek mieszkalny',
    buildingYear: 2000,
    surface: 'Do uzgodnienia',
    additionalInfo: storedJob.additionalInfo || 'Szczegóły do uzgodnienia z wykonawcą.',
    companyLogo: '/api/placeholder/64/64',
    images: ['/api/placeholder/800/400', '/api/placeholder/600/400', '/api/placeholder/400/300'],
    lat: storedJob.lat || 52.2297,
    lng: storedJob.lng || 21.0122,
    // Tender specific data - simplified
    tenderInfo: storedJob.postType === 'tender' ? {
      submissionDeadline: '15.01.2025',
      wadium: '5 000 PLN',
      projectDuration: '90 dni kalendarzowych',
      currentPhase: 'Składanie ofert',
      evaluationCriteria: [
        'Cena (60%)',
        'Termin realizacji (25%)', 
        'Doświadczenie (15%)'
      ]
    } : null
  };
};


// Convert database job to detailed format
const convertDatabaseJobToDetailedFormat = (job: any) => {
  return {
    id: job.id,
    title: job.title,
    company: job.company?.name || 'Unknown',
    location: job.location,
    type: job.type,
    salary: job.budget_max 
      ? `${job.budget_min || 0} - ${job.budget_max} ${job.currency}`
      : `${job.budget_min || 0} ${job.currency}`,
    description: job.description,
    requirements: job.requirements || [],
    responsibilities: job.responsibilities || [],
    skills: job.skills_required || [],
    postedTime: getTimeAgo(job.created_at),
    applications: job.applications_count || 0,
    rating: 4.5,
    verified: job.company?.is_verified || false,
    urgent: job.urgency === 'high',
    premium: job.type === 'premium',
    category: job.category?.name || 'Inne',
    subcategory: job.subcategory,
    clientType: mapCompanyTypeToClientType(job.company?.type),
    deadline: job.deadline,
    budget: job.budget_max 
      ? `${job.budget_min || 0} - ${job.budget_max} ${job.currency}`
      : `${job.budget_min || 0} ${job.currency}`,
    projectDuration: job.project_duration,
    contactPerson: job.contact_person,
    contactPhone: job.contact_phone,
    contactEmail: job.contact_email,
    buildingType: job.building_type,
    buildingYear: job.building_year,
    surface: job.surface_area,
    additionalInfo: job.additional_info,
    companyLogo: job.company?.logo_url,
    images: job.images || [],
    lat: job.latitude,
    lng: job.longitude,
    postType: 'job'
  };
};

// Convert database tender to detailed format
const convertDatabaseTenderToDetailedFormat = (tender: any) => {
  return {
    id: tender.id,
    title: tender.title,
    company: tender.company?.name || 'Unknown',
    location: tender.location,
    type: 'Przetarg',
    salary: `${tender.estimated_value} ${tender.currency}`,
    description: tender.description,
    postedTime: getTimeAgo(tender.created_at),
    applications: tender.bids_count || 0,
    rating: 4.5,
    verified: tender.company?.is_verified || false,
    urgent: false,
    premium: false,
    category: tender.category?.name || 'Inne',
    deadline: tender.submission_deadline,
    budget: `${tender.estimated_value} ${tender.currency}`,
    projectDuration: tender.project_duration,
    contactPerson: 'Komisja Przetargowa',
    companyLogo: tender.company?.logo_url,
    images: [],
    lat: tender.latitude,
    lng: tender.longitude,
    postType: 'tender',
    tenderInfo: {
      tenderType: 'Zamówienie publiczne',
      phases: tender.phases || [],
      currentPhase: tender.current_phase || 'Składanie ofert',
      wadium: tender.wadium ? `${tender.wadium} ${tender.currency}` : '0 PLN',
      evaluationCriteria: tender.evaluation_criteria || [],
      documentsRequired: tender.requirements || [],
      submissionDeadline: tender.submission_deadline,
      projectDuration: tender.project_duration || 'Do uzgodnienia',
    }
  };
};

// Helper functions
const getTimeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Przed chwilą';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min temu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} godz. temu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dni temu`;
  
  return past.toLocaleDateString('pl-PL');
};

const mapCompanyTypeToClientType = (companyType?: string): string => {
  switch (companyType) {
    case 'spółdzielnia':
      return 'Spółdzielnia Mieszkaniowa';
    case 'wspólnota':
      return 'Wspólnota Mieszkaniowa';
    case 'housing_association':
      return 'Wspólnota Mieszkaniowa';
    case 'cooperative':
      return 'Spółdzielnia Mieszkaniowa';
    default:
      return 'Wspólnota Mieszkaniowa';
  }
};

const JobPage: React.FC<JobPageProps> = ({ jobId, onBack, onJobSelect }) => {
  const { user } = useUserProfile();
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

  const [jobData, setJobData] = useState<any>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);

  // Fetch job data from database
  useEffect(() => {
    async function loadJobData() {
      setIsLoadingJob(true);
      console.log('🔍 JobPage - Loading job data for ID:', jobId);
      
      // Try to fetch from database first
      const { data: dbJob, error: jobError } = await getJobById(jobId);
      const { data: dbTender, error: tenderError } = await getTenderById(jobId);
      
      if (dbJob && !jobError) {
        console.log('✅ JobPage - Found job in database:', dbJob);
        // Convert database job to component format
        const formattedJob = {
          id: dbJob.id,
          postType: 'job',
          title: dbJob.title,
          company: dbJob.company?.name || 'Unknown',
          location: dbJob.location,
          type: dbJob.type,
          salary: dbJob.budget_max
            ? `${dbJob.budget_min || 0} - ${dbJob.budget_max} ${dbJob.currency}`
            : `${dbJob.budget_min || 0} ${dbJob.currency}`,
          description: dbJob.description,
          requirements: dbJob.requirements || [],
          responsibilities: dbJob.responsibilities || [],
          skills: dbJob.skills_required || [],
          postedTime: new Date(dbJob.created_at).toLocaleDateString('pl-PL'),
          applications: dbJob.applications_count,
          rating: 4.5,
          verified: dbJob.company?.is_verified || false,
          urgent: dbJob.urgency === 'high',
          category: dbJob.category?.name || 'Inne',
          subcategory: dbJob.subcategory,
          clientType: dbJob.company?.name,
          isPremium: dbJob.type === 'premium',
          hasInsurance: false,
          completedJobs: 0,
          certificates: [],
          deadline: dbJob.deadline,
          budget: dbJob.budget_max
            ? `${dbJob.budget_min || 0} - ${dbJob.budget_max} ${dbJob.currency}`
            : `${dbJob.budget_min || 0} ${dbJob.currency}`,
          projectDuration: dbJob.project_duration || 'Do uzgodnienia',
          contractDetails: {
            contractType: 'Umowa o świadczenie usług',
            paymentTerms: 'Do uzgodnienia z wykonawcą',
            warrantyPeriod: 'Zgodnie z przepisami',
            terminationConditions: 'Zgodnie z kodeksem cywilnym'
          },
          contactPerson: dbJob.contact_person || 'Przedstawiciel organizacji',
          contactPhone: dbJob.contact_phone || '+48 000 000 000',
          contactEmail: dbJob.contact_email || 'kontakt@organizacja.pl',
          buildingType: dbJob.building_type || 'Budynek mieszkalny',
          buildingYear: 2000,
          surface: 'Do uzgodnienia',
          additionalInfo: 'Szczegóły do uzgodnienia z wykonawcą.',
          companyLogo: dbJob.company?.logo_url || '/api/placeholder/64/64',
          images: dbJob.images || ['/api/placeholder/800/400'],
          lat: dbJob.latitude || 52.2297,
          lng: dbJob.longitude || 21.0122,
          tenderInfo: null
        };
        setJobData(formattedJob);
        setIsLoadingJob(false);
        return;
      }
      
      if (dbTender && !tenderError) {
        console.log('✅ JobPage - Found tender in database:', dbTender);
        // Convert database tender to component format
        const formattedTender = {
          id: dbTender.id,
          postType: 'tender',
          title: dbTender.title,
          company: dbTender.company?.name || 'Unknown',
          location: dbTender.location,
          type: 'Przetarg',
          salary: `${dbTender.estimated_value} ${dbTender.currency}`,
          description: dbTender.description,
          requirements: dbTender.requirements || [],
          responsibilities: [],
          skills: [],
          postedTime: new Date(dbTender.created_at).toLocaleDateString('pl-PL'),
          applications: dbTender.bids_count,
          rating: 4.5,
          verified: dbTender.company?.is_verified || false,
          urgent: false,
          category: dbTender.category?.name || 'Inne',
          clientType: dbTender.company?.name,
          isPremium: false,
          hasInsurance: false,
          completedJobs: 0,
          certificates: [],
          deadline: dbTender.submission_deadline,
          budget: `${dbTender.estimated_value} ${dbTender.currency}`,
          projectDuration: dbTender.project_duration || 'Do uzgodnienia',
          contractDetails: {
            contractType: 'Umowa o zamówienie publiczne',
            paymentTerms: 'Zgodnie z SIWZ',
            warrantyPeriod: 'Zgodnie z przepisami',
            terminationConditions: 'Zgodnie z umową'
          },
          contactPerson: 'Przedstawiciel zamawiającego',
          contactPhone: '+48 000 000 000',
          contactEmail: 'przetargi@organizacja.pl',
          buildingType: 'Obiekt publiczny',
          companyLogo: dbTender.company?.logo_url || '/api/placeholder/64/64',
          images: ['/api/placeholder/800/400'],
          lat: dbTender.latitude || 52.2297,
          lng: dbTender.longitude || 21.0122,
          tenderInfo: {
            submissionDeadline: new Date(dbTender.submission_deadline).toLocaleDateString('pl-PL'),
            wadium: dbTender.wadium ? `${dbTender.wadium} ${dbTender.currency}` : '0 PLN',
            projectDuration: dbTender.project_duration || '90 dni kalendarzowych',
            currentPhase: dbTender.current_phase || 'Składanie ofert',
            evaluationCriteria: dbTender.evaluation_criteria?.criteria || [
              'Cena (60%)',
              'Termin realizacji (25%)',
              'Doświadczenie (15%)'
            ]
          }
        };
        setJobData(formattedTender);
        setIsLoadingJob(false);
        return;
      }
      
      // Fallback to localStorage
      const storedJobs = getStoredJobs();
      const storedJob = storedJobs.find(job => job.id === jobId);
      
      if (storedJob) {
        console.log('🔍 JobPage - Found job in localStorage:', storedJob);
        setJobData(convertStoredJobToDetailedFormat(storedJob));
        setIsLoadingJob(false);
        return;
      }
      
      // Fetch from database as fallback
      try {
        // Try to fetch as job first
        const { data: jobData, error: jobError } = await getJobById(jobId);
        
        if (!jobError && jobData) {
          console.log('🔍 JobPage - Found job in database:', jobData);
          const convertedJob = convertDatabaseJobToDetailedFormat(jobData);
          setJobData(convertedJob);
          setIsLoadingJob(false);
          return;
        }
        
        // Try to fetch as tender if not found as job
        const { data: tenderData, error: tenderError } = await getTenderById(jobId);
        
        if (!tenderError && tenderData) {
          console.log('🔍 JobPage - Found tender in database:', tenderData);
          const convertedTender = convertDatabaseTenderToDetailedFormat(tenderData);
          setJobData(convertedTender);
          setIsLoadingJob(false);
          return;
        }
        
        console.warn('🔍 JobPage - Job not found in database:', jobId);
      } catch (error) {
        console.error('🔍 JobPage - Error fetching from database:', error);
      }
      
      console.log('❌ JobPage - Job not found:', jobId);
      setJobData(null);
      setIsLoadingJob(false);
    }
    
    loadJobData();
  }, [jobId]);

  // Check if job is bookmarked - MUST be called before any early returns
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
            <p className="text-muted-foreground mb-6">
              Proszę czekać
            </p>
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

    // Show application form instead of direct submission
    setShowApplicationForm(true);
  };

  const handleApplicationFormSubmit = (applicationData: any) => {
    // Application logic here
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
        location: job.location,
        postType: job.postType || 'job',
        budget: job.budget || job.salary,
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
    // Redirect to the selected job page
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
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 bg-gray-100">
                      <AvatarImage src={job.companyLogo} alt={job.company} />
                      <AvatarFallback>{job.company.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl mb-2">
                        {job.title}
                      </h1>
                      <div className="flex items-center gap-4 text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {job.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.postedTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Key Tender Information - only for tenders */}
            {job.postType === 'tender' && job.tenderInfo && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Gavel className="w-5 h-5" />
                    Kluczowe informacje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground font-medium">Termin składania</div>
                      <div className="font-bold text-foreground">{job.tenderInfo.submissionDeadline}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground font-medium">Wadium</div>
                      <div className="font-bold text-warning">{job.tenderInfo.wadium}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground font-medium">Budżet</div>
                      <div className="font-bold text-success">{job.budget}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground font-medium">Czas realizacji</div>
                      <div className="font-bold text-foreground">{job.tenderInfo.projectDuration}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground font-medium">Złożone oferty</div>
                      <div className="font-bold text-primary">{job.applications}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground font-medium">Status</div>
                      <Badge variant="default" className="bg-primary text-xs">
                        {job.tenderInfo.currentPhase}
                      </Badge>
                    </div>
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
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="overview">Przegląd</TabsTrigger>
                    <TabsTrigger value="requirements">Wymagania</TabsTrigger>
                    <TabsTrigger value="object">Obiekt</TabsTrigger>
                    <TabsTrigger value="contract">Warunki umowy</TabsTrigger>
                  </TabsList>
                )}

                {/* Overview Tab */}
                <TabsContent value="overview" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg mb-3">Opis {job.postType === 'tender' ? 'przetargu' : 'zlecenia'}</h3>
                      <p className="text-muted-foreground leading-relaxed">{job.description}</p>
                    </div>

                    {job.responsibilities && (
                      <div>
                        <h3 className="text-lg mb-3">Zakres prac</h3>
                        <ul className="space-y-2">
                          {job.responsibilities.map((responsibility: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{responsibility}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {job.postType === 'tender' && job.tenderInfo && (
                      <div>
                        <h3 className="text-lg mb-3">Kryteria oceny ofert</h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <ul className="space-y-1">
                            {job.tenderInfo.evaluationCriteria.map((criterion: any, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-green-600" />
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
                  </div>
                </TabsContent>

                {/* Requirements Tab */}
                <TabsContent value="requirements" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg mb-3">Wymagania wobec wykonawców</h3>
                      <ul className="space-y-3">
                        {job.requirements.map((requirement: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div>
                        <h3 className="text-lg mb-3">Wymagane umiejętności</h3>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.certificates && job.certificates.length > 0 && (
                      <div>
                        <h3 className="text-lg mb-3">Wymagane certyfikaty</h3>
                        <div className="flex flex-wrap gap-2">
                          {job.certificates.map((cert: string, index: number) => (
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
                  </div>
                </TabsContent>

                {/* Other tabs - simplified implementations */}
                <TabsContent value="procedure" className="p-6">
                  <div className="space-y-6">
                    <h3 className="text-lg mb-3">Harmonogram przetargu</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-3">Fazy postępowania przetargowego</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>
                            <div>
                              <div className="font-medium">Ogłoszenie przetargu</div>
                              <div className="text-sm text-muted-foreground">15.12.2024 - Publikacja w Biuletynie Zamówień Publicznych</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>
                            <div>
                              <div className="font-medium">Wizja lokalna (opcjonalna)</div>
                              <div className="text-sm text-muted-foreground">18.12.2024 - 22.12.2024, godz. 9:00-15:00 (po uprzednim umówieniu)</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</div>
                            <div>
                              <div className="font-medium">Składanie ofert</div>
                              <div className="text-sm text-muted-foreground">Do 15.01.2025, godz. 10:00 - Sekretariat Spółdzielni</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">3</div>
                            <div>
                              <div className="font-medium">Otwarcie ofert</div>
                              <div className="text-sm text-muted-foreground">15.01.2025, godz. 11:00 - Sala konferencyjna Spółdzielni</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">4</div>
                            <div>
                              <div className="font-medium">Badanie i ocena ofert</div>
                              <div className="text-sm text-muted-foreground">16.01.2025 - 22.01.2025</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">5</div>
                            <div>
                              <div className="font-medium">Wybór najkorzystniejszej oferty</div>
                              <div className="text-sm text-muted-foreground">23.01.2025</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs">6</div>
                            <div>
                              <div className="font-medium">Podpisanie umowy</div>
                              <div className="text-sm text-muted-foreground">Do 30.01.2025</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-medium text-amber-800 mb-3">Ważne terminy</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span><strong>Pytania:</strong> Do 08.01.2025, godz. 12:00</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span><strong>Odpowiedzi:</strong> Do 10.01.2025, godz. 16:00</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span><strong>Wadium:</strong> Do 14.01.2025, godz. 16:00</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Kryteria wyboru wykonawcy</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span>Cena (C)</span>
                            <span className="font-bold text-green-700">60%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span>Doświadczenie wykonawcy (D)</span>
                            <span className="font-bold text-blue-700">25%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                            <span>Termin realizacji (T)</span>
                            <span className="font-bold text-purple-700">15%</span>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          <strong>Formuła:</strong> Ocena końcowa = C × 0,60 + D × 0,25 + T × 0,15
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="p-6">
                  <div className="space-y-6">
                    <h3 className="text-lg mb-3">Dokumentacja przetargowa</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-3">Dokumenty do pobrania</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-red-600">PDF</span>
                              </div>
                              <div>
                                <div className="font-medium">Specyfikacja Istotnych Warunków Zamówienia (SIWZ)</div>
                                <div className="text-sm text-muted-foreground">Wersja 1.2 • 2.8 MB • Aktualizacja: 15.12.2024</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Pobierz</Button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">DOC</span>
                              </div>
                              <div>
                                <div className="font-medium">Formularz ofertowy</div>
                                <div className="text-sm text-muted-foreground">Wzór oferty • 156 KB</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Pobierz</Button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">DOC</span>
                              </div>
                              <div>
                                <div className="font-medium">Wzór umowy</div>
                                <div className="text-sm text-muted-foreground">Projekt umowy • 89 KB</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Pobierz</Button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-green-600">XLS</span>
                              </div>
                              <div>
                                <div className="font-medium">Kosztorys orientacyjny</div>
                                <div className="text-sm text-muted-foreground">Zestawienie kosztów • 245 KB</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Pobierz</Button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-red-600">PDF</span>
                              </div>
                              <div>
                                <div className="font-medium">Dokumentacja techniczna</div>
                                <div className="text-sm text-muted-foreground">Rysunki techniczne • 15.2 MB</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">Pobierz</Button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-3">Dokumenty składane przez wykonawcę</h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm">Wypełniony formularz ofertowy (podpisany i opieczętowany)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm">Oświadczenie o spełnianiu warunków udziału w postępowaniu</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm">Oświadczenie o braku podstaw wykluczenia</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm">Referencje z co najmniej 3 podobnych realizacji</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm">Kopia polisy ubezpieczeniowej OC (min. 500 000 PLN)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm">Aktualny odpis z KRS lub CEIDG (nie starszy niż 6 miesięcy)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                            <span className="text-sm">Zaświadczenie o niezaleganiu z podatkami i ZUS</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800 mb-2">Ważne informacje</h4>
                            <ul className="text-sm text-amber-700 space-y-1">
                              <li>• Oferty składane w zamkniętych kopertach z opisem zewnętrznym</li>
                              <li>• Możliwość zadawania pytań do 08.01.2025 r.</li>
                              <li>• Wszystkie dokumenty w języku polskim</li>
                              <li>• Oferty wariantowe nie są dopuszczone</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="object" className="p-6">
                  <div className="space-y-6">
                    <h3 className="text-lg mb-3">Informacje o obiekcie</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-3">Dane podstawowe</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Typ budynku</div>
                            <div className="font-medium">Wielorodzinny mieszkalny</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Rok budowy</div>
                            <div className="font-medium">1978 (modernizacja 2010)</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Liczba klatek</div>
                            <div className="font-medium">5 klatek schodowych</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Liczba mieszkań</div>
                            <div className="font-medium">120 mieszkań</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Powierzchnia użytkowa</div>
                            <div className="font-medium">8 500 m²</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Wysokość budynku</div>
                            <div className="font-medium">11 kondygnacji</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Powierzchnia elewacji</div>
                            <div className="font-medium">4 200 m²</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">System grzewczy</div>
                            <div className="font-medium">Miejska sieć ciepłownicza</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-3">Lokalizacja i dostępność</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-muted-foreground">Adres</div>
                            <div className="font-medium">ul. Parkowa 15-25, 00-001 Warszawa</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Dojazd</div>
                            <div className="font-medium">Bezpośredni dojazd z ul. Parkowej, parking dla wykonawców</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Dostęp do mediów</div>
                            <div className="font-medium">Prąd 380V, woda, kanalizacja na terenie osiedla</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Ograniczenia</div>
                            <div className="font-medium">Prace hałaśliwe: pon-pt 8:00-18:00, soboty 9:00-15:00</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-medium text-purple-900 mb-3">Stan techniczny</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm"><strong>Konstrukcja:</strong> Żelbet, stan dobry</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm"><strong>Elewacja:</strong> Wymagana termomodernizacja</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm"><strong>Dach:</strong> Papa termozgrzewalna, wymieniona 2019</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm"><strong>Okna:</strong> Częściowo wymienione (klatki do wymiany)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm"><strong>Instalacje:</strong> C.O. i wod-kan zmodernizowane</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Materiały i specyfikacje</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-muted-foreground">Ściany zewnętrzne</div>
                            <div className="text-sm">Żelbet gr. 25cm + planowane ocieplenie styropianem 15cm</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Tynk zewnętrzny</div>
                            <div className="text-sm">Tynk akrylowy, struktura baranek 2mm</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Kolorystyka</div>
                            <div className="text-sm">Jasnobeżowy RAL 1013 (główny), akcenty RAL 7040</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Okna do wymiany</div>
                            <div className="text-sm">PCV białe, 5-komorowe, szyba 4/16/4/16/4</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-900 mb-3">Wizja lokalna</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="text-sm">Możliwa po umówieniu: 18-22.12.2024, godz. 9:00-15:00</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-orange-600" />
                            <span className="text-sm">Kontakt: Zarządca nieruchomości - tel. +48 22 123 45 67</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm">Wymagane: dokument tożsamości, odzież robocza, obuwie BHP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contract" className="p-6">
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="basic-conditions">
                      <AccordionTrigger className="text-left">
                        Podstawowe warunki
                      </AccordionTrigger>
                      <AccordionContent>
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
                            <div>
                              <div className="text-sm text-muted-foreground">Termin płatności</div>
                              <div className="font-medium">30 dni od daty faktury</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Forma płatności</div>
                              <div className="font-medium">Przelew bankowy</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Okres gwarancji</div>
                              <div className="font-medium">24 miesiące na wykonane prace</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Ubezpieczenie OC</div>
                              <div className="font-medium">Minimum 500 000 PLN</div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="financial-conditions">
                      <AccordionTrigger className="text-left">
                        Warunki finansowe
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-sm">Rozliczenie miesięczne na podstawie faktury VAT</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-sm">Możliwość płatności zaliczki do 30% wartości umowy</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-sm">Kary umowne za opóźnienie: 0,5% wartości umowy za każdy dzień</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-sm">Zabezpieczenie należytego wykonania: 5% wartości umowy</span>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="contractor-obligations">
                      <AccordionTrigger className="text-left">
                        Obowiązki wykonawcy
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                              <span className="text-sm">Wykonanie prac zgodnie z obowiązującymi normami i przepisami</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                              <span className="text-sm">Zapewnienie materiałów o odpowiedniej jakości i certyfikatach</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                              <span className="text-sm">Utrzymanie porządku i bezpieczeństwa na terenie prac</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                              <span className="text-sm">Usunięcie wad i usterek na własny koszt w okresie gwarancji</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5" />
                              <span className="text-sm">Przekazanie dokumentacji powykonawczej i certyfikatów</span>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="client-obligations">
                      <AccordionTrigger className="text-left">
                        Obowiązki zamawiającego
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                              <span className="text-sm">Zapewnienie dostępu do terenu prac w uzgodnionych godzinach</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                              <span className="text-sm">Udostępnienie niezbędnych mediów (prąd, woda)</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                              <span className="text-sm">Terminowe płatności zgodnie z harmonogramem</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                              <span className="text-sm">Współpraca przy odbiorze poszczególnych etapów prac</span>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="additional-conditions">
                      <AccordionTrigger className="text-left">
                        Warunki dodatkowe
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-muted-foreground">Rozwiązanie umowy</div>
                              <div className="text-sm">Możliwe za 30-dniowym wypowiedzeniem lub natychmiast w przypadku rażącego naruszenia warunków umowy</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Siła wyższa</div>
                              <div className="text-sm">Strony zwolnione z odpowiedzialności w przypadku działania siły wyższej</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Prawo właściwe</div>
                              <div className="text-sm">Umowa podlega prawu polskiemu</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Rozstrzyganie sporów</div>
                              <div className="text-sm">Spory rozstrzygane przez sąd właściwy dla siedziby zamawiającego</div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="important-info">
                      <AccordionTrigger className="text-left">
                        Ważne informacje
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <ul className="text-sm text-amber-700 space-y-1">
                                <li>• Szczegółowe warunki umowy zostaną uzgodnione przed podpisaniem</li>
                                <li>• Możliwość negocjacji niektórych warunków w zależności od specyfiki zlecenia</li>
                                <li>• Wykonawca zobowiązany do przestrzegania regulaminu obiektu</li>
                                <li>• Wymagana aktualna polisa ubezpieczeniowa OC w trakcie realizacji</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Similar Jobs Widget */}
            <SimilarJobs 
              currentJobId={job.id}
              currentJobCategory={job.category}
              currentJobType={job.postType}
              onJobSelect={handleJobSelect}
            />
          </div>

          {/* Sidebar - ONLY buttons */}
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
                      {isBookmarked ? 'Zapisano' : 'Zapisz' + (job.postType === 'tender' ? ' przetarg' : ' zlecenie')}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleAskQuestion}
                      className="flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Zadaj pytanie
                    </Button>
                  </div>
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