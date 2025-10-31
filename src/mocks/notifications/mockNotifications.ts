import { Notification } from '../../types';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: '1',
    title: 'Nowa aplikacja na zlecenie',
    message: 'Jan Kowalski złożył aplikację na zlecenie "Sprzątanie klatek schodowych"',
    type: 'application',
    category: 'application',
    read: false,
    createdAt: new Date('2024-01-16T10:30:00'),
    data: {
      jobId: '1',
      applicationId: 'app-1',
      contractorName: 'Jan Kowalski'
    },
    priority: 'medium',
    actionUrl: '/manager/applications'
  },
  {
    id: 'notif-2',
    userId: '1',
    title: 'Nowy przetarg',
    message: 'Opublikowano nowy przetarg: "Remont elewacji budynku mieszkalnego"',
    type: 'tender',
    category: 'tender',
    read: false,
    createdAt: new Date('2024-01-16T09:15:00'),
    data: {
      tenderId: 'tender-1',
      tenderTitle: 'Remont elewacji budynku mieszkalnego'
    },
    priority: 'low',
    actionUrl: '/tenders'
  },
  {
    id: 'notif-3',
    userId: '2',
    title: 'Aplikacja została zaakceptowana',
    message: 'Gratulacje! Twoja aplikacja na zlecenie "Serwis instalacji elektrycznej" została zaakceptowana',
    type: 'success',
    category: 'application',
    read: true,
    createdAt: new Date('2024-01-15T14:20:00'),
    data: {
      jobId: '3',
      applicationId: 'app-3',
      jobTitle: 'Serwis instalacji elektrycznej'
    },
    priority: 'high',
    actionUrl: '/contractor/applications'
  },
  {
    id: 'notif-4',
    userId: '2',
    title: 'Nowa wiadomość',
    message: 'Masz nową wiadomość od Anna Kowalska',
    type: 'message',
    category: 'message',
    read: false,
    createdAt: new Date('2024-01-16T14:30:00'),
    data: {
      conversationId: 'conv-1',
      senderName: 'Anna Kowalska'
    },
    priority: 'medium',
    actionUrl: '/messages'
  },
  {
    id: 'notif-5',
    userId: '1',
    title: 'Zlecenie wygasło',
    message: 'Zlecenie "Malowanie klatek schodowych" wygasło. Nie otrzymano żadnych aplikacji.',
    type: 'warning',
    category: 'job',
    read: true,
    createdAt: new Date('2024-01-14T18:00:00'),
    data: {
      jobId: '2',
      jobTitle: 'Malowanie klatek schodowych'
    },
    priority: 'low',
    actionUrl: '/manager/jobs'
  },
  {
    id: 'notif-6',
    userId: '3',
    title: 'Witamy w Domio!',
    message: 'Dziękujemy za rejestrację. Uzupełnij swój profil, aby rozpocząć korzystanie z platformy.',
    type: 'info',
    category: 'system',
    read: false,
    createdAt: new Date('2024-01-16T08:00:00'),
    data: {},
    priority: 'high',
    actionUrl: '/profile/setup'
  },
  {
    id: 'notif-7',
    userId: '2',
    title: 'Przypomnienie o płatności',
    message: 'Pamiętaj o opłaceniu faktury za zlecenie "Sprzątanie klatek schodowych"',
    type: 'warning',
    category: 'job',
    read: false,
    createdAt: new Date('2024-01-16T12:00:00'),
    data: {
      jobId: '1',
      jobTitle: 'Sprzątanie klatek schodowych',
      amount: '2800 zł'
    },
    priority: 'medium',
    actionUrl: '/contractor/invoices'
  },
  {
    id: 'notif-8',
    userId: '1',
    title: 'Przetarg zakończony',
    message: 'Przetarg "Modernizacja instalacji elektrycznej" został zakończony. Wybrano wykonawcę: ElektroMontaż Sp. z o.o.',
    type: 'info',
    category: 'tender',
    read: true,
    createdAt: new Date('2024-01-12T16:45:00'),
    data: {
      tenderId: 'tender-3',
      tenderTitle: 'Modernizacja instalacji elektrycznej',
      winnerName: 'ElektroMontaż Sp. z o.o.'
    },
    priority: 'medium',
    actionUrl: '/tenders/tender-3'
  }
];

// Helper functions for working with notification data
export const getNotificationsByUserId = (userId: string): Notification[] => {
  return mockNotifications.filter(notification => notification.userId === userId);
};

export const getUnreadNotifications = (userId: string): Notification[] => {
  return mockNotifications.filter(notification => 
    notification.userId === userId && !notification.read
  );
};

export const getNotificationsByType = (type: Notification['type']): Notification[] => {
  return mockNotifications.filter(notification => notification.type === type);
};

export const getNotificationsByCategory = (category: Notification['category']): Notification[] => {
  return mockNotifications.filter(notification => notification.category === category);
};

export const getNotificationsByPriority = (priority: Notification['priority']): Notification[] => {
  return mockNotifications.filter(notification => notification.priority === priority);
};

export const getRecentNotifications = (userId: string, hours: number = 24): Notification[] => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);
  
  return mockNotifications.filter(notification => 
    notification.userId === userId && 
    notification.createdAt >= cutoffTime
  );
};
