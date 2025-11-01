// Contractors - migrated to database, use src/lib/database/contractors.ts

// Managers - migrated to database, use src/lib/database/managers.ts
// Note: Still exporting mockManagers for backward compatibility with ManagerPage
export * from './managers/mockManagers';
export * from './managers/mockManagerDetails';

// Contractors
export * from './contractors/mockContractors';
export * from './contractors/mockContractorDetails';

// Jobs
export * from './jobs/mockJobs';
export * from './jobs/mockJobDetails';

// Tenders
export * from './tenders/mockTenders';
export * from './tenders/mockBidEvaluations';

// Applications
export * from './applications/mockApplications';

// Messaging
export * from './messaging/mockMessaging';

// Users
export * from './users/mockUsers';

// Notifications
export * from './notifications/mockNotifications';
export * from './notifications/mockTenderNotifications';
export * from './notifications/mockApplicationNotifications';

// Re-export types from centralized types folder
export * from '../types';
