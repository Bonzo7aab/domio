"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Building, Star, Award, CheckCircle, AlertCircle, Gavel, AlertTriangle, Heart, Image as ImageIcon, FileText, MessageCircle } from 'lucide-react';
import { ImageZoom } from './ui/image-zoom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from './ui/utils';

import JobApplicationModal, {
  type JobApplicationFormFields,
  type JobApplicationSubmitPayload,
} from './JobApplicationModal';
import { AskQuestionModal } from './AskQuestionModal';
import SimilarJobs from './SimilarJobs';
import { useUserProfile } from '../contexts/AuthContext';
import { getStoredJobs, Job as StoredJob } from '../utils/jobStorage';
import { addBookmark, removeBookmark, isJobBookmarked } from '../utils/bookmarkStorage';
import {
  BOOKMARK_COUNT_CHANGED_EVENT,
  readBookmarkCountOverrides,
} from '../utils/bookmarkCountOverrides';
import { toast } from 'sonner';
import { getJobById, getTenderById } from '../lib/data';
import { incrementJobViews, incrementTenderViews, createJobApplication, createTenderBid, type JobWithCompany, type TenderWithCompany } from '../lib/database/jobs';
import { fetchUserPrimaryCompany } from '../lib/database/companies';
import { findConversationByJob } from '../lib/database/messaging';
import { formatBudget, budgetFromDatabase, type Budget } from '../types/budget';
import { type Job, type TenderInfo } from '../types/job';
import { ManagerJobStatusSelect } from './manager-dashboard/ManagerJobStatusSelect';
import { canManagerEditJobFields, getJobWorkflowStatusLabel } from '../lib/job-workflow-status';
import { VerificationRequiredApplyDialog } from './VerificationRequiredApplyDialog';
import { needsVerificationAttention } from '../lib/verification/needs-verification-attention';

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
  if (!status) return 'Zbieranie ofert';
  return getJobWorkflowStatusLabel(status);
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
    const locationData: { city: string; sublocality_level_1?: string } | string = typeof storedJob.location === 'string' 
      ? { city: storedJob.location }
      : (storedJob.location as { city: string; sublocality_level_1?: string } | undefined) || { city: 'Unknown' };
    
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
        ? storedJob.requirements.split('\n').filter((r: string) => r.trim())
        : (Array.isArray(storedJob.requirements) ? storedJob.requirements : [])) : [],
      responsibilities: [],
      skills: storedJob.searchKeywords || [],
      metrics: {
        applications: storedJob.applications || 0,
        visits: storedJob.visits_count || 0,
        bookmarks: storedJob.bookmarks_count || 0,
      },
      // Legacy metrics fields (for backward compatibility)
      applications: storedJob.applications || 0,
      visits_count: storedJob.visits_count || 0,
      bookmarks_count: storedJob.bookmarks_count || 0,
      verified: storedJob.verified || false,
      urgent: storedJob.urgent || false,
      urgency: storedJob.urgency || 'medium',
      trust: {
        verified: storedJob.verified || false,
        isPremium: storedJob.premium || false,
        hasInsurance: false,
        completedJobs: 0,
        certificates: storedJob.certificates || [],
      },
      // Legacy trust fields (for backward compatibility)
      isPremium: storedJob.premium || false,
      hasInsurance: false,
      completedJobs: 0,
      certificates: storedJob.certificates || [],
      category: storedJob.category || 'Inne',
      subcategory: storedJob.subcategory,
      clientType: storedJob.clientType,
      deadline: storedJob.deadline,
      projectDuration: 'Do uzgodnienia',
      contact: storedJob.contactName || storedJob.contactPhone || storedJob.contactEmail ? {
        person: storedJob.contactName || '',
        phone: storedJob.contactPhone || '',
        email: storedJob.contactEmail || '',
      } : undefined,
      // Legacy contact fields (for backward compatibility)
      contactPerson: storedJob.contactName,
      contactPhone: storedJob.contactPhone,
      contactEmail: storedJob.contactEmail,
      building: storedJob.organizationType || storedJob.additionalInfo ? {
        type: storedJob.organizationType || '',
        year: 0,
        surface: '',
        address: storedJob.address || undefined,
        additionalInfo: storedJob.additionalInfo || undefined,
      } : undefined,
      // Legacy building fields (for backward compatibility)
      buildingType: storedJob.organizationType,
      buildingYear: undefined,
      surface: undefined,
      additionalInfo: storedJob.additionalInfo,
      address: storedJob.address,
      companyInfo: undefined,
      images: [],
      lat: storedJob.lat,
      lng: storedJob.lng,
      tenderInfo: storedJob.postType === 'tender' && storedJob.tenderInfo ? {
        tenderType: 'Zamówienie publiczne',
        phases: storedJob.tenderInfo.phases?.map((phase: string | { name: string; status: string; deadline: string }) => {
          if (typeof phase === 'string') {
            return { name: phase, status: 'pending' as const, deadline: '' };
          }
          return { name: phase.name, status: phase.status as 'completed' | 'active' | 'pending', deadline: phase.deadline };
        }) || [],
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
    const locationData: { city: string; sublocality_level_1?: string } = typeof dbJob.location === 'string' 
      ? { city: dbJob.location }
      : (dbJob.location as { city: string; sublocality_level_1?: string } | undefined) || { city: 'Unknown' };
    
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
      metrics: {
        applications: dbJob.applications_count || 0,
        visits: dbJob.views_count || 0,
        bookmarks: dbJob.bookmarks_count || 0,
      },
      // Legacy metrics fields (for backward compatibility)
      applications: dbJob.applications_count || 0,
      visits_count: dbJob.views_count || 0,
      bookmarks_count: dbJob.bookmarks_count || 0,
      verified: dbJob.company?.is_verified || false,
      urgent: dbJob.urgency === 'high',
      urgency: dbJob.urgency as 'low' | 'medium' | 'high',
      trust: {
        verified: dbJob.company?.is_verified || false,
        isPremium: dbJob.type === 'premium',
        hasInsurance: false, // Would need to check certificates
        completedJobs: 0, // Would need to query
        certificates: [], // Would need to query
      },
      // Legacy trust fields (for backward compatibility)
      isPremium: dbJob.type === 'premium',
      hasInsurance: false, // Would need to check certificates
      completedJobs: 0, // Would need to query
      certificates: [], // Would need to query
      category: dbJob.category?.name || 'Inne',
      subcategory: dbJob.subcategory || undefined,
      clientType: undefined, // Company type not available in current query
      deadline: dbJob.deadline || undefined,
      projectDuration: dbJob.project_duration || undefined,
      contact: dbJob.contact_person || dbJob.contact_phone || dbJob.contact_email ? {
        person: dbJob.contact_person || '',
        phone: dbJob.contact_phone || '',
        email: dbJob.contact_email || '',
      } : undefined,
      // Legacy contact fields (for backward compatibility)
      contactPerson: dbJob.contact_person || undefined,
      contactPhone: dbJob.contact_phone || undefined,
      contactEmail: dbJob.contact_email || undefined,
      building: dbJob.building_type || dbJob.building_year || dbJob.surface_area ? {
        type: dbJob.building_type || '',
        year: dbJob.building_year || 0,
        surface: dbJob.surface_area || '',
        address: dbJob.address || undefined,
        additionalInfo: dbJob.additional_info || undefined,
      } : undefined,
      // Legacy building fields (for backward compatibility)
      buildingType: dbJob.building_type || undefined,
      buildingYear: dbJob.building_year || undefined,
      surface: dbJob.surface_area || undefined,
      additionalInfo: dbJob.additional_info || undefined,
      address: dbJob.address || undefined,
      companyInfo: dbJob.company ? {
        id: dbJob.company.id,
        logo_url: dbJob.company.logo_url,
        is_verified: dbJob.company.is_verified,
      } : undefined,
      images: dbJob.images || [],
      lat: dbJob.latitude || undefined,
      lng: dbJob.longitude || undefined,
      status: dbJob.status as JobDisplayData['status'],
      published_at: dbJob.published_at,
      expires_at: undefined, // Not in current JobWithCompany interface
    };
  }

  // Handle database tender
  if (source === 'tender') {
    const dbTender = data as TenderWithCompany;
    const locationData: { city: string; sublocality_level_1?: string } = typeof dbTender.location === 'string' 
      ? { city: dbTender.location }
      : (dbTender.location as { city: string; sublocality_level_1?: string } | undefined) || { city: 'Unknown' };
    
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
        evaluationCriteria = dbTender.evaluation_criteria as TenderInfo['evaluationCriteria'];
      } else if (typeof dbTender.evaluation_criteria === 'object' && dbTender.evaluation_criteria !== null && 'criteria' in dbTender.evaluation_criteria) {
        evaluationCriteria = (dbTender.evaluation_criteria as { criteria: TenderInfo['evaluationCriteria'] }).criteria;
      } else if (typeof dbTender.evaluation_criteria === 'object') {
        evaluationCriteria = Object.entries(dbTender.evaluation_criteria as Record<string, unknown>).map(([name, weight]: [string, unknown]) => ({
          name,
          weight: typeof weight === 'number' ? weight : 0,
        }));
      }
    }

    // Parse phases
    let phases: TenderInfo['phases'] = [];
    if (dbTender.phases && Array.isArray(dbTender.phases)) {
      phases = dbTender.phases as TenderInfo['phases'];
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
      metrics: {
        applications: dbTender.bids_count || 0,
        visits: dbTender.views_count || 0,
        bookmarks: 0,
      },
      // Legacy metrics fields (for backward compatibility)
      applications: dbTender.bids_count || 0,
      visits_count: dbTender.views_count || 0,
      bookmarks_count: 0,
      verified: dbTender.company?.is_verified || false,
      urgent: false,
      urgency: 'medium',
      trust: {
        verified: dbTender.company?.is_verified || false,
        isPremium: false, // Tenders don't have premium status
        hasInsurance: false,
        completedJobs: 0,
        certificates: [],
      },
      // Legacy trust fields (for backward compatibility)
      isPremium: false, // Tenders don't have premium status
      hasInsurance: false,
      completedJobs: 0,
      certificates: [],
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAskQuestionModal, setShowAskQuestionModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showCompanyRequiredDialog, setShowCompanyRequiredDialog] = useState(false);
  const [verificationApplyDialogOpen, setVerificationApplyDialogOpen] = useState(false);
  const [applicationForm, setApplicationForm] = useState<JobApplicationFormFields>({
    proposedPrice: '',
    vatRate: '23',
    workingDays: '',
    startDate: '',
    guaranteeMonths: '12',
    estimatedCompletion: '',
    coverLetter: '',
    additionalNotes: '',
  });

  const [jobData, setJobData] = useState<JobDisplayData | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [hasExistingBid, setHasExistingBid] = useState(false);
  const [isCheckingBid, setIsCheckingBid] = useState(false);
  const [existingConversationId, setExistingConversationId] = useState<string | null>(null);
  const [isCheckingConversation, setIsCheckingConversation] = useState(false);
  const [managerId, setManagerId] = useState<string | null>(null);
  const hasIncrementedViews = useRef<string | null>(null);
  const isManager = user?.userType === 'manager';
  const isContractorViewer = user?.userType === 'contractor';
  const isJobOwner =
    isManager && Boolean(user?.id && managerId && user.id === managerId && jobData?.postType === 'job');
  const canManagerEditThisJob =
    isJobOwner &&
    Boolean(jobData?.status && canManagerEditJobFields(jobData.status)) &&
    (jobData?.applications ?? 0) === 0;

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
          // Extract manager_id from dbJob if available
          if ('manager_id' in dbJob && dbJob.manager_id) {
            setManagerId(dbJob.manager_id as string);
          }
          setIsLoadingJob(false);
          
          // Increment views count (only once per job)
          if (hasIncrementedViews.current !== jobId && supabase) {
            hasIncrementedViews.current = jobId;
            incrementJobViews(supabase, jobId).then(result => {
              if (result.error) {
                console.error('Failed to increment job views:', result.error);
              } else if (result.data) {
                const newViewsCount = result.data.views_count;
                // Update jobData with the new views count
                setJobData(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    metrics: {
                      ...prev.metrics,
                      visits: newViewsCount,
                    },
                    visits_count: newViewsCount,
                  };
                });
                // Store view count update in sessionStorage for JobCard updates
                try {
                  const stored = sessionStorage.getItem('view-count-updates');
                  const updates: Record<string, number> = stored ? JSON.parse(stored) : {};
                  updates[jobId] = newViewsCount;
                  sessionStorage.setItem('view-count-updates', JSON.stringify(updates));
                } catch (error) {
                  console.error('Error storing view count update:', error);
                }
              }
            }).catch(err => {
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
          // Extract manager_id from dbTender if available
          if ('manager_id' in dbTender && dbTender.manager_id) {
            setManagerId(dbTender.manager_id as string);
          }
          setIsLoadingJob(false);
          
          // Increment views count (only once per tender)
          if (hasIncrementedViews.current !== jobId && supabase) {
            hasIncrementedViews.current = jobId;
            incrementTenderViews(supabase, jobId).then(result => {
              if (result.error) {
                console.error('Failed to increment tender views:', result.error);
              } else if (result.data) {
                const newViewsCount = result.data.views_count;
                // Update jobData with the new views count
                setJobData(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    metrics: {
                      ...prev.metrics,
                      visits: newViewsCount,
                    },
                    visits_count: newViewsCount,
                  };
                });
                // Store view count update in sessionStorage for JobCard updates
                try {
                  const stored = sessionStorage.getItem('view-count-updates');
                  const updates: Record<string, number> = stored ? JSON.parse(stored) : {};
                  updates[jobId] = newViewsCount;
                  sessionStorage.setItem('view-count-updates', JSON.stringify(updates));
                } catch (error) {
                  console.error('Error storing view count update:', error);
                }
              }
            }).catch(err => {
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

  // Check if job is bookmarked; sync count after changes from other views
  useEffect(() => {
    if (!jobData) return;

    const syncBookmarkState = () => {
      setIsBookmarked(isJobBookmarked(jobData.id));
      const overrides = readBookmarkCountOverrides();
      if (jobData.id in overrides) {
        setJobData((prev) =>
          prev ? { ...prev, bookmarks_count: overrides[jobData.id] } : prev,
        );
      }
    };

    syncBookmarkState();
    window.addEventListener(BOOKMARK_COUNT_CHANGED_EVENT, syncBookmarkState);
    window.addEventListener('focus', syncBookmarkState);
    return () => {
      window.removeEventListener(BOOKMARK_COUNT_CHANGED_EVENT, syncBookmarkState);
      window.removeEventListener('focus', syncBookmarkState);
    };
  }, [jobData]);

  // Check if user has already submitted a bid for this tender
  useEffect(() => {
    const checkExistingBid = async () => {
      if (!jobData || !user?.id || !supabase || jobData.postType !== 'tender') {
        setHasExistingBid(false);
        return;
      }

      setIsCheckingBid(true);
      try {
        // Fetch user's primary company
        const { fetchUserPrimaryCompany } = await import('../lib/database/companies');
        const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);
        
        if (!company) {
          setHasExistingBid(false);
          setIsCheckingBid(false);
          return;
        }

        // Check if a non-cancelled bid exists for this tender and company
        const { data: existingBids, error } = await supabase
          .from('tender_bids')
          .select('id, status')
          .eq('tender_id', jobData.id)
          .eq('company_id', company.id)
          .neq('status', 'cancelled')
          .limit(1);

        if (error) {
          console.error('Error checking for existing bid:', error);
          setHasExistingBid(false);
        } else {
          // Only set hasExistingBid to true if there's a non-cancelled bid
          const hasNonCancelledBid = existingBids && existingBids.length > 0;
          setHasExistingBid(hasNonCancelledBid);
        }
      } catch (error) {
        console.error('Error in checkExistingBid:', error);
        setHasExistingBid(false);
      } finally {
        setIsCheckingBid(false);
      }
    };

    checkExistingBid();
  }, [jobData, user?.id, supabase]);

  // Check if conversation already exists for this job
  useEffect(() => {
    const checkExistingConversation = async () => {
      // Only check if user is a contractor and manager_id is available
      if (!jobData || !user?.id || !supabase || user.userType !== 'contractor' || !managerId) {
        setExistingConversationId(null);
        return;
      }

      setIsCheckingConversation(true);
      try {
        const result = await findConversationByJob(
          supabase,
          jobData.id,
          user.id,
          managerId,
          jobData.postType === 'tender'
        );

        if (result.error) {
          console.error('Error checking for existing conversation:', result.error);
          setExistingConversationId(null);
        } else {
          setExistingConversationId(result.data);
        }
      } catch (error) {
        console.error('Error in checkExistingConversation:', error);
        setExistingConversationId(null);
      } finally {
        setIsCheckingConversation(false);
      }
    };

    checkExistingConversation();
  }, [jobData, user?.id, user?.userType, supabase, managerId]);

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
              Ogłoszenie o ID &quot;{jobId}&quot; nie istnieje lub zostało usunięte.
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

  const handleApplicationSubmit = async () => {
    if (!user) {
      toast.error('Musisz się zalogować aby złożyć ofertę');
      return;
    }

    if (user?.userType !== 'contractor') {
      toast.error('Tylko wykonawcy mogą składać oferty');
      return;
    }

    if (needsVerificationAttention(user)) {
      setVerificationApplyDialogOpen(true);
      return;
    }

    // Check if contractor has a company before showing the form
    if (!supabase || !user.id) {
      toast.error('Błąd połączenia. Spróbuj ponownie.');
      return;
    }

    // For tenders, check if bid already exists
    if (job.postType === 'tender' && hasExistingBid) {
      toast.error('Już złożyłeś ofertę na ten przetarg. Nie możesz złożyć więcej niż jednej oferty.');
      return;
    }

    const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
    
    if (companyError) {
      console.error('Error checking company:', companyError);
      toast.error('Błąd podczas sprawdzania danych firmy');
      return;
    }

    if (!company) {
      // Show dialog instead of form
      setShowCompanyRequiredDialog(true);
      return;
    }

    // Company exists, show the application form
    setShowApplicationForm(true);
  };

  const handleApplicationFormSubmit = async (applicationData: JobApplicationSubmitPayload) => {
    if (!user?.id || !supabase) {
      toast.error('Musisz być zalogowany aby złożyć ofertę');
      return;
    }

    try {
      if (job.postType === 'tender') {
        // Handle tender bid submission
        const { data, error } = await createTenderBid(
          supabase,
          jobId,
          user.id,
          {
            proposedPrice: applicationData.proposedPrice,
            estimatedCompletion: applicationData.estimatedCompletion,
            coverLetter: applicationData.coverLetter,
            additionalNotes: applicationData.additionalNotes,
          }
        );

        if (error) {
          // Extract error message from various error object structures
          const errorMessage = error instanceof Error 
            ? error.message 
            : (error as { message?: string; details?: string; hint?: string })?.message || (error as { message?: string; details?: string; hint?: string })?.details || (error as { message?: string; details?: string; hint?: string })?.hint || String(error) || 'Wystąpił błąd podczas składania oferty w przetargu';
          
          console.error('Error submitting tender bid:', {
            error,
            errorMessage,
            errorType: error?.constructor?.name,
            errorCode: error?.code,
            errorDetails: error?.details,
            errorHint: error?.hint,
          });
          
          // Check if error is about missing company
          if (errorMessage.includes('company') || errorMessage.includes('firm') || errorMessage.includes('Contractor must have')) {
            setShowApplicationForm(false);
            setShowCompanyRequiredDialog(true);
            return;
          }
          
          toast.error(errorMessage);
          return;
        }

        console.log('Tender bid submitted successfully:', data);
        toast.success('Oferta w przetargu została złożona pomyślnie!');
        // Update state to reflect that bid has been submitted
        setHasExistingBid(true);
      } else {
        // Handle regular job application submission
        const { data, error } = await createJobApplication(
          supabase,
          jobId,
          user.id,
          {
            proposedPrice: applicationData.proposedPrice,
            coverLetter: applicationData.coverLetter,
            additionalNotes: applicationData.additionalNotes,
            vatRate: applicationData.vatRate,
            workingDays: applicationData.workingDays,
            startDate: applicationData.startDate,
            guaranteeMonths: applicationData.guaranteeMonths,
            attachments: applicationData.attachments,
          }
        );

        if (error) {
          // Extract error message from various error object structures
          const errorMessage = error instanceof Error 
            ? error.message 
            : (error as { message?: string; details?: string; hint?: string })?.message || (error as { message?: string; details?: string; hint?: string })?.details || (error as { message?: string; details?: string; hint?: string })?.hint || String(error) || 'Wystąpił błąd podczas składania oferty';
          
          console.error('Error submitting application:', {
            error,
            errorMessage,
            errorType: error?.constructor?.name,
            errorCode: error?.code,
            errorDetails: error?.details,
            errorHint: error?.hint,
          });
          
          // Check if error is about missing company
          if (errorMessage.includes('company') || errorMessage.includes('firm') || errorMessage.includes('Contractor must have')) {
            setShowApplicationForm(false);
            setShowCompanyRequiredDialog(true);
            return;
          }
          
          toast.error(errorMessage);
          return;
        }

        console.log('Application submitted successfully:', data);
        toast.success(
          'Wiążąca oferta została złożona. Nie możesz jej już edytować — zamawiający wkrótce ją zobaczy.'
        );
      }

      // Close modal and reset form after successful submission
      setShowApplicationForm(false);
      
      // Reset form
      setApplicationForm({
        proposedPrice: '',
        vatRate: '23',
        workingDays: '',
        startDate: '',
        guaranteeMonths: '12',
        estimatedCompletion: '',
        coverLetter: '',
        additionalNotes: '',
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Wystąpił błąd podczas składania oferty');
    }
  };

  const handleBookmark = () => {
    if (!job) return;

    const currentCount = job.bookmarks_count ?? 0;

    if (isBookmarked) {
      void removeBookmark(job.id, supabase ?? undefined, user?.id, currentCount);
      setIsBookmarked(false);
      setJobData((prev) =>
        prev
          ? { ...prev, bookmarks_count: Math.max(0, currentCount - 1) }
          : prev,
      );
      toast.success('Usunięto z ulubionych');
    } else {
      const bookmarkData = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: typeof job.location === 'string' ? job.location : job.location?.city || 'Unknown',
        postType: job.postType,
        budget: formatBudget(job.budget),
        deadline: job.deadline,
      };
      void addBookmark(
        bookmarkData,
        supabase ?? undefined,
        user?.id,
        currentCount,
      );
      setIsBookmarked(true);
      setJobData((prev) =>
        prev ? { ...prev, bookmarks_count: currentCount + 1 } : prev,
      );
      toast.success('Dodano do ulubionych');
    }
  };

  const handleAskQuestion = () => {
    setShowAskQuestionModal(true);
  };

  const handleJobSelect = (selectedJobId: string) => {
    onJobSelect?.(selectedJobId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <div className="relative flex-shrink-0 flex flex-col items-center gap-1.5 sm:gap-2">
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
                  <AvatarImage src={job.companyInfo?.logo_url || undefined} alt={job.company} />
                  <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">
                    {job.company?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                {job.verified && (
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0.5">
                    <CheckCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
                    Zweryfikowany
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold break-words">
                    {job.title}
                  </h1>
                  {job.status && (
                    <Badge variant={getStatusBadgeVariant(job.status)} className="shrink-0 text-[10px] sm:text-xs md:text-sm">
                      {getStatusLabel(job.status)}
                    </Badge>
                  )}
                  {job.urgent && (
                    <Badge variant="destructive" className="shrink-0 text-[10px] sm:text-xs md:text-sm">
                      <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      Pilne
                    </Badge>
                  )}
                  {job.isPremium && (
                    <Badge variant="default" className="shrink-0 text-[10px] sm:text-xs md:text-sm bg-yellow-500">
                      <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-1.5 sm:mb-2 md:mb-1 text-xs sm:text-sm md:text-base break-words">
                  {job.company}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{formatLocation(job.location)}</span>
                    {job.address && (
                      <span className="text-xs text-gray-400">({job.address})</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{job.postedTime}</span>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] sm:text-xs md:text-sm">
                      {typeof job.category === 'string' ? job.category : job.category?.name || 'Inne'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                activeTab === 'overview'
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Przegląd
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={cn(
                "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                activeTab === 'requirements'
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Wymagania
            </button>
            {job.postType === 'tender' && (
              <>
                <button
                  onClick={() => setActiveTab('procedure')}
                  className={cn(
                    "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                    activeTab === 'procedure'
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  )}
                >
                  Procedura
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={cn(
                    "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                    activeTab === 'documents'
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  )}
                >
                  Dokumenty
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('object')}
              className={cn(
                "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                activeTab === 'object'
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Obiekt
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 min-w-0 space-y-6">

            {/* Key Tender Information - only for tenders */}
            {job.postType === 'tender' && job.tenderInfo && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    Kluczowe informacje przetargu
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-background/80 rounded-lg p-3 border-2 shadow-sm border-border/50">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Termin składania</div>
                      <div className="font-bold text-foreground text-sm">
                        {new Date(job.tenderInfo.submissionDeadline).toLocaleDateString('pl-PL')}
                      </div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border-2 shadow-sm border-border/50">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Wadium</div>
                      <div className="font-bold text-foreground text-sm">{job.tenderInfo.wadium}</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border-2 shadow-sm border-border/50">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Budżet</div>
                      <div className="font-bold text-foreground text-sm">{formatBudget(job.budget)}</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border-2 shadow-sm border-border/50">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Czas realizacji</div>
                      <div className="font-bold text-foreground text-sm">{job.tenderInfo.projectDuration}</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border-2 shadow-sm border-border/50">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Złożone oferty</div>
                      <div className="font-bold text-foreground text-sm">{job.applications}</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 border-2 shadow-sm border-border/50">
                      <div className="text-xs text-muted-foreground font-medium mb-1">Status</div>
                      <Badge variant="secondary" className="text-xs">
                        {job.tenderInfo.currentPhase}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Details Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card>
                  <CardContent className="min-w-0 space-y-6 p-6">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold mb-3">Opis {job.postType === 'tender' ? 'przetargu' : 'zgłoszenia'}</h3>
                      <p className="max-w-full break-words text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {job.description}
                      </p>
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
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <ul className="space-y-2">
                          {job.tenderInfo.evaluationCriteria.map((criterion, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-foreground shrink-0" />
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
                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Typ umowy</div>
                              <div className="font-medium">Umowa o świadczenie usług</div>
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
                            {isContractorViewer ? (
                              <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground">
                                  Kontakt z zamawiającym wyłącznie przez platformę — numer telefonu i e-mail nie są udostępniane przy zgłoszeniu.
                                </p>
                              </div>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements">
                <Card>
                  <CardContent className="p-6 space-y-6">
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
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium mb-2">Uwaga dla przetargu</h4>
                          <p className="text-sm text-muted-foreground">
                            Wszystkie wymagania są obowiązkowe. Brak spełnienia któregokolwiek z wymagań 
                            skutkuje odrzuceniem oferty na etapie weryfikacji formalnej.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(!job.requirements || job.requirements.length === 0) && 
                   (!job.skills || job.skills.length === 0) && 
                   (!job.certificates || job.certificates.length === 0) && (
                    <div className="text-muted-foreground text-sm text-center py-8">
                      Informacje o wymaganiach nie są dostępne.
                    </div>
                  )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Procedure Tab - Only for tenders */}
              {job.postType === 'tender' && (
                <TabsContent value="procedure">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <h3 className="text-lg font-semibold mb-3">Harmonogram przetargu</h3>
                    {job.tenderInfo?.phases && job.tenderInfo.phases.length > 0 ? (
                      <div className="space-y-4">
                        {job.tenderInfo.phases.map((phase, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-lg">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                              phase.status === 'completed' ? 'bg-green-600 text-white' :
                              phase.status === 'active' ? 'bg-primary text-primary-foreground' :
                              'bg-muted text-muted-foreground'
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
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Documents Tab - Only for tenders */}
              {job.postType === 'tender' && (
                <TabsContent value="documents">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      <h3 className="text-lg font-semibold mb-3">Dokumentacja przetargowa</h3>
                    {job.tenderInfo?.documentsRequired && job.tenderInfo.documentsRequired.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium mb-3">Wymagane dokumenty</h4>
                        <div className="space-y-2">
                          {job.tenderInfo.documentsRequired.map((doc, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 border border-border rounded-lg">
                              <FileText className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                              <span className="text-sm">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">Dokumentacja przetargowa nie jest dostępna.</div>
                    )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Object Tab */}
              <TabsContent value="object">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <h3 className="text-lg font-semibold mb-3">Informacje o obiekcie</h3>
                    
                    <div className="space-y-4">
                    {(job.buildingType || job.buildingYear || job.surface || job.address) && (
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Dane podstawowe</h4>
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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

            {/* Manager: workflow status + edit */}
            {isJobOwner && job && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Zarządzanie zgłoszeniem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Status workflow</p>
                    <ManagerJobStatusSelect
                      jobId={job.id}
                      status={job.status || 'collecting_offers'}
                      className="w-full"
                      onUpdated={(next) => {
                        setJobData((prev) => (prev ? { ...prev, status: next as JobDisplayData['status'] } : prev));
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    {canManagerEditThisJob && (
                      <Button asChild className="w-full">
                        <Link href={`/manager-dashboard/zgloszenia/edytuj/${job.id}`}>
                          Edytuj zgłoszenie
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/manager-dashboard/zgloszenia">Moje zgłoszenia</Link>
                    </Button>
                    {(job.applications ?? 0) > 0 && (
                      <Button asChild variant="secondary" className="w-full">
                        <Link href={`/manager-dashboard/zgloszenia/porownaj/${job.id}?typ=zgłoszenie`}>
                          Porównaj oferty
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons — contractor actions only */}
            {!isManager && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button 
                    onClick={handleApplicationSubmit}
                    className="w-full bg-blue-800 hover:bg-blue-900 text-white"
                    size="lg"
                    disabled={job.postType === 'tender' && (hasExistingBid || isCheckingBid)}
                  >
                    {isCheckingBid 
                      ? 'Sprawdzanie...' 
                      : hasExistingBid && job.postType === 'tender'
                      ? 'Oferta już złożona'
                      : job.postType === 'tender' 
                      ? 'Złóż ofertę' 
                      : 'Złóż ofertę'
                    }
                  </Button>
                  {hasExistingBid && job.postType === 'tender' && (
                    <p className="text-xs text-muted-foreground text-center">
                      Już złożyłeś ofertę na ten przetarg
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleBookmark}
                      className="flex items-center gap-2"
                    >
                      <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current text-primary' : ''}`} />
                      <span className="truncate">
                        {isBookmarked ? 'W ulubionych' : 'Dodaj do ulubionych'}
                      </span>
                    </Button>
                    
                    {existingConversationId ? (
                      <Button 
                        variant="outline"
                        onClick={() => router.push(`/messages?conversation=${existingConversationId}`)}
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="truncate">Wiadomość</span>
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={handleAskQuestion}
                        className="flex items-center gap-2"
                        disabled={isCheckingConversation}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="truncate">
                          {isCheckingConversation ? 'Sprawdzanie...' : 'Wiadomość'}
                        </span>
                      </Button>
                    )}
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
                    Zdjęcia zgłoszenia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {job.images.map((imageUrl, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                        <ImageZoom>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={`Zdjęcie ${index + 1} zgłoszenia ${job.title}`}
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
                  <span className="text-sm text-muted-foreground">Ulubione</span>
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
        jobId={job.id}
        onApplicationSubmit={handleApplicationFormSubmit}
        applicationForm={applicationForm}
        setApplicationForm={(form) => setApplicationForm(form)}
        postType={job.postType}
      />

      <VerificationRequiredApplyDialog
        open={verificationApplyDialogOpen}
        onOpenChange={setVerificationApplyDialogOpen}
      />

      {/* Company Required Dialog */}
      <Dialog open={showCompanyRequiredDialog} onOpenChange={setShowCompanyRequiredDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Wymagana firma
            </DialogTitle>
            <DialogDescription>
              Aby złożyć ofertę, musisz najpierw dodać informacje o swojej firmie.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Przed złożeniem oferty na to ogłoszenie, musisz uzupełnić dane swojej firmy w profilu konta.
            </p>
            <p className="text-sm text-muted-foreground">
              Po dodaniu firmy będziesz mógł składać oferty na ogłoszenia i przetargi.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompanyRequiredDialog(false)}
            >
              Anuluj
            </Button>
            <Button
              onClick={() => {
                setShowCompanyRequiredDialog(false);
                router.push('/account?tab=company');
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Przejdź do uzupełnienia danych firmy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobPage;
