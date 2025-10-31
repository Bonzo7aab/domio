import { ContractorProfile } from '../../types/contractor';
import type { BrowseContractor, ContractorFilters } from '../../lib/database/contractors';

export const mockContractors: ContractorProfile[] = [
  {
    id: 'contractor-1',
    name: 'Marek Nowak',
    companyName: 'BudMaster Construction',
    companyType: 'sp_z_oo',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Warszawa',
      district: 'Śródmieście',
      coordinates: { lat: 52.2297, lng: 21.0122 }
    },
    contactInfo: {
      phone: '+48 22 345 67 89',
      email: 'kontakt@budmaster.pl',
      website: 'https://www.budmaster.pl',
      address: 'ul. Prosta 45, 00-838 Warszawa'
    },
    businessInfo: {
      nip: '5252728391',
      regon: '381123456',
      krs: '0000789123',
      yearEstablished: 2008,
      employeeCount: '50-100'
    },
    rating: {
      overall: 4.9,
      reviewsCount: 112,
      categories: {
        quality: 4.9,
        timeliness: 4.8,
        communication: 4.9,
        pricing: 4.6
      }
    },
    verification: {
      status: 'verified',
      badges: ['Certyfikowany wykonawca', 'ISO 9001', 'ISO 14001'],
      documents: ['NIP', 'REGON', 'KRS', 'Polisa OC'],
      lastVerified: '2024-01-15'
    },
    services: {
      primary: ['Roboty Remontowo-Budowlane', 'Utrzymanie techniczne i konserwacja'],
      secondary: ['Prace wysokościowe', 'Modernizacje instalacji'],
      specializations: ['Termomodernizacja', 'Remonty elewacji', 'Instalacje BMS']
    },
    experience: {
      yearsInBusiness: 16,
      completedProjects: 245,
      projectTypes: {
        'Termomodernizacja': 120,
        'Remonty elewacji': 80,
        'Modernizacje instalacji': 45
      },
      certifications: ['ISO 9001', 'ISO 14001', 'Uprawnienia budowlane', 'SEP D/E']
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      featuredProjects: [
        {
          id: 'bm-project-1',
          title: 'Termomodernizacja Osiedla Parkowego',
          description: 'Kompleksowa termomodernizacja 4 budynków mieszkalnych.',
          images: ['/api/placeholder/500/300'],
          budget: '1 200 000 zł',
          duration: '6 miesięcy',
          year: 2023,
          category: 'Termomodernizacja'
        },
        {
          id: 'bm-project-2',
          title: 'Modernizacja instalacji BMS',
          description: 'Automatyzacja systemów HVAC i oświetlenia w biurowcu klasy A.',
          images: ['/api/placeholder/500/300'],
          budget: '850 000 zł',
          duration: '4 miesiące',
          year: 2022,
          category: 'Instalacje inteligentne'
        }
      ]
    },
    pricing: {
      hourlyRate: { min: 120, max: 180 },
      projectBased: true,
      negotiable: true,
      paymentTerms: ['Zaliczka 20%', 'Płatność etapowa', 'Faktura VAT 14 dni']
    },
    availability: {
      status: 'ograniczona_dostępność',
      nextAvailable: '2024-02-15',
      workingHours: '7:00-17:00',
      serviceArea: ['Warszawa', 'Piaseczno', 'Pruszków']
    },
    insurance: {
      hasOC: true,
      ocAmount: '2 000 000 zł',
      hasAC: true,
      acAmount: '500 000 zł',
      validUntil: '2024-12-31'
    },
    reviews: [
      {
        id: 'bm-review-1',
        author: 'WSM "Osiedle Parkowe"',
        authorType: 'manager',
        rating: 5,
        date: '2023-11-18',
        project: 'Termomodernizacja budynków A-D',
        comment: 'Świetna organizacja, terminowe wykonanie i pełna dokumentacja powykonawcza.',
        helpful: 18
      },
      {
        id: 'bm-review-2',
        author: 'SM "Nowa Huta"',
        authorType: 'manager',
        rating: 5,
        date: '2023-09-05',
        project: 'Remont elewacji bloków',
        comment: 'Profesjonalna współpraca i znakomita jakość. Płatności zgodnie z harmonogramem.',
        helpful: 21
      }
    ],
    stats: {
      responseTime: '4h',
      onTimeCompletion: 97,
      budgetAccuracy: 92,
      rehireRate: 88
    },
    plan: 'pro',
    joinedDate: '2022-04-01',
    lastActive: '2024-01-21'
  },
  {
    id: 'contractor-2',
    name: 'Ewa Zielińska',
    companyName: 'EcoClean Facility Services',
    companyType: 'spolka_cywilna',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Kraków',
      district: 'Podgórze',
      coordinates: { lat: 50.0647, lng: 19.945 }
    },
    contactInfo: {
      phone: '+48 12 777 33 44',
      email: 'biuro@ecoclean.pl',
      website: 'https://www.ecoclean.pl',
      address: 'ul. Zabłocie 39, 30-701 Kraków'
    },
    businessInfo: {
      nip: '6783124590',
      regon: '382456789',
      yearEstablished: 2014,
      employeeCount: '100-150'
    },
    rating: {
      overall: 4.7,
      reviewsCount: 76,
      categories: {
        quality: 4.6,
        timeliness: 4.8,
        communication: 4.7,
        pricing: 4.5
      }
    },
    verification: {
      status: 'verified',
      badges: ['ISO 14001', 'Eco-friendly'],
      documents: ['Certyfikat ISO 14001', 'Lista środków biodegradowalnych'],
      lastVerified: '2023-12-10'
    },
    services: {
      primary: ['Utrzymanie Czystości i Zieleni', 'Specjalistyczne usługi'],
      secondary: ['Serwis porządkowy 24/7', 'Usługi odśnieżania'],
      specializations: ['Zieleń miejska', 'Sprzątanie poremontowe', 'Usługi wysokościowe']
    },
    experience: {
      yearsInBusiness: 10,
      completedProjects: 320,
      projectTypes: {
        'Stała obsługa wspólnot': 180,
        'Zieleń i ogrody': 90,
        'Sprzątanie specjalistyczne': 50
      },
      certifications: ['ISO 14001', 'OHSAS 18001', 'Uprawnienia arborystyczne']
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
      featuredProjects: [
        {
          id: 'ec-project-1',
          title: 'Kompleksowa obsługa osiedla premium',
          description: 'Stała obsługa utrzymania czystości i zieleni osiedla premium w Krakowie.',
          images: ['/api/placeholder/500/300'],
          budget: '35 000 zł miesięcznie',
          duration: 'Stała współpraca',
          year: 2024,
          category: 'Facility management'
        }
      ]
    },
    pricing: {
      hourlyRate: { min: 75, max: 120 },
      projectBased: true,
      negotiable: true,
      paymentTerms: ['Płatność miesięczna', 'Faktura VAT 14 dni']
    },
    availability: {
      status: 'dostępny',
      nextAvailable: '2024-01-28',
      workingHours: '6:00-22:00',
      serviceArea: ['Kraków', 'Wieliczka', 'Skawina']
    },
    insurance: {
      hasOC: true,
      ocAmount: '1 500 000 zł',
      hasAC: false,
      acAmount: '0',
      validUntil: '2024-09-30'
    },
    reviews: [
      {
        id: 'ec-review-1',
        author: 'Administracja "Słoneczne Wzgórze"',
        authorType: 'manager',
        rating: 5,
        date: '2023-10-02',
        project: 'Stała obsługa osiedla',
        comment: 'Zespół zawsze punktualny, elastyczny i proaktywny. Zieleń wygląda znakomicie.',
        helpful: 14
      },
      {
        id: 'ec-review-2',
        author: 'Baltic Properties',
        authorType: 'manager',
        rating: 4,
        date: '2023-08-18',
        project: 'Sprzątanie po remoncie',
        comment: 'Dobra jakość usług, szybka reakcja na zgłoszenia.',
        helpful: 9
      }
    ],
    stats: {
      responseTime: '6h',
      onTimeCompletion: 93,
      budgetAccuracy: 90,
      rehireRate: 84
    },
    plan: 'basic',
    joinedDate: '2021-05-12',
    lastActive: '2024-01-19'
  },
  {
    id: 'contractor-3',
    name: 'Tomasz Lewandowski',
    companyName: 'HydroTech Instalacje',
    companyType: 'sp_z_oo',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Gdańsk',
      district: 'Wrzeszcz',
      coordinates: { lat: 54.3722, lng: 18.6383 }
    },
    contactInfo: {
      phone: '+48 58 600 44 77',
      email: 'kontakt@hydrotech.pl',
      website: 'https://www.hydrotech.pl',
      address: 'ul. Grunwaldzka 182, 80-266 Gdańsk'
    },
    businessInfo: {
      nip: '9571002345',
      regon: '220987654',
      krs: '0000456123',
      yearEstablished: 2012,
      employeeCount: '20-40'
    },
    rating: {
      overall: 4.8,
      reviewsCount: 58,
      categories: {
        quality: 4.9,
        timeliness: 4.7,
        communication: 4.8,
        pricing: 4.4
      }
    },
    verification: {
      status: 'verified',
      badges: ['SEP D/E', 'Certyfikat F-gazowy'],
      documents: ['Uprawnienia SEP', 'Certyfikat F-gazowy', 'Polisa OC'],
      lastVerified: '2024-01-04'
    },
    services: {
      primary: ['Instalacje i systemy', 'Utrzymanie techniczne i konserwacja'],
      secondary: ['Serwis awaryjny 24/7', 'Monitoring instalacji'],
      specializations: ['Instalacje hydrauliczne', 'Instalacje c.o. i c.w.u.', 'Systemy przeciwpożarowe']
    },
    experience: {
      yearsInBusiness: 12,
      completedProjects: 168,
      projectTypes: {
        'Modernizacje instalacji': 80,
        'Serwis instalacji': 60,
        'Awarie krytyczne': 28
      },
      certifications: ['SEP D/E', 'Certyfikat F-gazowy', 'Uprawnienia UDT']
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      featuredProjects: [
        {
          id: 'ht-project-1',
          title: 'Modernizacja instalacji c.o.',
          description: 'Wymiana pionów i montaż inteligentnego sterowania w budynku z 1970 r.',
          images: ['/api/placeholder/500/300'],
          budget: '420 000 zł',
          duration: '3 miesiące',
          year: 2023,
          category: 'Instalacje grzewcze'
        }
      ]
    },
    pricing: {
      hourlyRate: { min: 140, max: 210 },
      projectBased: true,
      negotiable: true,
      paymentTerms: ['Zaliczka 30%', 'Płatność po etapie', 'Faktura VAT 14 dni']
    },
    availability: {
      status: 'ograniczona_dostępność',
      nextAvailable: '2024-02-05',
      workingHours: '7:00-18:00',
      serviceArea: ['Gdańsk', 'Sopot', 'Gdynia']
    },
    insurance: {
      hasOC: true,
      ocAmount: '1 800 000 zł',
      hasAC: true,
      acAmount: '300 000 zł',
      validUntil: '2024-11-30'
    },
    reviews: [
      {
        id: 'ht-review-1',
        author: 'Zarząd "Baltic Properties"',
        authorType: 'manager',
        rating: 5,
        date: '2023-12-12',
        project: 'Modernizacja kotłowni',
        comment: 'Zaawansowana modernizacja zrealizowana perfekcyjnie. Pełna dokumentacja techniczna.',
        helpful: 11
      },
      {
        id: 'ht-review-2',
        author: 'TBS "Społeczne Mieszkania"',
        authorType: 'manager',
        rating: 4,
        date: '2023-07-08',
        project: 'Instalacja solarna',
        comment: 'Profesjonalna ekipa, elastyczne podejście do harmonogramu mieszkańców.',
        helpful: 7
      }
    ],
    stats: {
      responseTime: '3h',
      onTimeCompletion: 95,
      budgetAccuracy: 91,
      rehireRate: 87
    },
    plan: 'pro',
    joinedDate: '2021-09-01',
    lastActive: '2024-01-20'
  },
  {
    id: 'contractor-4',
    name: 'Aleksandra Wójcik',
    companyName: 'GreenVision Landscaping',
    companyType: 'jednoosobowa',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Wrocław',
      district: 'Krzyki',
      coordinates: { lat: 51.1079, lng: 17.0385 }
    },
    contactInfo: {
      phone: '+48 71 900 55 11',
      email: 'kontakt@greenvision.pl',
      website: 'https://www.greenvision.pl',
      address: 'ul. Zielona 12, 53-011 Wrocław'
    },
    businessInfo: {
      nip: '8992567410',
      regon: '384567123',
      yearEstablished: 2018,
      employeeCount: '10-15'
    },
    rating: {
      overall: 4.6,
      reviewsCount: 34,
      categories: {
        quality: 4.7,
        timeliness: 4.4,
        communication: 4.6,
        pricing: 4.3
      }
    },
    verification: {
      status: 'verified',
      badges: ['Certyfikat arborystyczny', 'Program 3R'],
      documents: ['Certyfikat arborysty', 'Polisa OC'],
      lastVerified: '2023-09-28'
    },
    services: {
      primary: ['Specjalistyczne usługi', 'Utrzymanie Czystości i Zieleni'],
      secondary: ['Zielone dachy', 'Mała architektura'],
      specializations: ['Projektowanie zieleni', 'Systemy nawadniające', 'Zrównoważone ogrody']
    },
    experience: {
      yearsInBusiness: 6,
      completedProjects: 96,
      projectTypes: {
        'Zieleń osiedlowa': 60,
        'Zielone dachy': 20,
        'Ogrody sensoryczne': 16
      },
      certifications: ['Certyfikat arborysty', 'Certyfikat projektanta zieleni miejskiej']
    },
    portfolio: {
      images: ['/api/placeholder/400/300'],
      featuredProjects: [
        {
          id: 'gv-project-1',
          title: 'Ogród społeczny na osiedlu Słoneczne Wzgórze',
          description: 'Projekt i realizacja ogrodu społecznego wraz z systemem nawadniającym.',
          images: ['/api/placeholder/500/300'],
          budget: '180 000 zł',
          duration: '2 miesiące',
          year: 2023,
          category: 'Zieleń i ogrody'
        }
      ]
    },
    pricing: {
      hourlyRate: { min: 90, max: 140 },
      projectBased: true,
      negotiable: true,
      paymentTerms: ['Zaliczka 30%', 'Płatność po odbiorze', 'Faktura VAT 7 dni']
    },
    availability: {
      status: 'dostępny',
      nextAvailable: '2024-02-01',
      workingHours: '7:00-16:00',
      serviceArea: ['Wrocław', 'Świdnica', 'Oleśnica']
    },
    insurance: {
      hasOC: true,
      ocAmount: '500 000 zł',
      hasAC: false,
      acAmount: '0',
      validUntil: '2024-07-31'
    },
    reviews: [
      {
        id: 'gv-review-1',
        author: 'Administracja "Słoneczne Wzgórze"',
        authorType: 'manager',
        rating: 5,
        date: '2023-05-15',
        project: 'Ogród społeczny',
        comment: 'Rewelacyjny projekt, świetna współpraca z mieszkańcami i edukacyjne warsztaty.',
        helpful: 10
      }
    ],
    stats: {
      responseTime: '8h',
      onTimeCompletion: 92,
      budgetAccuracy: 88,
      rehireRate: 79
    },
    plan: 'basic',
    joinedDate: '2022-02-18',
    lastActive: '2024-01-17'
  },
  {
    id: 'contractor-5',
    name: 'Piotr Kamiński',
    companyName: 'SafeBuild Renovations',
    companyType: 'sp_z_oo',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Poznań',
      district: 'Jeżyce',
      coordinates: { lat: 52.4064, lng: 16.9252 }
    },
    contactInfo: {
      phone: '+48 61 880 77 33',
      email: 'kontakt@safebuild.pl',
      website: 'https://www.safebuild.pl',
      address: 'ul. Kraszewskiego 10, 60-515 Poznań'
    },
    businessInfo: {
      nip: '7812569871',
      regon: '301234567',
      krs: '0000667788',
      yearEstablished: 2010,
      employeeCount: '40-60'
    },
    rating: {
      overall: 4.5,
      reviewsCount: 64,
      categories: {
        quality: 4.6,
        timeliness: 4.4,
        communication: 4.4,
        pricing: 4.2
      }
    },
    verification: {
      status: 'verified',
      badges: ['Generalny wykonawca', 'BREEAM partner'],
      documents: ['KRS', 'Referencje inwestorskie', 'Polisa OC'],
      lastVerified: '2023-11-22'
    },
    services: {
      primary: ['Roboty Remontowo-Budowlane', 'Specjalistyczne usługi'],
      secondary: ['Generalne wykonawstwo', 'Modernizacje pod klucz'],
      specializations: ['Renowacje zabytków', 'Przebudowy wnętrz', 'Adaptacje komercyjne']
    },
    experience: {
      yearsInBusiness: 14,
      completedProjects: 210,
      projectTypes: {
        'Renowacje zabytków': 40,
        'Adaptacje wnętrz': 120,
        'Modernizacje klatek': 50
      },
      certifications: ['ISO 9001', 'BREEAM Associate', 'Uprawnienia konserwatorskie']
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      featuredProjects: [
        {
          id: 'sb-project-1',
          title: 'Renowacja kamienicy przy ul. Św. Marcin',
          description: 'Modernizacja instalacji, elewacji i klatek schodowych z zachowaniem detali zabytkowych.',
          images: ['/api/placeholder/500/300'],
          budget: '2 400 000 zł',
          duration: '8 miesięcy',
          year: 2022,
          category: 'Renowacje'
        }
      ]
    },
    pricing: {
      hourlyRate: { min: 130, max: 190 },
      projectBased: true,
      negotiable: true,
      paymentTerms: ['Zaliczka 15%', 'Płatność etapowa', 'Faktura VAT 21 dni']
    },
    availability: {
      status: 'zajęty',
      nextAvailable: '2024-03-10',
      workingHours: '7:00-19:00',
      serviceArea: ['Poznań', 'Gniezno', 'Konin']
    },
    insurance: {
      hasOC: true,
      ocAmount: '3 000 000 zł',
      hasAC: true,
      acAmount: '700 000 zł',
      validUntil: '2025-01-15'
    },
    reviews: [
      {
        id: 'sb-review-1',
        author: 'Echo Investment',
        authorType: 'manager',
        rating: 5,
        date: '2023-09-30',
        project: 'Modernizacja biur klasy A',
        comment: 'Wysoki standard wykonania i pełna współpraca z inwestorem.',
        helpful: 16
      },
      {
        id: 'sb-review-2',
        author: 'SM "Nowy Dom"',
        authorType: 'manager',
        rating: 4,
        date: '2023-06-12',
        project: 'Remont klatek schodowych',
        comment: 'Solidna realizacja, drobne korekty harmonogramu na naszą prośbę.',
        helpful: 6
      }
    ],
    stats: {
      responseTime: '12h',
      onTimeCompletion: 89,
      budgetAccuracy: 86,
      rehireRate: 81
    },
    plan: 'pro',
    joinedDate: '2020-11-05',
    lastActive: '2024-01-18'
  },
  {
    id: 'contractor-6',
    name: 'Karolina Piątek',
    companyName: 'SkyGuard Security & Maintenance',
    companyType: 'spolka_akcyjna',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Katowice',
      district: 'Śródmieście',
      coordinates: { lat: 50.2649, lng: 19.0238 }
    },
    contactInfo: {
      phone: '+48 32 880 12 12',
      email: 'info@skyguard.pl',
      website: 'https://www.skyguard.pl',
      address: 'ul. Chorzowska 25, 40-101 Katowice'
    },
    businessInfo: {
      nip: '6342910456',
      regon: '277654321',
      krs: '0000876543',
      yearEstablished: 2005,
      employeeCount: '150-200'
    },
    rating: {
      overall: 4.4,
      reviewsCount: 52,
      categories: {
        quality: 4.5,
        timeliness: 4.3,
        communication: 4.4,
        pricing: 4.1
      }
    },
    verification: {
      status: 'verified',
      badges: ['Licencjonowana ochrona', '24/7 monitoring'],
      documents: ['Licencja MSWiA', 'Certyfikat ISO 27001', 'Polisa OC'],
      lastVerified: '2023-10-18'
    },
    services: {
      primary: ['Utrzymanie techniczne i konserwacja', 'Specjalistyczne usługi'],
      secondary: ['Ochrona fizyczna', 'Monitoring wizyjny', 'Pogotowie techniczne'],
      specializations: ['Systemy zabezpieczeń', 'Kontrola dostępu', 'Monitoring 24/7']
    },
    experience: {
      yearsInBusiness: 19,
      completedProjects: 410,
      projectTypes: {
        'Stała ochrona obiektów': 250,
        'Modernizacje systemów': 90,
        'Serwis awaryjny': 70
      },
      certifications: ['Licencja MSWiA', 'ISO 27001', 'Certyfikat CCTV']
    },
    portfolio: {
      images: ['/api/placeholder/400/300'],
      featuredProjects: [
        {
          id: 'sg-project-1',
          title: 'System kontroli dostępu dla kompleksu mieszkalnego',
          description: 'Instalacja nowoczesnego systemu kontroli dostępu i monitoringu w osiedlu 12 budynków.',
          images: ['/api/placeholder/500/300'],
          budget: '980 000 zł',
          duration: '5 miesięcy',
          year: 2023,
          category: 'Systemy bezpieczeństwa'
        }
      ]
    },
    pricing: {
      hourlyRate: { min: 110, max: 170 },
      projectBased: true,
      negotiable: true,
      paymentTerms: ['Płatność miesięczna', 'Faktura VAT 30 dni', 'Gwarancja bankowa']
    },
    availability: {
      status: 'dostępny',
      nextAvailable: '2024-02-12',
      workingHours: '24/7',
      serviceArea: ['Katowice', 'Gliwice', 'Tychy', 'Sosnowiec']
    },
    insurance: {
      hasOC: true,
      ocAmount: '5 000 000 zł',
      hasAC: true,
      acAmount: '1 000 000 zł',
      validUntil: '2024-08-31'
    },
    reviews: [
      {
        id: 'sg-review-1',
        author: 'TBS "Dom Śląski"',
        authorType: 'manager',
        rating: 4,
        date: '2023-09-22',
        project: 'Modernizacja systemu monitoringu',
        comment: 'Sprawna realizacja, szybki serwis gwarancyjny. Koszty zgodne z ofertą.',
        helpful: 8
      }
    ],
    stats: {
      responseTime: '2h',
      onTimeCompletion: 90,
      budgetAccuracy: 85,
      rehireRate: 76
    },
    plan: 'basic',
    joinedDate: '2021-03-14',
    lastActive: '2024-01-18'
  }
];

