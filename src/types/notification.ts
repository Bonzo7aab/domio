export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'application' | 'tender' | 'message';
  category: 'job' | 'application' | 'tender' | 'message' | 'system';
  read: boolean;
  createdAt: Date;
  data?: {
    jobId?: string;
    applicationId?: string;
    tenderId?: string;
    conversationId?: string;
    [key: string]: unknown;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'application' | 'tender' | 'message';
export type NotificationCategory = 'job' | 'application' | 'tender' | 'message' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Unified Notifications Types
export interface JobNotification {
  id: string;
  category: 'job';
  type: 'new_job' | 'saved_search' | 'price_alert' | 'deadline_reminder';
  title: string;
  description: string;
  jobId?: string;
  searchQuery?: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

export interface ApplicationNotification {
  id: string;
  category: 'application';
  type: 'new_application' | 'application_update' | 'interview_request' | 'contract_signed';
  title: string;
  message: string;
  contractorName: string;
  contractorAvatar?: string;
  contractorRating: number;
  jobTitle: string;
  timestamp: Date;
  read: boolean;
  applicationId: string;
  jobId: string;
}

export interface TenderNotification {
  id: string;
  category: 'tender';
  type: 'new_tender' | 'deadline_reminder' | 'evaluation_started' | 'tender_awarded' | 'tender_cancelled';
  title: string;
  message: string;
  tenderTitle: string;
  organizerName: string;
  estimatedValue?: string;
  deadline?: Date;
  timestamp: Date;
  read: boolean;
  tenderId: string;
}

export interface SystemNotification {
  id: string;
  category: 'system';
  /**
   * Subset of the system events the bell currently surfaces. Extend as more
   * platform-level notifications are wired in.
   */
  type: 'verification_approved' | 'verification_rejected';
  title: string;
  message: string;
  actionUrl?: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

export interface MessageNotification {
  id: string;
  category: 'message';
  type: 'new_message';
  title: string;
  message: string;
  conversationId?: string;
  actionUrl?: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

export type UnifiedNotification =
  | JobNotification
  | ApplicationNotification
  | TenderNotification
  | SystemNotification
  | MessageNotification;

export interface UnifiedNotificationsProps {
  onJobSelect?: (jobId: string) => void;
  onSearchSelect?: (query: string) => void;
  onApplicationSelect?: (applicationId: string) => void;
  onTenderSelect?: (tenderId: string) => void;
}
