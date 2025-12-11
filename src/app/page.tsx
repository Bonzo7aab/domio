'use client'

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import JobFilters, { FilterState } from '../components/JobFilters';
import { EnhancedJobList } from '../components/EnhancedJobList';
import JobList from '../components/JobList';
import { JobApplicationModal } from '../components/JobApplicationModal';
import { MapPlaceholder } from '../components/MapPlaceholder';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../contexts/AuthContext';
import { getJobsAndTenders, type DBJobFilters } from '../lib/data';
import { useLayoutContext } from '../components/ConditionalFooter';
import { useFilterContext } from '../contexts/FilterContext';
import { createClient } from '../lib/supabase/client';
import { createJobApplication, createTenderBid } from '../lib/database/jobs';
import { fetchUserPrimaryCompany } from '../lib/database/companies';

// Dynamically import heavy components to reduce initial bundle size
const EnhancedMapViewGoogleMaps = dynamic(
  () => import('../components/EnhancedMapViewGoogleMaps').then(mod => ({ default: mod.EnhancedMapViewGoogleMaps })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Ładowanie mapy...</p>
        </div>
      </div>
    )
  }
);

const MessagingSystem = dynamic(
  () => import('../components/MessagingSystem').then(mod => ({ default: mod.MessagingSystem })),
  { 
    ssr: false,
    loading: () => null
  }
);

const EnhancedMapView = EnhancedMapViewGoogleMaps;