const mapContractorToBrowse = (contractor: ContractorProfile): BrowseContractor => {
  const hourlyRateMin = contractor.pricing.hourlyRate?.min ?? 0;
  const hourlyRateMax = contractor.pricing.hourlyRate?.max ?? 0;

  return {
    id: contractor.id,
    name: contractor.companyName,
    short_name: contractor.companyName.split(' ')[0],
    city: contractor.location.city,
    avatar_url: contractor.avatar,
    plan_type: contractor.plan === 'pro' ? 'pro' : 'basic',
    last_active: contractor.lastActive,
    is_verified: contractor.verification.status === 'verified',
    verification_level: contractor.verification.badges[0] || 'standard',
    founded_year: contractor.businessInfo.yearEstablished,
    employee_count: contractor.businessInfo.employeeCount,
    primary_services: contractor.services.primary,
    specializations: contractor.services.specializations,
    service_area: contractor.availability.serviceArea,
    working_hours: contractor.availability.workingHours,
    availability_status: contractor.availability.status,
    next_available: contractor.availability.nextAvailable || new Date().toISOString(),
    years_in_business: contractor.experience.yearsInBusiness,
    completed_projects: contractor.experience.completedProjects,
    certifications: contractor.experience.certifications,
    hourly_rate_min: hourlyRateMin ? `${hourlyRateMin}` : '0',
    hourly_rate_max: hourlyRateMax ? `${hourlyRateMax}` : '0',
    price_range: contractor.pricing.hourlyRate ? `${hourlyRateMin}-${hourlyRateMax} PLN/h` : 'Wycena indywidualna',
    has_oc: contractor.insurance.hasOC,
    has_ac: contractor.insurance.hasAC,
    oc_amount: contractor.insurance.ocAmount || '0',
    ac_amount: contractor.insurance.acAmount || '0',
    response_time: contractor.stats.responseTime,
    on_time_completion: contractor.stats.onTimeCompletion,
    budget_accuracy: contractor.stats.budgetAccuracy,
    rehire_rate: contractor.stats.rehireRate,
    rating: contractor.rating.overall,
    review_count: contractor.rating.reviewsCount
  };
};

