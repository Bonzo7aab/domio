/**
 * Centralized data adapter that routes between mock data and database
 * 
 * All data fetching should go through this module to enable
 * seamless switching between mock and real data sources.
 */

import { shouldUseMockData } from '../config/data-source';
import { createClient } from '../supabase/client';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { Job } from '../../types/job';

// Database imports
import { 
  fetchJobsAndTenders as dbFetchJobsAndTenders, 
  fetchJobById as dbFetchJobById,
  fetchTenderById as dbFetchTenderById,
  type JobFilters as DBJobFilters,
  type JobWithCompany,
  type TenderWithCompany
} from '../database/jobs';
import { 
  fetchContractors as dbFetchContractors,
  type ContractorFilters as DBContractorFilters
} from '../database/contractors';
import { 
  fetchManagers as dbFetchManagers,
  type ManagerFilters as DBManagerFilters
} from '../database/managers';
import {
  fetchUserConversations as dbFetchUserConversations,
  fetchConversationMessages as dbFetchConversationMessages
} from '../database/messaging';

// Mock imports
import { mockJobDetailsMap } from '../../mocks/jobs/mockJobDetails';
import { 
  getTenderById as mockGetTenderById 
} from '../../mocks/tenders/mockTenders';
import { 
  getMessagesByConversationId as mockGetMessagesByConversationId,
  mockConversations
} from '../../mocks/messaging/mockMessaging';
import { getMockBrowseContractors } from '../../mocks/contractors/mockContractors';
import { getMockBrowseManagers } from '../../mocks/managers/mockManagers';

// ============================================================================
// GENERIC DATA FETCHING WRAPPER
// ============================================================================

/**
 * Generic wrapper for fetching data with automatic mock/DB routing
 * @param dbFetch - Database fetch function
 * @param mockFetch - Mock data fetch function (returning mock data directly)
 * @param args - Arguments to pass to database function (after supabase client)
 * @returns Data from mock or database
 */
async function fetchData<T, TArgs extends unknown[] = unknown[]>(
  dbFetch: (supabase: SupabaseClient<Database>, ...args: TArgs) => Promise<T>,
  mockFetch: (...args: TArgs) => T,
  ...args: TArgs
): Promise<T> {
  if (shouldUseMockData()) {
    // Return mock data
    return mockFetch(...args);
  }
  
  // Use database
  const supabase = createClient();
  return await dbFetch(supabase, ...args);
}

/**
 * Generic wrapper for fetching data with automatic mock/DB routing (when no mock data exists)
 * Falls back to database if mock data is not available
 * @param dbFetch - Database fetch function
 * @param args - Arguments to pass to database function (after supabase client)
 * @returns Data from database
 */
async function fetchDataFromDB<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbFetch: (supabase: any, ...args: any[]) => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): Promise<T> {
  const supabase = createClient();
  return await dbFetch(supabase, ...args);
}

// ============================================================================
// JOBS & TENDERS
// ============================================================================

/**
 * Mock fetch function for jobs and tenders
 */
function mockFetchJobsAndTenders(filters: DBJobFilters = {}): { data: Job[]; error: null } {
  // Convert mock data map to array format
  const mockItems = Object.values(mockJobDetailsMap) as unknown as Job[];
  
  // Apply basic filters
  let filtered = mockItems;
  
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter((item: Job) => {
      const locationStr = typeof item.location === 'string' 
        ? item.location.toLowerCase()
        : item.location?.city?.toLowerCase() || '';
      return (
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        locationStr.includes(query)
      );
    });
  }
  
  if (filters.postType && filters.postType !== 'all') {
    filtered = filtered.filter((item: Job) => item.postType === filters.postType);
  }
  
  // Sort by newest (default)
  if (filters.sortBy === 'newest' || !filters.sortBy) {
    filtered.sort((_a: Job, _b: Job) => 0); // Mock data is already in order
  }
  
  // Limit
  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }
  
  return { data: filtered, error: null };
}

/**
 * Fetch jobs and tenders (unified adapter)
 * @param filters - Optional filters for jobs/tenders
 * @returns Combined jobs and tenders data
 */
