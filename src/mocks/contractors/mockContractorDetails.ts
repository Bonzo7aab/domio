export interface ContractorDetailedProfile {
  name: string;
  logo: string;
  coverImage: string;
  slogan: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  verified: boolean;
  hasInsurance: boolean;
  isPremium: boolean;
  founded: number;
  employees: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  specialties: string[];
  certificates: string[];
  services: Array<{
    name: string;
    description: string;
    price: string;
  }>;
  portfolio: Array<{
    title: string;
    image: string;
    description: string;
    date: string;
  }>;
  team: Array<{
    name: string;
    position: string;
    image: string;
    experience: string;
  }>;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    date: string;
    project: string;
  }>;
  stats: {
    projectsCompleted: number;
    clientSatisfaction: number;
    repeatClients: number;
    avgResponseTime: string;
  };
}

export const mockContractorDetailsMap: Record<string, ContractorDetailedProfile> = {
  '2': {
    name: 'BudMaster Construction',
    logo: 'https://images.unsplash.com/photo-1581626216082-f8497d54e0a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBjb21wYW55JTIwbG9nb3xlbnwxfHx8fDE3NTc0MjA1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    coverImage: 'https://images.unsplash.com/photo-1697992350283-e865ae4d5bac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMHJlbm92YXRpb24lMjBmYWNhZGV8ZW58MXx8fHwxNzU3NDIxMjkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    slogan: 'Tworzymy przyszłość budownictwa',
    description: 'BudMaster Construction to wiodąca firma budowlana specjalizująca się w kompleksowych remontach elewacji i termomodernizacji budynków mieszkalnych. Od 2008 roku realizujemy projekty dla wspólnot mieszkaniowych w całej Polsce.',
    location: 'Kraków',
    rating: 4.9,
    reviewCount: 89,
    completedJobs: 234,
    verified: true,
    hasInsurance: true,
    isPremium: true,
    founded: 2008,
    employees: '50-100',
    website: 'www.budmaster.pl',
    phone: '+48 12 345 67 89',
    email: 'kontakt@budmaster.pl',
    address: 'ul. Budowlana 15, 30-611 Kraków',
    specialties: ['Remonty elewacji', 'Prace wysokościowe', 'Termomodernizacja', 'Izolacje', 'Rusztowania'],
    certificates: [
      'Certyfikat budowlany',
      'Uprawnienia wysokościowe',
      'ISO 9001:2015',
      'ISO 14001:2015'
    ],
    services: [
      {
        name: 'Remonty elewacji',
        description: 'Kompleksowe remonty elewacji budynków mieszkalnych',
        price: '80-120 zł/m²'
      },
      {
        name: 'Termomodernizacja',
        description: 'Ocieplanie budynków systemami ETICS',
        price: '150-200 zł/m²'
      },
      {
        name: 'Prace wysokościowe',
        description: 'Specjalistyczne prace na wysokości bez rusztowań',
        price: '200-300 zł/dzień'
      }
    ],
    portfolio: [
      {
        title: 'Remont elewacji - Osiedle Parkowe',
        image: 'https://images.unsplash.com/photo-1697992350283-e865ae4d5bac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMHJlbm92YXRpb24lMjBmYWNhZGV8ZW58MXx8fHwxNzU3NDIxMjkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        description: 'Kompleksowy remont elewacji 6 budynków mieszkalnych',
        date: '2024'
      },
      {
        title: 'Termomodernizacja - Zakątek Mieszkaniowy',
        image: 'https://images.unsplash.com/photo-1602497485099-e41a116a272c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBvZmZpY2UlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTc0MjEyOTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        description: 'Ocieplenie 4 budynków w ramach programu termomodernizacji',
        date: '2023'
      }
    ],
    team: [
      {
        name: 'Marek Kowalski',
        position: 'Kierownik budowy',
        image: 'https://images.unsplash.com/photo-1684497404598-6e844dff9cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB0ZWFtJTIwd29ya2Vyc3xlbnwxfHx8fDE3NTc0MjEyODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        experience: '15 lat doświadczenia'
      },
      {
        name: 'Anna Nowak',
        position: 'Specjalista ds. termomodernizacji',
        image: 'https://images.unsplash.com/photo-1684497404598-6e844dff9cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB0ZWFtJTIwd29ya2Vyc3xlbnwxfHx8fDE3NTc0MjEyODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        experience: '12 lat doświadczenia'
      }
    ],
    reviews: [
      {
        author: 'WSM "Zielona"',
        rating: 5,
        text: 'Profesjonalne wykonanie remontu elewacji. Terminowość, jakość i fair play. Polecamy!',
        date: '2024-02-15',
        project: 'Remont elewacji'
      },
      {
        author: 'Spółdzielnia "Nowy Dom"',
        rating: 5,
        text: 'Bardzo dobrze zorganizowana termomodernizacja. Wszystko zgodnie z harmonogramem.',
        date: '2024-01-20',
        project: 'Termomodernizacja'
      }
    ],
    stats: {
      projectsCompleted: 234,
      clientSatisfaction: 98,
      repeatClients: 85,
      avgResponseTime: '4h'
    }
  }
};

