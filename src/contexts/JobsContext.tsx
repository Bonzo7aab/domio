'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Job } from '../types/job';

interface JobsContextType {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  loadedJobs: Job[];
  setLoadedJobs: (jobs: Job[]) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function useJobsContext() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobsContext must be used within a JobsProvider');
  }
  return context;
}

interface JobsProviderProps {
  children: ReactNode;
  initialJobs?: Job[];
  initialLoadedJobs?: Job[];
}

export function JobsProvider({ 
  children, 
  initialJobs = [],
  initialLoadedJobs = []
}: JobsProviderProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [loadedJobs, setLoadedJobs] = useState<Job[]>(initialLoadedJobs);

  return (
    <JobsContext.Provider 
      value={{ 
        jobs, 
        setJobs,
        loadedJobs,
        setLoadedJobs
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}