export const mockBrowseContractors: BrowseContractor[] = mockContractors.map(mapContractorToBrowse);

export function getMockContractorById(id: string): ContractorProfile | undefined {
  return mockContractors.find(contractor => contractor.id === id);
}

export function getMockBrowseContractors(filters: ContractorFilters = {}): BrowseContractor[] {
  const {
    city,
    category,
    searchQuery,
    sortBy = 'rating',
    limit,
    offset = 0
  } = filters;

  let results = mockBrowseContractors.slice();

  if (city) {
    const cityQuery = city.toLowerCase();
    results = results.filter(contractor => contractor.city.toLowerCase() === cityQuery);
  }

  if (category) {
    const categoryQuery = category.toLowerCase();
    results = results.filter(contractor =>
      contractor.primary_services.some(service => service.toLowerCase().includes(categoryQuery)) ||
      contractor.specializations.some(spec => spec.toLowerCase().includes(categoryQuery))
    );
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    results = results.filter(contractor =>
      contractor.name.toLowerCase().includes(query) ||
      contractor.primary_services.some(service => service.toLowerCase().includes(query)) ||
      contractor.specializations.some(spec => spec.toLowerCase().includes(query)) ||
      contractor.service_area.some(area => area.toLowerCase().includes(query))
    );
  }

  switch (sortBy) {
    case 'jobs':
      results.sort((a, b) => b.completed_projects - a.completed_projects);
      break;
    case 'reviews':
      results.sort((a, b) => b.review_count - a.review_count);
      break;
    case 'name':
      results.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'rating':
    default:
      results.sort((a, b) => b.rating - a.rating);
      break;
  }

  const start = offset;
  const end = limit ? start + limit : undefined;
  return results.slice(start, end);
}

