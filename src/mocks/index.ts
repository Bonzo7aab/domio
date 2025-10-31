// Contractors - migrated to database, use src/lib/database/contractors.ts

// Managers - migrated to database, use src/lib/database/managers.ts
// Note: Still exporting mockManagers for backward compatibility with ManagerPage
export * from './managers/mockManagers';

// Contractors
export * from './contractors/mockContractors';

// Jobs
export * from './jobs/mockJobDetails';

// Tenders
export * from './tenders/mockTenders';

// Applications
export * from './applications/mockApplications';

// Messaging
export * from './messaging/mockMessaging';

// Users
export * from './users/mockUsers';

// Notifications
export * from './notifications/mockNotifications';

// Re-export types from centralized types folder
export * from '../types';
