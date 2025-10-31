export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: MessageAttachment[];
  type: 'text' | 'system' | 'application_update';
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'other';
  size: number;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  avatar?: string;
  userType: 'manager' | 'contractor';
  company?: string;
  phone?: string;
  isOnline: boolean;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  jobId?: string;
  jobTitle?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageType = 'text' | 'system' | 'application_update';
