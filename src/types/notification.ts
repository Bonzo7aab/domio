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
    [key: string]: any;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'application' | 'tender' | 'message';
export type NotificationCategory = 'job' | 'application' | 'tender' | 'message' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
