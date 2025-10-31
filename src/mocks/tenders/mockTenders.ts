import { Tender } from '../../types';

// Alias for backward compatibility
export type MockTender = Tender;

export const mockTenders: MockTender[] = [
  {
    id: 'tender-1',
    title: 'Kompleksowy remont elewacji budynku mieszkalnego',
    description: 'Poszukujemy wykonawcy do przeprowadzenia kompleksowego remontu elewacji 5-piętrowego budynku mieszkalnego przy ul. Kwiatowej 15.',
    category: 'Roboty Remontowo-Budowlane',
    location: 'Warszawa, Mokotów',
    estimatedValue: '450,000',
    currency: 'PLN',
    status: 'active',
    createdBy: 'Wspólnota Mieszkaniowa "Kwiatowa"',
    createdAt: new Date('2024-01-10'),
    submissionDeadline: new Date('2024-02-15T23:59:59'),
    bidCount: 7,
    requirements: [
      'Doświadczenie min. 3 lata w remontach elewacji',
      'Certyfikat ISO 9001',
      'Ubezpieczenie OC min. 500,000 zł',
      'Referencje z podobnych projektów'
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Specyfikacja techniczna.pdf',
        type: 'specification',
        url: '#',
        size: 2048000,
        uploadedAt: new Date('2024-01-10')
      }
    ],
    evaluationCriteria: [
      { id: 'price', name: 'Cena oferty', description: 'Łączna cena realizacji', weight: 40, type: 'price' },
      { id: 'quality', name: 'Jakość wykonania', description: 'Doświadczenie i referencje', weight: 30, type: 'quality' },
      { id: 'time', name: 'Termin realizacji', description: 'Czas wykonania prac', weight: 20, type: 'time' },
      { id: 'warranty', name: 'Gwarancja', description: 'Okres gwarancji i serwis', weight: 10, type: 'quality' }
    ],
    isPublic: true
  },
  {
    id: 'tender-2',
    title: 'Serwis i konserwacja wind w kompleksie mieszkaniowym',
    description: 'Kontrakt roczny na serwis 8 wind w kompleksie mieszkaniowym z możliwością przedłużenia.',
    category: 'Utrzymanie techniczne i konserwacja',
    location: 'Kraków, Podgórze',
    estimatedValue: '120,000',
    currency: 'PLN',
    status: 'evaluation',
    createdBy: 'SM "Podgórskie Tarasy"',
    createdAt: new Date('2024-01-05'),
    submissionDeadline: new Date('2024-01-25T23:59:59'),
    evaluationDeadline: new Date('2024-02-05T23:59:59'),
    bidCount: 4,
    requirements: [
      'Autoryzacja producenta wind',
      'Zespół serwisowy 24/7',
      'Magazyn części zamiennych w promieniu 50km'
    ],
    documents: [],
    evaluationCriteria: [
      { id: 'price', name: 'Cena miesięczna', description: 'Koszt miesięcznego serwisu', weight: 50, type: 'price' },
      { id: 'response', name: 'Czas reakcji', description: 'Czas reakcji na awarie', weight: 30, type: 'time' },
      { id: 'experience', name: 'Doświadczenie', description: 'Lata doświadczenia w branży', weight: 20, type: 'experience' }
    ],
    isPublic: true
  },
  {
    id: 'tender-3',
    title: 'Modernizacja instalacji elektrycznej',
    description: 'Wymiana instalacji elektrycznej w budynku z lat 70. wraz z montażem nowych rozdzielnic.',
    category: 'Instalacje i systemy',
    location: 'Gdańsk, Wrzeszcz',
    estimatedValue: '280,000',
    currency: 'PLN',
    status: 'awarded',
    createdBy: 'Wspólnota "Elektryk"',
    createdAt: new Date('2023-12-01'),
    submissionDeadline: new Date('2024-01-10T23:59:59'),
    bidCount: 9,
    winningBidId: 'bid-123',
    winnerName: 'ElektroMontaż Sp. z o.o.',
    requirements: [
      'Uprawnienia SEP do 1kV',
      'Doświadczenie w modernizacji budynków mieszkalnych',
      'Zespół min. 3 elektryków'
    ],
    documents: [],
    evaluationCriteria: [
      { id: 'price', name: 'Cena', description: 'Łączny koszt', weight: 35, type: 'price' },
      { id: 'quality', name: 'Jakość', description: 'Materiały i wykonanie', weight: 35, type: 'quality' },
      { id: 'time', name: 'Termin', description: 'Czas realizacji', weight: 30, type: 'time' }
    ],
    isPublic: true
  }
];

// Helper functions for working with tender data
export const getTenderById = (id: string): MockTender | undefined => {
  return mockTenders.find(tender => tender.id === id);
};

export const getTendersByStatus = (status: MockTender['status']): MockTender[] => {
  return mockTenders.filter(tender => tender.status === status);
};

export const getActiveTenders = (): MockTender[] => {
  return mockTenders.filter(tender => tender.status === 'active');
};

export const getTendersByCategory = (category: string): MockTender[] => {
  return mockTenders.filter(tender => 
    tender.category.toLowerCase().includes(category.toLowerCase())
  );
};

export const getTendersByLocation = (location: string): MockTender[] => {
  return mockTenders.filter(tender => 
    tender.location.toLowerCase().includes(location.toLowerCase())
  );
};
