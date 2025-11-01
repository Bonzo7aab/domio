export interface ManagerDetailedProfile {
  name: string;
  logo: string;
  coverImage: string;
  slogan: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  managedBuildings: number;
  managedUnits: number;
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
  managedProperties: Array<{
    name: string;
    image: string;
    location: string;
    buildings: number;
    units: number;
    since: string;
  }>;
  team: Array<{
    name: string;
    position: string;
    image: string;
    experience: string;
    license?: string;
  }>;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    date: string;
    property: string;
  }>;
  stats: {
    propertiesManaged: number;
    unitsManaged: number;
    clientRetention: number;
    avgResponseTime: string;
    yearsExperience: number;
  };
  achievements: Array<{
    title: string;
    description: string;
    year: string;
  }>;
}

export const mockManagerDetailsMap: Record<string, ManagerDetailedProfile> = {
  '1': {
    name: 'ProManage Sp. z o.o.',
    logo: 'https://images.unsplash.com/photo-1558203728-00f45181dd84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnQlMjBvZmZpY2V8ZW58MXx8fHwxNTc0MjA2MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    coverImage: 'https://images.unsplash.com/photo-1680919838857-d54e011093d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZyUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzU3NDIxMzY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    slogan: 'Profesjonalne zarządzanie Twoją nieruchomością',
    description: 'ProManage to uznana firma zarządzająca nieruchomościami z 13-letnim doświadczeniem. Świadczymy kompleksowe usługi administracyjne dla wspólnot mieszkaniowych w Warszawie i okolicach.',
    location: 'Warszawa',
    rating: 4.8,
    reviewCount: 234,
    managedBuildings: 45,
    managedUnits: 1240,
    verified: true,
    hasInsurance: true,
    isPremium: true,
    founded: 2010,
    employees: '25-50',
    website: 'www.promanage.pl',
    phone: '+48 22 123 45 67',
    email: 'kontakt@promanage.pl',
    address: 'ul. Zarządzania 10, 00-001 Warszawa',
    specialties: ['Zarządzanie wspólnotami', 'Administracja nieruchomości', 'Obsługa prawna', 'Księgowość wspólnot', 'Nadzór remontów'],
    certificates: [
      'Licencja zarządcy nieruchomości',
      'ISO 9001:2015',
      'Certyfikat księgowy',
      'Ubezpieczenie OC zawodowe'
    ],
    services: [
      {
        name: 'Zarządzanie wspólnotą',
        description: 'Kompleksowe zarządzanie wspólnotą mieszkaniową',
        price: '8-12 zł/lokal/miesiąc'
      },
      {
        name: 'Obsługa prawna',
        description: 'Doradztwo prawne i reprezentacja w sądach',
        price: '300-500 zł/sprawę'
      },
      {
        name: 'Nadzór remontów',
        description: 'Profesjonalny nadzór nad inwestycjami wspólnoty',
        price: '5-8% wartości inwestycji'
      }
    ],
    managedProperties: [
      {
        name: 'Osiedle Zielona Dolina',
        image: 'https://images.unsplash.com/photo-1680919838857-d54e011093d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZyUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzU3NDIxMzY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        location: 'Warszawa, Mokotów',
        buildings: 8,
        units: 324,
        since: '2018'
      },
      {
        name: 'Kompleks Mieszkaniowy "Słoneczny"',
        image: 'https://images.unsplash.com/photo-1692133226337-55e513450a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnQlMjB0ZWFtJTIwb2ZmaWNlfGVufDF8fHx8MTc1NzQyMTM2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        location: 'Warszawa, Wilanów',
        buildings: 12,
        units: 456,
        since: '2020'
      }
    ],
    team: [
      {
        name: 'Katarzyna Wiśniewska',
        position: 'Zarządca nieruchomości',
        image: 'https://images.unsplash.com/photo-1692133226337-55e513450a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnQlMjB0ZWFtJTIwb2ZmaWNlfGVufDF8fHx8MTc1NzQyMTM2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        experience: '18 lat doświadczenia',
        license: 'Licencja nr 12345'
      },
      {
        name: 'Tomasz Kowalczyk',
        position: 'Specjalista ds. technicznych',
        image: 'https://images.unsplash.com/photo-1692133226337-55e513450a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnQlMjB0ZWFtJTIwb2ZmaWNlfGVufDF8fHx8MTc1NzQyMTM2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        experience: '12 lat doświadczenia',
        license: 'Uprawnienia budowlane'
      }
    ],
    reviews: [
      {
        author: 'WSM "Parkowa"',
        rating: 5,
        text: 'Profesjonalne zarządzanie naszą wspólnotą. Wszystkie sprawy załatwiane terminowo i rzetelnie.',
        date: '2024-03-10',
        property: 'Osiedle Zielona Dolina'
      },
      {
        author: 'Spółdzielnia "Nowy Świat"',
        rating: 5,
        text: 'Doskonała obsługa, transparentne rozliczenia i profesjonalna komunikacja.',
        date: '2024-02-28',
        property: 'Kompleks Słoneczny'
      }
    ],
    stats: {
      propertiesManaged: 45,
      unitsManaged: 1240,
      clientRetention: 92,
      avgResponseTime: '1h',
      yearsExperience: 13
    },
    achievements: [
      {
        title: 'Najlepszy Zarządca 2023',
        description: 'Nagroda Stowarzyszenia Zarządców Nieruchomości',
        year: '2023'
      },
      {
        title: 'Certyfikat ISO 9001',
        description: 'System zarządzania jakością',
        year: '2022'
      }
    ]
  }
};