export default function HomePage() {
  const { user } = useUserProfile();
  const router = useRouter();
  const { isMapExpanded, setIsMapExpanded } = useLayoutContext();
  const { filters, setFilters, primaryLocation, setPrimaryLocation, setLocationChangeHandler, onLocationChangeRequest } = useFilterContext();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
  // Keep map-related state for when map is expanded
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [selectedApplicationJobId, setSelectedApplicationJobId] = useState<string | null>(null);
  const [selectedApplicationJob, setSelectedApplicationJob] = useState<any>(null);
  const [applicationForm, setApplicationForm] = useState({
    proposedPrice: '',
    estimatedCompletion: '',
    coverLetter: '',
    additionalNotes: ''
  });
  const [showMessaging, setShowMessaging] = useState(false);
  const [loadedJobs, setLoadedJobs] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]); // Keep for map and other uses
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Load jobs from database function - fetch all jobs within bounds
  const loadJobsFromDatabase = async (bounds?: { north: number; south: number; east: number; west: number } | null) => {
    try {
      setIsLoadingJobs(true);
      
      // Fetch all jobs within bounds (with reasonable maximum to prevent overload)
      const dbFilters: DBJobFilters = {
        status: 'active',
        limit: 500, // Reasonable maximum to prevent performance issues
        offset: 0,
        ...(bounds && { bounds }),
      };
      
      const { data, error } = await getJobsAndTenders(dbFilters);
      
      if (error) {
        console.error('Error fetching jobs from database:', error);
        setLoadedJobs([]);
        setJobs([]);
      } else if (data) {
        // Store all jobs
        setLoadedJobs(data);
        setJobs(data);
      } else {
        setLoadedJobs([]);
        setJobs([]);
      }
    } catch (error) {
      console.error('Error loading jobs from database:', error);
      setLoadedJobs([]);
      setJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Load initial jobs from database (without bounds initially)
  useEffect(() => {
    loadJobsFromDatabase(null);
  }, []);

  // Handle map bounds changes
  const handleMapBoundsChange = (bounds: { north: number; south: number; east: number; west: number }) => {
    setMapBounds(bounds);
    // Reload all jobs when bounds change
    loadJobsFromDatabase(bounds);
  };

  // Refetch jobs when filters change (keeping current bounds)
  useEffect(() => {
    if (mapBounds) {
      loadJobsFromDatabase(mapBounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);


  const handleToggleMap = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    router.push(`/jobs/${jobId}`);
  };

  const handleMessagingClick = () => {
    setShowMessaging(true);
  };

  const handleMessagingClose = () => {
    setShowMessaging(false);
  };

  // Search handlers
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
  };

  const handleSearchSelect = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
    if (query.trim()) {
      toast.info(`Wyszukiwanie: "${query}"`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters(prev => ({
      ...prev,
      searchQuery: ''
    }));
  };

  const handlePrimaryLocationChange = (location: string) => {
    setPrimaryLocation(location);
  };
  
  // Initialize filter context on mount
  React.useEffect(() => {
    // Sync search query with filters
    if (searchQuery !== filters.searchQuery) {
      setFilters(prev => ({
        ...prev,
        searchQuery: searchQuery
      }));
    }
  }, [searchQuery]);

  const handleCityNameChange = (cityName: string | null) => {
    if (cityName) {
      setPrimaryLocation(cityName);
    }
  };

  const handleLocationChangeRequest = () => {
    setShowCitySelector(true);
  };

  // Set the location change handler in context
  React.useEffect(() => {
    setLocationChangeHandler(handleLocationChangeRequest);
  }, [setLocationChangeHandler]);

  const handleCitySelectorClose = () => {
    setShowCitySelector(false);
  };

  // Application modal handlers
  const handleApplyClick = (jobId: string, jobData?: any) => {
    if (!user) {
      toast.error('Musisz się zalogować, aby składać oferty');
      router.push('/login');
      return;
    }
    
    if (user?.userType !== 'contractor') {
      toast.error('Tylko wykonawcy mogą składać oferty');
      return;
    }
    
    setSelectedApplicationJobId(jobId);
    setSelectedApplicationJob(jobData);
    setApplicationModalOpen(true);
  };

  const handleApplicationSubmit = async (applicationData: any) => {
    if (!user?.id) {
      toast.error('Musisz być zalogowany aby złożyć ofertę');
      return;
    }

    if (!selectedApplicationJobId) {
      toast.error('Błąd: brak ID zlecenia');
      return;
    }

    const supabase = createClient();
    
    // Check if contractor has a company
    const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
    
    if (companyError) {
      console.error('Error checking company:', companyError);
      toast.error('Błąd podczas sprawdzania danych firmy');
      return;
    }

    if (!company) {
      toast.error('Musisz najpierw dodać informacje o swojej firmie w profilu konta');
      setApplicationModalOpen(false);
      router.push('/account?tab=company');
      return;
    }

    try {
      const job = selectedApplicationJob || getJobForApplication(selectedApplicationJobId);
      const isTender = job?.postType === 'tender';

      if (isTender) {
        // Handle tender bid submission
        const { data, error } = await createTenderBid(
          supabase,
          selectedApplicationJobId,
          user.id,
          {
            proposedPrice: applicationData.proposedPrice,
            estimatedCompletion: applicationData.estimatedCompletion,
            coverLetter: applicationData.coverLetter,
            additionalNotes: applicationData.additionalNotes,
          }
        );

        if (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : error?.message || error?.details || error?.hint || String(error) || 'Wystąpił błąd podczas składania oferty w przetargu';
          
          console.error('Error submitting tender bid:', error);
          
          if (errorMessage.includes('company') || errorMessage.includes('firm') || errorMessage.includes('Contractor must have')) {
            toast.error('Musisz najpierw dodać informacje o swojej firmie');
            setApplicationModalOpen(false);
            router.push('/account?tab=company');
            return;
          }
          
          toast.error(errorMessage);
          return;
        }

        console.log('Tender bid submitted successfully:', data);
        toast.success('Oferta w przetargu została złożona pomyślnie!');
      } else {
        // Handle regular job application submission
        const { data, error } = await createJobApplication(
          supabase,
          selectedApplicationJobId,
          user.id,
          {
            proposedPrice: applicationData.proposedPrice,
            estimatedCompletion: applicationData.estimatedCompletion,
            coverLetter: applicationData.coverLetter,
            additionalNotes: applicationData.additionalNotes,
          }
        );

        if (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : error?.message || error?.details || error?.hint || String(error) || 'Wystąpił błąd podczas składania oferty';
          
          console.error('Error submitting application:', error);
          
          if (errorMessage.includes('company') || errorMessage.includes('firm') || errorMessage.includes('Contractor must have')) {
            toast.error('Musisz najpierw dodać informacje o swojej firmie');
            setApplicationModalOpen(false);
            router.push('/account?tab=company');
            return;
          }
          
          toast.error(errorMessage);
          return;
        }

        console.log('Application submitted successfully:', data);
        toast.success('Oferta została złożona pomyślnie!');
      }

      setApplicationModalOpen(false);
      setSelectedApplicationJobId(null);
      setSelectedApplicationJob(null);
      setApplicationForm({
        proposedPrice: '',
        estimatedCompletion: '',
        coverLetter: '',
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Wystąpił błąd podczas składania oferty');
    }
  };

  const handleApplicationModalClose = () => {
    setApplicationModalOpen(false);
    setSelectedApplicationJobId(null);
    setSelectedApplicationJob(null);
    setApplicationForm({
      proposedPrice: '',
      estimatedCompletion: '',
      coverLetter: '',
      additionalNotes: ''
    });
  };

  // Get job data for application modal from database jobs
  const getJobForApplication = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    
    if (job) {
      return {
        id: job.id,
        title: job.title,
        company: job.company,
        postType: job.postType || 'job'
      };
    }
    
    return {
      id: jobId,
      title: 'Nieznane ogłoszenie',
      company: 'Nieznana firma',
      postType: 'job'
    };
  };

  // Check if user needs onboarding
  // useEffect(() => {
  //   // Only redirect if we have confirmed user data and they're authenticated
  //   // Don't redirect while still loading user data
  //   if (!isLoading && isAuthenticated && user && !user.profileCompleted) {
  //     router.push('/onboarding');
  //   }
  // }, [isAuthenticated, user, isLoading, router]);

  // Show loading state while user data is being fetched
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center space-y-4">
  //         <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
  //         <p className="text-muted-foreground">Ładowanie...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
      <>
      {/* Job Application Modal */}
      {applicationModalOpen && selectedApplicationJobId && (
        <JobApplicationModal
          isOpen={applicationModalOpen}
          onClose={handleApplicationModalClose}
          jobTitle={selectedApplicationJob?.title || getJobForApplication(selectedApplicationJobId).title}
          companyName={selectedApplicationJob?.company || getJobForApplication(selectedApplicationJobId).company}
          jobData={selectedApplicationJob}
          onApplicationSubmit={handleApplicationSubmit}
          applicationForm={applicationForm}
          setApplicationForm={setApplicationForm}
          postType={(selectedApplicationJob?.postType || getJobForApplication(selectedApplicationJobId).postType) as 'job' | 'tender'}
        />
      )}

      {/* Messaging System */}
      {showMessaging && (
        <MessagingSystem
          onClose={handleMessagingClose}
        />
      )}
      
      {/* Full Screen Map - Rendered outside container when expanded for full width */}
      {isMapExpanded && (
        <EnhancedMapView 
          jobs={jobs}
          isExpanded={isMapExpanded}
          onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
          selectedJobId={selectedJobId}
          onJobSelect={handleJobSelect}
          hoveredJobId={hoveredJobId}
          onJobHover={setHoveredJobId}
          userLocation={userLocation}
          onLocationChange={setUserLocation}
          onCityNameChange={handleCityNameChange}
          searchRadius={searchRadius}
          onRadiusChange={setSearchRadius}
          filters={filters}
          onFiltersChange={setFilters}
          showCitySelector={showCitySelector}
          onCitySelectorClose={handleCitySelectorClose}
          onBoundsChanged={handleMapBoundsChange}
        />
      )}
      
      {/* Main Layout - Hidden when map is expanded, wrapped in max-w-7xl container */}
      {!isMapExpanded && (
        <div className="max-w-7xl mx-auto sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row min-h-0 lg:min-h-[calc(100vh-12rem)]">
            {/* Filters Sidebar - Visible only on laptop and above */}
            <div className="hidden lg:flex flex-col lg:w-80 xl:w-96 flex-shrink-0">
              {/* Map Placeholder */}
              <div className="mb-4">
                <MapPlaceholder 
                  onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
                />
              </div>
              {/* Filters */}
              <JobFilters 
                onFilterChange={setFilters}
                initialFilters={filters}
                primaryLocation={primaryLocation}
                onLocationChange={handleLocationChangeRequest}
                jobs={loadedJobs}
              />
            </div>
            
            {/* Main Content - JobList */}
            <div className="flex-1 min-w-0 lg:ml-6">
              <JobList 
                jobs={loadedJobs}
                filters={filters}
                onFilterChange={setFilters}
                onJobSelect={handleJobSelect}
                onToggleMap={handleToggleMap}
                isMapVisible={false}
                isLoadingJobs={isLoadingJobs}
                onApplyClick={handleApplyClick}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
