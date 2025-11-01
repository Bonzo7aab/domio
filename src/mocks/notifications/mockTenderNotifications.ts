export type TenderNotificationType =
  | 'new_tender'
  | 'deadline_reminder'
  | 'evaluation_started'
  | 'tender_awarded'
  | 'tender_cancelled';

export interface TenderNotificationMock {
  id: string;
  type: TenderNotificationType;
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

export const mockTenderNotifications: TenderNotificationMock[] = [
  {
    id: 'tender-notif-1',
    type: 'new_tender',
    title: 'Nowy przetarg dostępny',
    message: 'Opublikowano nowy przetarg w Twojej specjalizacji',
    tenderTitle: 'Kompleksowy remont elewacji budynku mieszkalnego',
    organizerName: 'Wspólnota Mieszkaniowa "Kwiatowa"',
    estimatedValue: '450,000 PLN',
    deadline: new Date('2024-02-15T23:59:59'),
    timestamp: new Date('2024-01-18T14:30:00'),
    read: false,
    tenderId: 'tender-1'
  },
  {
    id: 'tender-notif-2',
    type: 'deadline_reminder',
    title: 'Zbliża się termin składania ofert',
    message: 'Zostały 3 dni do końca składania ofert w przetargu',
    tenderTitle: 'Serwis i konserwacja wind w kompleksie mieszkaniowym',
    organizerName: 'SM "Podgórskie Tarasy"',
    estimatedValue: '120,000 PLN',
    deadline: new Date('2024-01-25T23:59:59'),
    timestamp: new Date('2024-01-22T09:00:00'),
    read: false,
    tenderId: 'tender-2'
  },
  {
    id: 'tender-notif-3',
    type: 'evaluation_started',
    title: 'Rozpoczęto ocenę ofert',
    message: 'Trwa proces oceny złożonych ofert w przetargu',
    tenderTitle: 'Modernizacja instalacji elektrycznej',
    organizerName: 'Wspólnota "Elektryk"',
    estimatedValue: '280,000 PLN',
    timestamp: new Date('2024-01-15T16:45:00'),
    read: true,
    tenderId: 'tender-3'
  },
  {
    id: 'tender-notif-4',
    type: 'tender_awarded',
    title: 'Wyniki przetargu zostały ogłoszone',
    message: 'Przetarg został rozstrzygnięty. Zobacz wyniki.',
    tenderTitle: 'Remont dachu budynku mieszkalnego',
    organizerName: 'Zarząd Nieruchomości ABC',
    estimatedValue: '200,000 PLN',
    timestamp: new Date('2024-01-10T11:20:00'),
    read: true,
    tenderId: 'tender-4'
  }
];

