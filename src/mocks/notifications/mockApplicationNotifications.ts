export type ApplicationNotificationType =
  | 'new_application'
  | 'application_update'
  | 'interview_request'
  | 'contract_signed';

export interface ApplicationNotificationMock {
  id: string;
  type: ApplicationNotificationType;
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

export const mockApplicationNotifications: ApplicationNotificationMock[] = [
  {
    id: 'notif-1',
    type: 'new_application',
    title: 'Nowa aplikacja na zlecenie',
    message: 'Otrzymano nową aplikację na zlecenie sprzątania klatek schodowych',
    contractorName: 'Jan Kowalski',
    contractorAvatar: '',
    contractorRating: 4.8,
    jobTitle: 'Sprzątanie klatek schodowych - budynek 5-kondygnacyjny',
    timestamp: new Date('2024-01-18T14:30:00'),
    read: false,
    applicationId: 'app-1',
    jobId: '1'
  },
  {
    id: 'notif-2',
    type: 'new_application',
    title: 'Nowa aplikacja na zlecenie',
    message: 'Otrzymano nową aplikację na remont elewacji budynku',
    contractorName: 'Anna Nowak',
    contractorAvatar: '',
    contractorRating: 4.6,
    jobTitle: 'Remont elewacji budynku - 4-piętrowy',
    timestamp: new Date('2024-01-18T09:15:00'),
    read: false,
    applicationId: 'app-2',
    jobId: '2'
  },
  {
    id: 'notif-3',
    type: 'application_update',
    title: 'Wykonawca wysłał dodatkowe dokumenty',
    message: 'Wykonawca przesłał aktualizację aplikacji z dodatkowymi certyfikatami',
    contractorName: 'Piotr Wiśniewski',
    contractorAvatar: '',
    contractorRating: 4.9,
    jobTitle: 'Serwis instalacji elektrycznej',
    timestamp: new Date('2024-01-17T16:45:00'),
    read: true,
    applicationId: 'app-3',
    jobId: '3'
  },
  {
    id: 'notif-4',
    type: 'contract_signed',
    title: 'Kontrakt został podpisany',
    message: 'Wykonawca zaakceptował warunki kontraktu i podpisał umowę',
    contractorName: 'Marek Zieliński',
    contractorAvatar: '',
    contractorRating: 4.7,
    jobTitle: 'Konserwacja wind w budynku',
    timestamp: new Date('2024-01-16T11:20:00'),
    read: true,
    applicationId: 'app-4',
    jobId: '4'
  }
];

