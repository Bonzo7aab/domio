export interface EvaluationCriterionMock {
  id: string;
  name: string;
  description: string;
  weight: number;
  type: 'price' | 'quality' | 'time' | 'experience';
}

export interface TenderBidMock {
  id: string;
  contractorId: string;
  contractorName: string;
  contractorCompany: string;
  contractorAvatar?: string;
  contractorRating: number;
  contractorCompletedJobs: number;
  totalPrice: number;
  currency: string;
  proposedTimeline: number;
  proposedStartDate: Date;
  guaranteePeriod: number;
  description: string;
  technicalProposal: string;
  attachments: Array<{ id: string; name: string; type: string; url: string; size: number }>;
  criteriaResponses: Array<{ criterionId: string; response: string }>;
  submittedAt: Date;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'awarded';
  evaluation?: {
    criteriaScores: Record<string, number>;
    totalScore: number;
    evaluatorNotes: string;
    evaluatedAt: Date;
    evaluatorId: string;
  };
}

export const mockEvaluationCriteria: EvaluationCriterionMock[] = [
  { id: 'price', name: 'Cena oferty', description: 'Łączna cena realizacji', weight: 40, type: 'price' },
  { id: 'quality', name: 'Jakość wykonania', description: 'Doświadczenie i referencje', weight: 30, type: 'quality' },
  { id: 'time', name: 'Termin realizacji', description: 'Czas wykonania prac', weight: 20, type: 'time' },
  { id: 'warranty', name: 'Gwarancja', description: 'Okres gwarancji i serwis', weight: 10, type: 'quality' }
];

export const mockTenderBids: TenderBidMock[] = [
  {
    id: 'bid-1',
    contractorId: 'c-1',
    contractorName: 'Jan Kowalski',
    contractorCompany: 'BudoMaster Sp. z o.o.',
    contractorAvatar: '',
    contractorRating: 4.8,
    contractorCompletedJobs: 23,
    totalPrice: 420000,
    currency: 'PLN',
    proposedTimeline: 45,
    proposedStartDate: new Date('2024-03-01'),
    guaranteePeriod: 24,
    description: 'Kompleksowa oferta z wykorzystaniem najnowszych technologii i materiałów najwyższej jakości.',
    technicalProposal: 'Realizacja będzie przeprowadzona etapami z minimalizacją uciążliwości dla mieszkańców...',
    attachments: [
      { id: 'att-1', name: 'Portfolio_BudoMaster.pdf', type: 'portfolio', url: '#', size: 2048000 },
      { id: 'att-2', name: 'Certyfikat_ISO9001.pdf', type: 'certificates', url: '#', size: 512000 }
    ],
    criteriaResponses: [
      { criterionId: 'price', response: 'Oferujemy konkurencyjną cenę przy zachowaniu najwyższej jakości materiałów i wykonania.' },
      { criterionId: 'quality', response: 'Posiadamy 15 lat doświadczenia w remontach elewacji budynków mieszkalnych...' }
    ],
    submittedAt: new Date('2024-01-15T10:30:00'),
    status: 'submitted'
  },
  {
    id: 'bid-2',
    contractorId: 'c-2',
    contractorName: 'Anna Nowak',
    contractorCompany: 'ElewacjePro Sp. z o.o.',
    contractorAvatar: '',
    contractorRating: 4.6,
    contractorCompletedJobs: 18,
    totalPrice: 445000,
    currency: 'PLN',
    proposedTimeline: 35,
    proposedStartDate: new Date('2024-02-15'),
    guaranteePeriod: 18,
    description: 'Szybka realizacja z gwarancją terminu i jakości wykonania.',
    technicalProposal: 'Wykorzystamy zaawansowane techniki renowacji z systemem rusztowań...',
    attachments: [
      { id: 'att-3', name: 'Referencje_ElewacjePro.pdf', type: 'references', url: '#', size: 1024000 }
    ],
    criteriaResponses: [
      { criterionId: 'price', response: 'Nasza oferta zapewnia optymalne połączenie ceny i jakości.' },
      { criterionId: 'time', response: 'Gwarantujemy realizację w ciągu 35 dni roboczych...' }
    ],
    submittedAt: new Date('2024-01-16T14:20:00'),
    status: 'submitted'
  },
  {
    id: 'bid-3',
    contractorId: 'c-3',
    contractorName: 'Piotr Wiśniewski',
    contractorCompany: 'Renovate Plus',
    contractorAvatar: '',
    contractorRating: 4.9,
    contractorCompletedJobs: 31,
    totalPrice: 398000,
    currency: 'PLN',
    proposedTimeline: 50,
    proposedStartDate: new Date('2024-02-20'),
    guaranteePeriod: 36,
    description: 'Najlepsza oferta cenowa z rozszerzoną gwarancją i ekologicznymi rozwiązaniami.',
    technicalProposal: 'Zastosujemy materiały ekologiczne i energooszczędne rozwiązania...',
    attachments: [
      { id: 'att-4', name: 'Certyfikat_Ekologiczny.pdf', type: 'certificates', url: '#', size: 256000 },
      { id: 'att-5', name: 'Portfolio_2023.pdf', type: 'portfolio', url: '#', size: 3072000 }
    ],
    criteriaResponses: [
      { criterionId: 'price', response: 'Oferujemy najlepszą cenę przy zachowaniu wysokiej jakości.' },
      { criterionId: 'quality', response: 'Nasze prace są objęte 3-letnią gwarancją i certyfikatem ekologicznym...' }
    ],
    submittedAt: new Date('2024-01-18T09:45:00'),
    status: 'submitted'
  }
];

