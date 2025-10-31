import { Message, MessageAttachment, ConversationParticipant, Conversation } from '../../types';

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: [
      {
        id: 'user-1',
        name: 'Anna Kowalska',
        avatar: '',
        userType: 'manager',
        company: 'WM Słoneczna',
        phone: '+48 123 456 789',
        isOnline: true
      },
      {
        id: 'user-2',
        name: 'Jan Nowak',
        avatar: '',
        userType: 'contractor',
        company: 'CleanPro Sp. z o.o.',
        phone: '+48 987 654 321',
        isOnline: false
      }
    ],
    lastMessage: {
      id: 'msg-5',
      senderId: 'user-2',
      senderName: 'Jan Nowak',
      content: 'Dziękuję za informacje. Czy mogę przesłać szczegółową wycenę?',
      timestamp: new Date('2024-01-16T14:30:00'),
      read: false,
      type: 'text'
    },
    unreadCount: 2,
    jobId: '1',
    jobTitle: 'Sprzątanie klatek schodowych',
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-16T14:30:00')
  },
  {
    id: 'conv-2',
    participants: [
      {
        id: 'user-1',
        name: 'Anna Kowalska',
        avatar: '',
        userType: 'manager',
        company: 'WM Słoneczna',
        phone: '+48 123 456 789',
        isOnline: true
      },
      {
        id: 'user-3',
        name: 'Piotr Wiśniewski',
        avatar: '',
        userType: 'contractor',
        company: 'Elektro-Serwis',
        phone: '+48 555 123 456',
        isOnline: true
      }
    ],
    lastMessage: {
      id: 'msg-10',
      senderId: 'user-1',
      senderName: 'Anna Kowalska',
      content: 'Zgoda. Proszę o przesłanie harmonogramu prac.',
      timestamp: new Date('2024-01-15T16:45:00'),
      read: true,
      type: 'text'
    },
    unreadCount: 0,
    jobId: '3',
    jobTitle: 'Serwis instalacji elektrycznej',
    createdAt: new Date('2024-01-14T09:15:00'),
    updatedAt: new Date('2024-01-15T16:45:00')
  }
];

export const mockMessages: { [conversationId: string]: Message[] } = {
  'conv-1': [
    {
      id: 'msg-1',
      senderId: 'user-2',
      senderName: 'Jan Nowak',
      content: 'Dzień dobry, interesuje mnie Państwa zlecenie dotyczące sprzątania klatek schodowych.',
      timestamp: new Date('2024-01-15T10:15:00'),
      read: true,
      type: 'text'
    },
    {
      id: 'msg-2',
      senderId: 'user-1',
      senderName: 'Anna Kowalska',
      content: 'Dzień dobry! Bardzo miło, że się Pan zgłosił. Czy może Pan przesłać więcej informacji o swojej firmie?',
      timestamp: new Date('2024-01-15T10:20:00'),
      read: true,
      type: 'text'
    },
    {
      id: 'msg-3',
      senderId: 'user-2',
      senderName: 'Jan Nowak',
      content: 'Oczywiście! Załączam portfolio naszej firmy oraz referencje z podobnych projektów.',
      timestamp: new Date('2024-01-15T10:25:00'),
      read: true,
      type: 'text',
      attachments: [
        {
          id: 'att-1',
          name: 'portfolio_cleanpro.pdf',
          url: '#',
          type: 'document',
          size: 2048000
        }
      ]
    },
    {
      id: 'msg-4',
      senderId: 'user-1',
      senderName: 'Anna Kowalska',
      content: 'Dziękuję za materiały. Jakie są Państwa warunki cenowe?',
      timestamp: new Date('2024-01-15T14:00:00'),
      read: true,
      type: 'text'
    },
    {
      id: 'msg-5',
      senderId: 'user-2',
      senderName: 'Jan Nowak',
      content: 'Dziękuję za informacje. Czy mogę przesłać szczegółową wycenę?',
      timestamp: new Date('2024-01-16T14:30:00'),
      read: false,
      type: 'text'
    }
  ],
  'conv-2': [
    {
      id: 'msg-6',
      senderId: 'user-3',
      senderName: 'Piotr Wiśniewski',
      content: 'Witam, chciałbym złożyć ofertę na serwis instalacji elektrycznej.',
      timestamp: new Date('2024-01-14T09:20:00'),
      read: true,
      type: 'text'
    },
    {
      id: 'msg-7',
      senderId: 'user-1',
      senderName: 'Anna Kowalska',
      content: 'Dzień dobry! Proszę o przesłanie szczegółów oferty.',
      timestamp: new Date('2024-01-14T09:25:00'),
      read: true,
      type: 'text'
    },
    {
      id: 'msg-8',
      senderId: 'user-3',
      senderName: 'Piotr Wiśniewski',
      content: 'Oferujemy kompleksowy serwis instalacji elektrycznej z gwarancją 2 lata. Cena: 8500 zł netto.',
      timestamp: new Date('2024-01-14T15:30:00'),
      read: true,
      type: 'text'
    },
    {
      id: 'msg-9',
      senderId: 'user-1',
      senderName: 'Anna Kowalska',
      content: 'Czy może Pan przesłać harmonogram prac i listę materiałów?',
      timestamp: new Date('2024-01-15T10:00:00'),
      read: true,
      type: 'text'
    },
    {
      id: 'msg-10',
      senderId: 'user-1',
      senderName: 'Anna Kowalska',
      content: 'Zgoda. Proszę o przesłanie harmonogramu prac.',
      timestamp: new Date('2024-01-15T16:45:00'),
      read: true,
      type: 'text'
    }
  ]
};

// Helper functions for working with messaging data
export const getConversationById = (id: string): Conversation | undefined => {
  return mockConversations.find(conversation => conversation.id === id);
};

export const getMessagesByConversationId = (conversationId: string): Message[] => {
  return mockMessages[conversationId] || [];
};

export const getUnreadConversations = (): Conversation[] => {
  return mockConversations.filter(conversation => conversation.unreadCount > 0);
};

export const getConversationsByJobId = (jobId: string): Conversation[] => {
  return mockConversations.filter(conversation => conversation.jobId === jobId);
};

export const getConversationsByUserId = (userId: string): Conversation[] => {
  return mockConversations.filter(conversation => 
    conversation.participants.some(participant => participant.id === userId)
  );
};