export async function getJobsAndTenders(filters: DBJobFilters = {}) {
  return fetchData(
    dbFetchJobsAndTenders,
    mockFetchJobsAndTenders,
    filters
  );
}

/**
 * Mock fetch function for single job
 */
function mockFetchJobById(jobId: string): { data: JobWithCompany | null; error: PostgrestError | null } {
  const mockJob = mockJobDetailsMap[jobId];
  if (mockJob && mockJob.postType === 'job') {
    return { data: mockJob as unknown as JobWithCompany, error: null };
  }
  return { data: null, error: new Error('Job not found') as PostgrestError };
}

/**
 * Fetch a single job by ID
 * @param jobId - Job ID
 * @returns Job data or null
 */
export async function getJobById(jobId: string) {
  return fetchData(
    dbFetchJobById,
    mockFetchJobById,
    jobId
  );
}

/**
 * Mock fetch function for single tender
 */
function mockFetchTenderById(tenderId: string): { data: TenderWithCompany | null; error: PostgrestError | null } {
  // Check mockJobDetailsMap first (has detailed format)
  const mockTenderFromMap = mockJobDetailsMap[tenderId];
  if (mockTenderFromMap && mockTenderFromMap.postType === 'tender') {
    return { data: mockTenderFromMap as unknown as TenderWithCompany, error: null };
  }
  
  // Fallback to simple mock tenders
  const mockTender = mockGetTenderById(tenderId);
  if (mockTender) {
    return { data: mockTender as unknown as TenderWithCompany, error: null };
  }
  return { data: null, error: new Error('Tender not found') as PostgrestError };
}

/**
 * Fetch a single tender by ID
 * @param tenderId - Tender ID
 * @returns Tender data or null
 */
export async function getTenderById(tenderId: string) {
  return fetchData(
    dbFetchTenderById,
    mockFetchTenderById,
    tenderId
  );
}

// ============================================================================
// CONTRACTORS
// ============================================================================

function mockFetchContractors(filters: DBContractorFilters = {}) {
  return getMockBrowseContractors(filters);
}

/**
 * Fetch contractors with automatic mock/DB routing
 * @param filters - Optional filters for contractors
 * @returns Contractors data
 */
export async function getContractors(filters: DBContractorFilters = {}) {
  return fetchData(
    dbFetchContractors,
    mockFetchContractors,
    filters
  );
}

// ============================================================================
// MANAGERS
// ============================================================================

function mockFetchManagers(filters: DBManagerFilters = {}) {
  return getMockBrowseManagers(filters);
}

/**
 * Fetch managers with automatic mock/DB routing
 * @param filters - Optional filters for managers
 * @returns Managers data
 */
export async function getManagers(filters: DBManagerFilters = {}) {
  if (shouldUseMockData()) {
    return mockFetchManagers(filters);
  }
  return dbFetchManagers(filters);
}

// ============================================================================
// MESSAGING
// ============================================================================

/**
 * Mock fetch function for conversations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockFetchConversations(userId: string): any {
  // Filter conversations where user is a participant
  const userConversations = mockConversations.filter(conv =>
    conv.participants.some(p => p.id === userId)
  );
  return { data: userConversations, error: null };
}

/**
 * Fetch user conversations
 * @param userId - User ID
 * @returns Conversations list
 */
export async function getConversations(userId: string) {
  return fetchData(
    dbFetchUserConversations,
    mockFetchConversations,
    userId
  );
}

/**
 * Mock fetch function for messages
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockFetchMessages(conversationId: string): any {
  const messages = mockGetMessagesByConversationId(conversationId);
  return { data: messages, error: null };
}

/**
 * Fetch messages for a conversation
 * @param conversationId - Conversation ID
 * @returns Messages list
 */
export async function getMessages(conversationId: string) {
  return fetchData(
    dbFetchConversationMessages,
    mockFetchMessages,
    conversationId
  );
}

// Re-export types for convenience
export type { DBJobFilters, DBContractorFilters, DBManagerFilters };
