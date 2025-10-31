import { Application } from '../../types';

// Alias for backward compatibility
export type MockApplication = Application;

export const mockApplications: MockApplication[] = [
  {
    id: 'app-1',
    jobId: '1',
    contractorId: 'c-1',
    contractorName: 'Jan Kowalski',
    contractorCompany: 'CleanPro Sp. z o.o.',
    contractorAvatar: '',
    contractorRating: 4.8,
    contractorCompletedJobs: 23,
    contractorLocation: 'Warszawa',
    proposedPrice: 2800,
    proposedTimeline: '2 tygodnie',
    coverLetter: 'Dzień dobry, jesteśmy firmą z 5-letnim doświadczeniem w sprzątaniu budynków mieszkalnych. Posiadamy wszystkie niezbędne certyfikaty oraz ubezpieczenie OC. Oferujemy kompleksowe usługi sprzątania z gwarancją jakości.',
    experience: 'Realizowaliśmy podobne projekty dla Wspólnoty "Zielona" oraz SM "Centrum". Nasze doświadczenie obejmuje obsługę budynków o różnej wielkości, od małych wspólnot po duże spółdzielnie.',
    teamSize: 2,
    availableFrom: '2024-02-01',
    guaranteePeriod: '12',
    attachments: [
      { id: 'att-1', name: 'portfolio.pdf', type: 'portfolio', url: '', size: 1024000 },
      { id: 'att-2', name: 'referencje.pdf', type: 'reference', url: '', size: 512000 }
    ],
    certificates: ['ISO 9001', 'Certyfikat DDD'],
    status: 'submitted',
    submittedAt: new Date('2024-01-15T10:30:00'),
    lastUpdated: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'app-2',
    jobId: '1',
    contractorId: 'c-2',
    contractorName: 'Anna Nowak',
    contractorCompany: 'Sprzątanie Mokotów',
    contractorAvatar: '',
    contractorRating: 4.6,
    contractorCompletedJobs: 31,
    contractorLocation: 'Warszawa',
    proposedPrice: 3200,
    proposedTimeline: '1 tydzień',
    coverLetter: 'Witam, nasza firma specjalizuje się w profesjonalnym sprzątaniu budynków mieszkalnych. Oferujemy elastyczne terminy oraz konkurencyjne ceny. Posiadamy własny sprzęt oraz środki ekologiczne.',
    experience: 'Od 8 lat obsługujemy budynki mieszkalne w Warszawie. Mamy stałych klientów w kilku wspólnotach, które mogą wystawić nam referencje. Specjalizujemy się w utrzymaniu klatek schodowych.',
    teamSize: 3,
    availableFrom: '2024-01-20',
    guaranteePeriod: '24',
    attachments: [
      { id: 'att-3', name: 'certyfikaty.pdf', type: 'certificate', url: '', size: 2048000 }
    ],
    certificates: ['Certyfikat DDD', 'Eko-certyfikat'],
    status: 'under_review',
    submittedAt: new Date('2024-01-14T14:15:00'),
    lastUpdated: new Date('2024-01-16T09:00:00')
  },
  {
    id: 'app-3',
    jobId: '2',
    contractorId: 'c-3',
    contractorName: 'Marek Zieliński',
    contractorCompany: 'Elektro-Serwis',
    contractorAvatar: '',
    contractorRating: 4.9,
    contractorCompletedJobs: 45,
    contractorLocation: 'Kraków',
    proposedPrice: 8500,
    proposedTimeline: '3 tygodnie',
    coverLetter: 'Szanowni Państwo, nasza firma posiada wieloletnie doświadczenie w modernizacji instalacji elektrycznych w budynkach mieszkalnych. Zapewniamy najwyższą jakość wykonania oraz pełną zgodność z normami.',
    experience: 'Specjalizujemy się w modernizacji instalacji elektrycznych w budynkach z lat 70-80. Wykonaliśmy już ponad 40 podobnych projektów w Krakowie i okolicach.',
    teamSize: 4,
    availableFrom: '2024-02-15',
    guaranteePeriod: '36',
    attachments: [
      { id: 'att-4', name: 'uprawnienia_sep.pdf', type: 'certificate', url: '', size: 1536000 },
      { id: 'att-5', name: 'referencje_elektryczne.pdf', type: 'reference', url: '', size: 768000 }
    ],
    certificates: ['Uprawnienia SEP', 'Certyfikat ISO 9001', 'Certyfikat bezpieczeństwa'],
    status: 'accepted',
    submittedAt: new Date('2024-01-10T09:00:00'),
    lastUpdated: new Date('2024-01-12T14:30:00')
  },
  {
    id: 'app-4',
    jobId: '3',
    contractorId: 'c-4',
    contractorName: 'Tomasz Kowalczyk',
    contractorCompany: 'Malowanie Pro',
    contractorAvatar: '',
    contractorRating: 4.7,
    contractorCompletedJobs: 28,
    contractorLocation: 'Gdańsk',
    proposedPrice: 12000,
    proposedTimeline: '4 tygodnie',
    coverLetter: 'Dzień dobry, oferujemy profesjonalne usługi malowania elewacji z wykorzystaniem najnowszych technologii i wysokiej jakości materiałów. Gwarantujemy trwałość i estetykę wykonania.',
    experience: 'Ponad 6 lat doświadczenia w malowaniu elewacji budynków mieszkalnych. Wykonaliśmy remonty elewacji w ponad 25 budynkach w Trójmieście.',
    teamSize: 3,
    availableFrom: '2024-03-01',
    guaranteePeriod: '24',
    attachments: [
      { id: 'att-6', name: 'portfolio_malowanie.pdf', type: 'portfolio', url: '', size: 2560000 }
    ],
    certificates: ['Certyfikat malarski', 'Uprawnienia wysokościowe'],
    status: 'submitted',
    submittedAt: new Date('2024-01-18T11:20:00'),
    lastUpdated: new Date('2024-01-18T11:20:00')
  }
];

// Helper functions for working with application data
export const getApplicationById = (id: string): MockApplication | undefined => {
  return mockApplications.find(application => application.id === id);
};

export const getApplicationsByJobId = (jobId: string): MockApplication[] => {
  return mockApplications.filter(application => application.jobId === jobId);
};

export const getApplicationsByStatus = (status: MockApplication['status']): MockApplication[] => {
  return mockApplications.filter(application => application.status === status);
};

export const getApplicationsByContractorId = (contractorId: string): MockApplication[] => {
  return mockApplications.filter(application => application.contractorId === contractorId);
};

export const getPendingApplications = (): MockApplication[] => {
  return mockApplications.filter(application => 
    application.status === 'submitted' || application.status === 'under_review'
  );
};
