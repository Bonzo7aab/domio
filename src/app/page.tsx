'use client'

import React, { useState, useEffect, useMemo } from 'react';
import JobFilters, { FilterState } from '../components/JobFilters';
import { EnhancedJobList } from '../components/EnhancedJobList';
import { EnhancedMapViewGoogleMaps as EnhancedMapView } from '../components/EnhancedMapViewGoogleMaps';
import { JobApplicationModal } from '../components/JobApplicationModal';
import { MessagingSystem } from '../components/MessagingSystem';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../contexts/AuthContext';
import { getJobsAndTenders, type DBJobFilters } from '../lib/data';
import { useLayoutContext } from '../components/ConditionalFooter';

export default function HomePage() {
  const { user } = useUserProfile();
  const router = useRouter();
  const { isMapExpanded, setIsMapExpanded } = useLayoutContext();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    subcategories: [],
    contractTypes: [],
    locations: [],
    salaryRange: [0, 1000],
    rating: 0,
    clientTypes: [],
    postTypes: ['job', 'tender'],
    tenderTypes: [],
    searchRadius: 25,
    useGeolocation: false,
    searchQuery: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(25);
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
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [primaryLocation, setPrimaryLocation] = useState<string>('Polska');
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Load jobs from database
  useEffect(() => {
    async function loadJobsFromDatabase() {
      try {
        setIsLoadingJobs(true);
        
        const dbFilters: DBJobFilters = {
          status: 'active',
          limit: 100,
        };
        
        const { data, error } = await getJobsAndTenders(dbFilters);
        
        if (error) {
          console.error('Error fetching jobs from database:', error);
          // Use empty array if database fails
          setJobs([]);
        } else if (data) {
          setJobs(data);
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error('Error loading jobs from database:', error);
        setJobs([]);
      } finally {
        setIsLoadingJobs(false);
      }
    }
    
    loadJobsFromDatabase();
  }, []);


  const toggleMapVisible = () => {
    setIsMapVisible(!isMapVisible);
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

  const handleCityNameChange = (cityName: string | null) => {
    if (cityName) {
      setPrimaryLocation(cityName);
    }
  };

  const handleLocationChangeRequest = () => {
    setShowCitySelector(true);
  };

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

  const handleApplicationSubmit = (applicationData: any) => {
    toast.success('Oferta została wysłana pomyślnie!');
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
    <div className="domio-main">
      
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
      
      <div className="flex min-h-[calc(100vh-12rem)]">
        {/* Filters Sidebar */}
        {!isMapExpanded && (
          <JobFilters 
            onFilterChange={setFilters} 
            primaryLocation={primaryLocation}
            onLocationChange={handleLocationChangeRequest}
          />
        )}
        
        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden gap-4">
          {/* Enhanced Job List */}
          {!isMapExpanded && (
            <EnhancedJobList 
              jobs={jobs}
              isLoadingJobs={isLoadingJobs}
              filters={filters}
              onJobSelect={handleJobSelect}
              onToggleMap={toggleMapVisible}
              isMapVisible={isMapVisible}
              hoveredJobId={hoveredJobId}
              onJobHover={setHoveredJobId}
              userLocation={userLocation}
              searchRadius={searchRadius}
              onApplyClick={handleApplyClick}
              onClearSearch={handleClearSearch}
              onPrimaryLocationChange={handlePrimaryLocationChange}
            />
          )}
          
          {/* Enhanced Map View - only show if visible */}
          {isMapVisible && (
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
