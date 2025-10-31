/**
 * Centralized data adapter that routes between mock data and database
 * 
 * All data fetching should go through this module to enable
 * seamless switching between mock and real data sources.
 */

import { shouldUseMockData } from '../config/data-source';
import { createClient } from '../supabase/client';

// Database imports
import { 
  fetchJobsAndTenders as dbFetchJobsAndTenders, 
  fetchJobById as dbFetchJobById,
  fetchTenderById as dbFetchTenderById,
  type JobFilters as DBJobFilters 
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
  mockTenders, 
  getTenderById as mockGetTenderById 
} from '../../mocks/tenders/mockTenders';
import { 
  mockConversations, 
  mockMessages,
  getConversationById as mockGetConversationById,
  getMessagesByConversationId as mockGetMessagesByConversationId
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
async function fetchData<T>(
  dbFetch: (supabase: any, ...args: any[]) => Promise<T>,
  mockFetch: (...args: any[]) => T,
  ...args: any[]
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
  dbFetch: (supabase: any, ...args: any[]) => Promise<T>,
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
function mockFetchJobsAndTenders(filters: DBJobFilters = {}): any {
  // Convert mock data map to array format
  const mockItems = Object.values(mockJobDetailsMap);
  
  // Apply basic filters
  let filtered = mockItems;
  
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter((item: any) => 
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query)
    );
  }
  
  if (filters.postType && filters.postType !== 'all') {
    filtered = filtered.filter((item: any) => item.postType === filters.postType);
  }
  
  // Sort by newest (default)
  if (filters.sortBy === 'newest' || !filters.sortBy) {
    filtered.sort((a: any, b: any) => 0); // Mock data is already in order
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
function mockFetchJobById(jobId: string): any {
  const mockJob = mockJobDetailsMap[jobId];
  if (mockJob && mockJob.postType === 'job') {
    return { data: mockJob, error: null };
  }
  return { data: null, error: 'Job not found' };
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
function mockFetchTenderById(tenderId: string): any {
  // Check mockJobDetailsMap first (has detailed format)
  const mockTenderFromMap = mockJobDetailsMap[tenderId];
  if (mockTenderFromMap && mockTenderFromMap.postType === 'tender') {
    return { data: mockTenderFromMap, error: null };
  }
  
  // Fallback to simple mock tenders
  const mockTender = mockGetTenderById(tenderId);
  if (mockTender) {
    return { data: mockTender, error: null };
  }
  return { data: null, error: 'Tender not found' };
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
  return fetchData(
    dbFetchManagers,
    mockFetchManagers,
    filters
  );
}

// ============================================================================
// MESSAGING
// ============================================================================

/**
 * Mock fetch function for conversations
 */
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
