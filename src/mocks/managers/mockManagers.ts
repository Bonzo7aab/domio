import { ManagerProfile } from '../../types';
import type { BrowseManager, ManagerFilters } from '../../lib/database/managers';

export const mockManagers: ManagerProfile[] = [
  {
    id: 'manager-1',
    name: 'WSM "Osiedle Parkowe"',
    organizationType: 'wspólnota',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Warszawa',
      district: 'Mokotów',
      coordinates: { lat: 52.1735, lng: 21.0422 }
    },
    contactInfo: {
      phone: '+48 22 123 45 67',
      email: 'zarząd@osiedleparkowe.pl',
      website: 'www.osiedleparkowe.pl',
      address: 'ul. Parkowa 15, 02-515 Warszawa',
      contactPerson: 'Anna Kowalska',
      position: 'Prezes Zarządu'
    },
    businessInfo: {
      nip: '1234567890',
      regon: '123456789',
      yearEstablished: 2018,
      legalForm: 'Wspólnota Mieszkaniowa'
    },
    rating: {
      overall: 4.8,
      reviewsCount: 42,
      categories: {
        paymentTimeliness: 4.9,
        communication: 4.8,
        projectClarity: 4.7,
        professionalism: 4.8
      }
    },
    verification: {
      status: 'verified',
      badges: ['Zweryfikowana wspólnota', 'Terminowe płatności', 'Aktywny zarząd'],
      documents: ['Statut wspólnoty', 'Uchwały zarządu', 'NIP'],
      lastVerified: '2024-01-15'
    },
    managedProperties: {
      buildingsCount: 3,
      unitsCount: 84,
      totalArea: 6720,
      propertyTypes: ['Mieszkania', 'Garaże', 'Lokale usługowe'],
      constructionYears: { min: 2015, max: 2018 },
      averageUnitSize: 80
    },
    services: {
      primaryNeeds: ['Utrzymanie czystości', 'Ochrona', 'Zieleń'],
      frequentServices: ['Malowanie klatek', 'Drobne naprawy', 'Przeglądy techniczne'],
      specialRequirements: ['Praca w weekendy', 'Niski hałas', 'Ekologiczne środki']
    },
    experience: {
      yearsActive: 6,
      publishedJobs: 128,
      completedProjects: 115,
      activeContractors: 8,
      budgetRange: { min: 5000, max: 150000 }
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      managedBuildings: [
        {
          id: 'building-1',
          name: 'Budynek A',
          type: 'Apartamentowiec',
          address: 'ul. Parkowa 15A',
          unitsCount: 32,
          yearBuilt: 2018,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Modernizacja wind', 'Malowanie klatek', 'Wymiana oświetlenia LED']
        },
        {
          id: 'building-2',
          name: 'Budynek B',
          type: 'Apartamentowiec',
          address: 'ul. Parkowa 15B',
          unitsCount: 28,
          yearBuilt: 2017,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Termomodernizacja', 'Remont dachu', 'Wymiana okien w częściach wspólnych']
        }
      ]
    },
    financials: {
      averageProjectBudget: '25,000 zł',
      paymentTerms: ['Przelew 14 dni', 'Płatność etapowa'],
      budgetPreferences: 'Konkurencyjne ceny z gwarancją jakości',
      fundingSources: ['Fundusz remontowy', 'Składki mieszkańców', 'Dotacje']
    },
    requirements: {
      requiredCertificates: ['Ubezpieczenie OC', 'Certyfikaty branżowe'],
      insuranceRequirements: 'OC minimum 500,000 zł',
      preferredPaymentMethods: ['Przelew bankowy', 'Faktura VAT'],
      workingHours: 'Pon-Pt 8:00-17:00, Sobota 9:00-15:00',
      specialRequests: ['Ciche prace po 20:00', 'Informowanie mieszkańców', 'Sprzątanie po robotach']
    },
    reviews: [
      {
        id: 'review-1',
        author: 'Marek Kowalski',
        authorCompany: 'RenoBud',
        rating: 5,
        date: '2024-01-10',
        project: 'Malowanie klatek schodowych',
        comment: 'Profesjonalna współpraca, jasne wytyczne, terminowe płatności. Polecam!',
        helpful: 8,
        projectBudget: '18,000 zł'
      },
      {
        id: 'review-2',
        author: 'Tomasz Nowak',
        authorCompany: 'HydroMaster',
        rating: 5,
        date: '2023-12-20',
        project: 'Naprawa instalacji c.o.',
        comment: 'Bardzo dobrze zorganizowana wspólnota. Szybkie decyzje, brak problemów z płatnościami.',
        helpful: 12,
        projectBudget: '8,500 zł'
      }
    ],
    stats: {
      averageResponseTime: '4 godziny',
      paymentPunctuality: 96,
      projectCompletionRate: 94,
      contractorRetentionRate: 85,
      averageProjectDuration: '2-3 tygodnie'
    },
    preferences: {
      preferredContractorSize: ['Małe firmy', 'Średnie firmy'],
      workSchedulePreference: 'Elastyczny harmonogram',
      communicationStyle: 'Regularne raporty',
      budgetFlexibility: 'Umiarkowana'
    },
    recentActivity: {
      lastJobPosted: '2024-01-18',
      totalJobsThisYear: 24,
      averageJobsPerMonth: 4,
      seasonalActivity: { 'Wiosna': 8, 'Lato': 6, 'Jesień': 7, 'Zima': 3 }
    },
    joinedDate: '2023-02-15',
    lastActive: '2024-01-20'
  },

  {
    id: 'manager-2',
    name: 'Spółdzielnia Mieszkaniowa "Nowa Huta"',
    organizationType: 'spółdzielnia',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Kraków',
      district: 'Nowa Huta',
      coordinates: { lat: 50.0775, lng: 20.0562 }
    },
    contactInfo: {
      phone: '+48 12 987 65 43',
      email: 'administracja@sm-nowahuta.pl',
      website: 'www.sm-nowahuta.krakow.pl',
      address: 'os. Centrum E 1, 31-932 Kraków',
      contactPerson: 'Piotr Wiśniewski',
      position: 'Dyrektor Administracji'
    },
    businessInfo: {
      nip: '9876543210',
      regon: '987654321',
      krs: '0000123456',
      yearEstablished: 1978,
      legalForm: 'Spółdzielnia Mieszkaniowa'
    },
    rating: {
      overall: 4.6,
      reviewsCount: 156,
      categories: {
        paymentTimeliness: 4.8,
        communication: 4.5,
        projectClarity: 4.6,
        professionalism: 4.7
      }
    },
    verification: {
      status: 'verified',
      badges: ['Tradycyjna spółdzielnia', 'Duże doświadczenie', 'Stabilny partner'],
      documents: ['Statut spółdzielni', 'KRS', 'NIP'],
      lastVerified: '2023-11-20'
    },
    managedProperties: {
      buildingsCount: 24,
      unitsCount: 1680,
      totalArea: 105000,
      propertyTypes: ['Mieszkania', 'Lokale użytkowe', 'Garaże', 'Piwnice'],
      constructionYears: { min: 1975, max: 1985 },
      averageUnitSize: 62
    },
    services: {
      primaryNeeds: ['Termomodernizacja', 'Remonty dachów', 'Modernizacja wind'],
      frequentServices: ['Wymiana instalacji', 'Przeglądy techniczne', 'Konserwacja'],
      specialRequirements: ['Duże projekty', 'Przetargi publiczne', 'Zgodność z prawem zamówień']
    },
    experience: {
      yearsActive: 46,
      publishedJobs: 486,
      completedProjects: 445,
      activeContractors: 23,
      budgetRange: { min: 20000, max: 2500000 }
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
      managedBuildings: [
        {
          id: 'building-3',
          name: 'Os. Centrum E 1-10',
          type: 'Bloki mieszkalne',
          address: 'os. Centrum E, Kraków',
          unitsCount: 640,
          yearBuilt: 1978,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Termomodernizacja 2023', 'Wymiana wind', 'Modernizacja kotłowni']
        },
        {
          id: 'building-4',
          name: 'Os. Centrum D 1-8',
          type: 'Bloki mieszkalne',
          address: 'os. Centrum D, Kraków',
          unitsCount: 520,
          yearBuilt: 1980,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Remont dachów', 'Wymiana stolarki okiennej', 'Monitoring']
        }
      ]
    },
    financials: {
      averageProjectBudget: '280,000 zł',
      paymentTerms: ['Przelew 30 dni', 'Płatność etapowa', 'Gwarancje bankowe'],
      budgetPreferences: 'Najkorzystniejsza oferta cenowa',
      fundingSources: ['Fundusz remontowy', 'Kredyty', 'Dotacje UE', 'Składki członków']
    },
    requirements: {
      requiredCertificates: ['Wpis do rejestru', 'Certyfikaty ISO', 'Uprawnienia budowlane'],
      insuranceRequirements: 'OC minimum 2,000,000 zł',
      preferredPaymentMethods: ['Przelew bankowy', 'Faktura VAT', 'Gwarancje'],
      workingHours: 'Pon-Pt 7:00-18:00',
      specialRequests: ['Procedury przetargowe', 'Dokumentacja techniczna', 'Nadzór techniczny']
    },
    reviews: [
      {
        id: 'review-3',
        author: 'Michał Dąbrowski',
        authorCompany: 'MegaBud Konstrukcje',
        rating: 5,
        date: '2023-10-15',
        project: 'Termomodernizacja budynków E1-E5',
        comment: 'Profesjonalne podejście do dużych projektów. Dobrze przygotowane przetargi.',
        helpful: 18,
        projectBudget: '1,800,000 zł'
      },
      {
        id: 'review-4',
        author: 'Robert Zieliński',
        authorCompany: 'ElektroProfi',
        rating: 4,
        date: '2023-09-30',
        project: 'Modernizacja oświetlenia LED',
        comment: 'Sprawna organizacja, choć procedury są czasochłonne. Terminowe płatności.',
        helpful: 14,
        projectBudget: '156,000 zł'
      }
    ],
    stats: {
      averageResponseTime: '2 dni',
      paymentPunctuality: 92,
      projectCompletionRate: 89,
      contractorRetentionRate: 78,
      averageProjectDuration: '3-6 miesięcy'
    },
    preferences: {
      preferredContractorSize: ['Średnie firmy', 'Duże firmy'],
      workSchedulePreference: 'Ścisły harmonogram',
      communicationStyle: 'Formalna korespondencja',
      budgetFlexibility: 'Niska - ścisły budżet'
    },
    recentActivity: {
      lastJobPosted: '2024-01-12',
      totalJobsThisYear: 18,
      averageJobsPerMonth: 3,
      seasonalActivity: { 'Wiosna': 6, 'Lato': 8, 'Jesień': 3, 'Zima': 1 }
    },
    joinedDate: '2022-08-10',
    lastActive: '2024-01-19'
  },

  {
    id: 'manager-3',
    name: 'Zarząd Nieruchomości "Baltic Properties"',
    organizationType: 'zarządca',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Gdańsk',
      district: 'Śródmieście',
      coordinates: { lat: 54.3520, lng: 18.6466 }
    },
    contactInfo: {
      phone: '+48 58 555 12 34',
      email: 'biuro@balticproperties.pl',
      website: 'www.balticproperties.pl',
      address: 'ul. Długa 45, 80-827 Gdańsk',
      contactPerson: 'Katarzyna Nowakowa',
      position: 'Kierownik Zarządzania Nieruchomościami'
    },
    businessInfo: {
      nip: '5432167890',
      regon: '543216789',
      krs: '0000654321',
      yearEstablished: 2015,
      legalForm: 'Spółka z o.o.'
    },
    rating: {
      overall: 4.9,
      reviewsCount: 73,
      categories: {
        paymentTimeliness: 4.9,
        communication: 5.0,
        projectClarity: 4.8,
        professionalism: 4.9
      }
    },
    verification: {
      status: 'verified',
      badges: ['Profesjonalny zarządca', 'Certyfikat RICS', 'Zarządca roku 2023'],
      documents: ['Licencja zarządcy', 'Certyfikat RICS', 'Ubezpieczenie zawodowe'],
      lastVerified: '2024-01-05'
    },
    managedProperties: {
      buildingsCount: 47,
      unitsCount: 856,
      totalArea: 78400,
      propertyTypes: ['Apartamenty premium', 'Biura', 'Lokale komercyjne', 'Garaże'],
      constructionYears: { min: 2010, max: 2023 },
      averageUnitSize: 92
    },
    services: {
      primaryNeeds: ['Facility Management', 'Konserwacja premium', 'Technologie Smart Building'],
      frequentServices: ['Serwis 24/7', 'Monitoring', 'Concierge', 'Cleaning premium'],
      specialRequirements: ['Wysokie standardy', 'Certyfikowane firmy', 'Dyskrecja']
    },
    experience: {
      yearsActive: 9,
      publishedJobs: 267,
      completedProjects: 251,
      activeContractors: 15,
      budgetRange: { min: 15000, max: 500000 }
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
      managedBuildings: [
        {
          id: 'building-5',
          name: 'Baltic Tower',
          type: 'Wieżowiec mieszkalno-biurowy',
          address: 'ul. Długa 45, Gdańsk',
          unitsCount: 156,
          yearBuilt: 2020,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['System BMS', 'Sala fitness', 'Taras widokowy']
        },
        {
          id: 'building-6',
          name: 'Marina Apartments',
          type: 'Kompleks apartamentowy',
          address: 'ul. Nadmorska 12, Gdańsk',
          unitsCount: 98,
          yearBuilt: 2019,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Marina prywatna', 'Spa & Wellness', 'Parking podziemny']
        }
      ]
    },
    financials: {
      averageProjectBudget: '95,000 zł',
      paymentTerms: ['Przelew 7 dni', 'Express 24h dla awarii'],
      budgetPreferences: 'Jakość ponad ceną - premium standard',
      fundingSources: ['Fundusz zarządzania', 'Opłaty właścicieli', 'Inwestycje deweloperskie']
    },
    requirements: {
      requiredCertificates: ['Certyfikaty ISO', 'Licencje branżowe', 'Referencje premium'],
      insuranceRequirements: 'OC minimum 3,000,000 zł + AC',
      preferredPaymentMethods: ['Przelew express', 'Faktoring', 'Karty korporacyjne'],
      workingHours: '24/7 dostępność dla awarii',
      specialRequests: ['Uniformy firmowe', 'Background check', 'NDA']
    },
    reviews: [
      {
        id: 'review-5',
        author: 'Agnieszka Kowalczyk',
        authorCompany: 'ArtMal',
        rating: 5,
        date: '2023-12-05',
        project: 'Dekoracja lobby Baltic Tower',
        comment: 'Najwyższe standardy, profesjonalne briefy, ekspresowe płatności. Premium klient!',
        helpful: 22,
        projectBudget: '45,000 zł'
      },
      {
        id: 'review-6',
        author: 'Łukasz Witkowski',
        authorCompany: 'SolarTech',
        rating: 5,
        date: '2023-11-15',
        project: 'Instalacja PV Marina Apartments',
        comment: 'Świetnie przygotowany projekt, jasne wytyczne techniczne, terminowe płatności.',
        helpful: 16,
        projectBudget: '89,000 zł'
      }
    ],
    stats: {
      averageResponseTime: '2 godziny',
      paymentPunctuality: 98,
      projectCompletionRate: 96,
      contractorRetentionRate: 94,
      averageProjectDuration: '1-2 miesiące'
    },
    preferences: {
      preferredContractorSize: ['Średnie firmy', 'Duże firmy', 'Specjaliści premium'],
      workSchedulePreference: 'Harmonogram dostosowany do mieszkańców',
      communicationStyle: 'Profesjonalne raportowanie',
      budgetFlexibility: 'Wysoka dla jakości'
    },
    recentActivity: {
      lastJobPosted: '2024-01-16',
      totalJobsThisYear: 32,
      averageJobsPerMonth: 5,
      seasonalActivity: { 'Wiosna': 9, 'Lato': 8, 'Jesień': 8, 'Zima': 7 }
    },
    joinedDate: '2023-01-20',
    lastActive: '2024-01-21'
  },

  {
    id: 'manager-4',
    name: 'Administracja Osiedla "Słoneczne Wzgórze"',
    organizationType: 'administracja',
    avatar: '/api/placeholder/150/150',
    location: {
      city: 'Wrocław',
      district: 'Krzyki',
      coordinates: { lat: 51.1079, lng: 17.0385 }
    },
    contactInfo: {
      phone: '+48 71 888 99 00',
      email: 'administracja@slonecznewzgorze.pl',
      website: 'www.slonecznewzgorze.wroclaw.pl',
      address: 'ul. Słoneczna 123, 53-611 Wrocław',
      contactPerson: 'Marcin Kowalczyk',
      position: 'Administrator Osiedla'
    },
    businessInfo: {
      nip: '8765432109',
      regon: '876543210',
      yearEstablished: 2020,
      legalForm: 'Działalność gospodarcza'
    },
    rating: {
      overall: 4.5,
      reviewsCount: 34,
      categories: {
        paymentTimeliness: 4.6,
        communication: 4.4,
        projectClarity: 4.5,
        professionalism: 4.5
      }
    },
    verification: {
      status: 'verified',
      badges: ['Nowe osiedle', 'Proekologiczne podejście', 'Innowacyjne rozwiązania'],
      documents: ['Licencja administratora', 'NIP', 'Umowy zarządzania'],
      lastVerified: '2023-10-15'
    },
    managedProperties: {
      buildingsCount: 8,
      unitsCount: 256,
      totalArea: 20480,
      propertyTypes: ['Apartamenty', 'Domy szeregowe', 'Garaże', 'Plac zabaw'],
      constructionYears: { min: 2020, max: 2023 },
      averageUnitSize: 80
    },
    services: {
      primaryNeeds: ['Zieleń i ogrody', 'Infrastruktura rekreacyjna', 'Systemy inteligentne'],
      frequentServices: ['Konserwacja placów zabaw', 'Pielęgnacja terenów zielonych', 'Oświetlenie LED'],
      specialRequirements: ['Ekologiczne materiały', 'Energia odnawialna', 'Przyjazne dzieciom']
    },
    experience: {
      yearsActive: 4,
      publishedJobs: 67,
      completedProjects: 58,
      activeContractors: 6,
      budgetRange: { min: 8000, max: 120000 }
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      managedBuildings: [
        {
          id: 'building-7',
          name: 'Słoneczne Wzgórze I',
          type: 'Budynki mieszkalne',
          address: 'ul. Słoneczna 123A-D',
          unitsCount: 128,
          yearBuilt: 2021,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Plac zabaw', 'Ścieżki rowerowe', 'Ogrody społeczne']
        },
        {
          id: 'building-8',
          name: 'Słoneczne Wzgórze II',
          type: 'Domy szeregowe',
          address: 'ul. Słoneczna 125-135',
          unitsCount: 64,
          yearBuilt: 2022,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Ogrodzenia', 'Monitoring', 'Ładowarki EV']
        }
      ]
    },
    financials: {
      averageProjectBudget: '35,000 zł',
      paymentTerms: ['Przelew 21 dni', 'Płatność po odbiorze'],
      budgetPreferences: 'Optymalne rozwiązania eco-friendly',
      fundingSources: ['Opłaty administracyjne', 'Fundusz remontowy', 'Dotacje ekologiczne']
    },
    requirements: {
      requiredCertificates: ['Certyfikaty ekologiczne', 'Ubezpieczenie OC'],
      insuranceRequirements: 'OC minimum 1,000,000 zł',
      preferredPaymentMethods: ['Przelew bankowy', 'Faktura VAT'],
      workingHours: 'Pon-Pt 8:00-16:00, dostosowanie do mieszkańców',
      specialRequests: ['Materiały ekologiczne', 'Niski wpływ na środowisko', 'Cicha praca']
    },
    reviews: [
      {
        id: 'review-7',
        author: 'Tomasz Nowak',
        authorCompany: 'HydroMaster',
        rating: 5,
        date: '2023-11-20',
        project: 'Instalacja deszczówki',
        comment: 'Innowacyjne podejście, otwartość na nowe technologie. Przyjemna współpraca.',
        helpful: 9,
        projectBudget: '28,000 zł'
      }
    ],
    stats: {
      averageResponseTime: '6 godzin',
      paymentPunctuality: 88,
      projectCompletionRate: 91,
      contractorRetentionRate: 82,
      averageProjectDuration: '2-4 tygodnie'
    },
    preferences: {
      preferredContractorSize: ['Małe firmy', 'Lokalni specjaliści'],
      workSchedulePreference: 'Elastyczny z uwzględnieniem mieszkańców',
      communicationStyle: 'Bezpośrednia komunikacja',
      budgetFlexibility: 'Umiarkowana'
    },
    recentActivity: {
      lastJobPosted: '2024-01-14',
      totalJobsThisYear: 16,
      averageJobsPerMonth: 3,
      seasonalActivity: { 'Wiosna': 6, 'Lato': 4, 'Jesień': 4, 'Zima': 2 }
    },
    joinedDate: '2023-05-15',
    lastActive: '2024-01-18'
  },

  {
    id: 'manager-5',
    name: 'Echo Investment - Zarządzanie Osiedlami',
    organizationType: 'deweloper',
    avatar: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/800/300',
    location: {
      city: 'Poznań',
      district: 'Grunwald',
      coordinates: { lat: 52.4064, lng: 16.9252 }
    },
    contactInfo: {
      phone: '+48 61 777 88 99',
      email: 'zarzadzanie@echo.com.pl',
      website: 'www.echo-investment.pl',
      address: 'ul. Grunwaldzka 186, 60-166 Poznań',
      contactPerson: 'Magdalena Wiśniewska',
      position: 'Dyrektor Zarządzania Nieruchomościami'
    },
    businessInfo: {
      nip: '7654321098',
      regon: '765432109',
      krs: '0000987654',
      yearEstablished: 1996,
      legalForm: 'Spółka Akcyjna'
    },
    rating: {
      overall: 4.7,
      reviewsCount: 89,
      categories: {
        paymentTimeliness: 4.9,
        communication: 4.6,
        projectClarity: 4.8,
        professionalism: 4.8
      }
    },
    verification: {
      status: 'verified',
      badges: ['Deweloper premium', 'Giełda GPW', 'Międzynarodowe standardy'],
      documents: ['KRS', 'Raporty finansowe', 'Certyfikaty ISO'],
      lastVerified: '2024-01-10'
    },
    managedProperties: {
      buildingsCount: 156,
      unitsCount: 4680,
      totalArea: 390000,
      propertyTypes: ['Mieszkania premium', 'Biura', 'Galerie handlowe', 'Hotele'],
      constructionYears: { min: 2010, max: 2024 },
      averageUnitSize: 83
    },
    services: {
      primaryNeeds: ['Facility Management', 'Property Management', 'Inwestycje deweloperskie'],
      frequentServices: ['Zarządzanie techniczne', 'Obsługa najemców', 'Modernizacje'],
      specialRequirements: ['Standardy międzynarodowe', 'BREEAM/LEED', 'ESG compliance']
    },
    experience: {
      yearsActive: 28,
      publishedJobs: 1247,
      completedProjects: 1156,
      activeContractors: 45,
      budgetRange: { min: 50000, max: 5000000 }
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
      managedBuildings: [
        {
          id: 'building-9',
          name: 'Aura Sky',
          type: 'Wieżowiec mieszkalny',
          address: 'ul. Grunwaldzka 190, Poznań',
          unitsCount: 280,
          yearBuilt: 2023,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Sky lobby', 'System BMS', 'Tarasy zielone']
        },
        {
          id: 'building-10',
          name: 'Echo Park',
          type: 'Kompleks mieszkaniowy',
          address: 'ul. Parkowa 25-45, Poznań',
          unitsCount: 480,
          yearBuilt: 2022,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Park miejski', 'Centrum fitness', 'Coworking']
        }
      ]
    },
    financials: {
      averageProjectBudget: '450,000 zł',
      paymentTerms: ['Przelew 14 dni', 'Faktoring', 'Gwarancje bankowe'],
      budgetPreferences: 'Wysokie standardy wykonania - premium market',
      fundingSources: ['Kapitał własny', 'Kredyty deweloperskie', 'Fundusze inwestycyjne']
    },
    requirements: {
      requiredCertificates: ['ISO 9001', 'ISO 14001', 'Referencje międzynarodowe'],
      insuranceRequirements: 'OC minimum 5,000,000 zł + CAR',
      preferredPaymentMethods: ['Przelew SEPA', 'Faktoring odwrotny', 'L/C'],
      workingHours: '24/7 - międzynarodowe standardy',
      specialRequests: ['Due diligence', 'Compliance ESG', 'Raportowanie korporacyjne']
    },
    reviews: [
      {
        id: 'review-8',
        author: 'Michał Dąbrowski',
        authorCompany: 'MegaBud Konstrukcje',
        rating: 5,
        date: '2023-09-15',
        project: 'Generalny Wykonawca Aura Sky',
        comment: 'Największy i najbardziej wymagający projekt w mojej karierze. Świetna organizacja.',
        helpful: 35,
        projectBudget: '2,400,000 zł'
      },
      {
        id: 'review-9',
        author: 'Robert Zieliński',
        authorCompany: 'ElektroProfi',
        rating: 5,
        date: '2023-08-20',
        project: 'Smart Building Systems',
        comment: 'Zaawansowane technologie, wysokie wymagania, ale sprawiedliwe warunki współpracy.',
        helpful: 28,
        projectBudget: '680,000 zł'
      }
    ],
    stats: {
      averageResponseTime: '24 godziny',
      paymentPunctuality: 94,
      projectCompletionRate: 92,
      contractorRetentionRate: 89,
      averageProjectDuration: '6-18 miesięcy'
    },
    preferences: {
      preferredContractorSize: ['Duże firmy', 'Konsorcja', 'Generalni wykonawcy'],
      workSchedulePreference: 'Harmonogram deweloperski',
      communicationStyle: 'Korporacyjne standardy',
      budgetFlexibility: 'Wysoka dla innowacji'
    },
    recentActivity: {
      lastJobPosted: '2024-01-08',
      totalJobsThisYear: 42,
      averageJobsPerMonth: 7,
      seasonalActivity: { 'Wiosna': 12, 'Lato': 14, 'Jesień': 10, 'Zima': 6 }
    },
    joinedDate: '2022-03-10',
    lastActive: '2024-01-21'
  },

  {
    id: 'manager-6',
    name: 'TBS "Społeczne Mieszkania Lublin"',
    organizationType: 'tbs',
    avatar: '/api/placeholder/150/150',
    location: {
      city: 'Lublin',
      coordinates: { lat: 51.2465, lng: 22.5684 }
    },
    contactInfo: {
      phone: '+48 81 444 55 66',
      email: 'administracja@tbs-lublin.pl',
      website: 'www.tbs-lublin.pl',
      address: 'ul. Społeczna 45, 20-614 Lublin',
      contactPerson: 'Adam Nowicki',
      position: 'Dyrektor TBS'
    },
    businessInfo: {
      nip: '6543210987',
      regon: '654321098',
      krs: '0000456789',
      yearEstablished: 2005,
      legalForm: 'Towarzystwo Budownictwa Społecznego'
    },
    rating: {
      overall: 4.4,
      reviewsCount: 28,
      categories: {
        paymentTimeliness: 4.2,
        communication: 4.3,
        projectClarity: 4.5,
        professionalism: 4.6
      }
    },
    verification: {
      status: 'verified',
      badges: ['TBS certyfikowany', 'Budownictwo społeczne', 'Dotacje publiczne'],
      documents: ['Statut TBS', 'Pozwolenia budowlane', 'Certyfikat energetyczny'],
      lastVerified: '2023-12-01'
    },
    managedProperties: {
      buildingsCount: 12,
      unitsCount: 384,
      totalArea: 23040,
      propertyTypes: ['Mieszkania społeczne', 'Mieszkania chronione', 'Lokale usługowe'],
      constructionYears: { min: 2006, max: 2020 },
      averageUnitSize: 60
    },
    services: {
      primaryNeeds: ['Remonty podstawowe', 'Utrzymanie niedrogie', 'Energia odnawialna'],
      frequentServices: ['Malowanie', 'Drobne naprawy', 'Przeglądy okresowe'],
      specialRequirements: ['Niskie koszty', 'Trwałe rozwiązania', 'Procedury publiczne']
    },
    experience: {
      yearsActive: 19,
      publishedJobs: 156,
      completedProjects: 142,
      activeContractors: 8,
      budgetRange: { min: 5000, max: 180000 }
    },
    portfolio: {
      images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
      managedBuildings: [
        {
          id: 'building-11',
          name: 'TBS Społeczna I',
          type: 'Budynki mieszkalne',
          address: 'ul. Społeczna 45A-F',
          unitsCount: 192,
          yearBuilt: 2010,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Ocieplenie budynków', 'Wymiana okien', 'Plac zabaw']
        },
        {
          id: 'building-12',
          name: 'TBS Społeczna II',
          type: 'Mieszkania chronione',
          address: 'ul. Społeczna 47A-D',
          unitsCount: 96,
          yearBuilt: 2015,
          images: ['/api/placeholder/300/200'],
          recentProjects: ['Instalacja PV', 'Monitoring', 'Ogródki społeczne']
        }
      ]
    },
    financials: {
      averageProjectBudget: '45,000 zł',
      paymentTerms: ['Przelew 30 dni', 'Procedury publiczne'],
      budgetPreferences: 'Najniższa cena przy zachowaniu jakości',
      fundingSources: ['Dotacje wojewódzkie', 'Fundusze europejskie', 'Budżet TBS']
    },
    requirements: {
      requiredCertificates: ['Certyfikaty energetyczne', 'Zgodność z prawem zamówień'],
      insuranceRequirements: 'OC minimum 1,000,000 zł',
      preferredPaymentMethods: ['Przelew bankowy', 'Procedury urzędowe'],
      workingHours: 'Pon-Pt 8:00-16:00',
      specialRequests: ['Procedury przetargowe', 'Dokumentacja szczegółowa', 'Gwarancje rozszerzone']
    },
    reviews: [
      {
        id: 'review-10',
        author: 'Łukasz Witkowski',
        authorCompany: 'SolarTech',
        rating: 5,
        date: '2023-07-15',
        project: 'Instalacja fotowoltaiczna TBS',
        comment: 'Dobrze przygotowany przetarg, jasne wymagania techniczne. Społecznie ważny projekt.',
        helpful: 12,
        projectBudget: '125,000 zł'
      }
    ],
    stats: {
      averageResponseTime: '5 dni',
      paymentPunctuality: 85,
      projectCompletionRate: 87,
      contractorRetentionRate: 72,
      averageProjectDuration: '4-8 tygodni'
    },
    preferences: {
      preferredContractorSize: ['Małe firmy', 'Lokalni wykonawcy'],
      workSchedulePreference: 'Standardowe godziny pracy',
      communicationStyle: 'Formalne procedury',
      budgetFlexibility: 'Bardzo niska - ograniczony budżet'
    },
    recentActivity: {
      lastJobPosted: '2024-01-05',
      totalJobsThisYear: 8,
      averageJobsPerMonth: 1,
      seasonalActivity: { 'Wiosna': 3, 'Lato': 3, 'Jesień': 2, 'Zima': 0 }
    },
    joinedDate: '2023-04-20',
    lastActive: '2024-01-15'
  }
];

const determinePlanType = (rating: number): 'basic' | 'pro' | 'premium' => {
  if (rating >= 4.8) {
    return 'premium';
  }
  if (rating >= 4.6) {
    return 'pro';
  }
  return 'basic';
};

const determineVerificationLevel = (rating: number): string => {
  if (rating >= 4.8) {
    return 'gold';
  }
  if (rating >= 4.6) {
    return 'silver';
  }
  return 'standard';
};

const determineEmployeeCount = (unitsCount: number): string => {
  if (unitsCount > 1500) {
    return '150-200';
  }
  if (unitsCount > 800) {
    return '80-120';
  }
  if (unitsCount > 300) {
    return '30-60';
  }
  return '10-30';
};

const mapManagerToBrowse = (manager: ManagerProfile): BrowseManager => {
  return {
    id: manager.id,
    name: manager.name,
    short_name: manager.name.split(' ')[0],
    city: manager.location.city,
    avatar_url: manager.avatar,
    plan_type: determinePlanType(manager.rating.overall),
    last_active: manager.lastActive,
    is_verified: manager.verification.status === 'verified',
    verification_level: determineVerificationLevel(manager.rating.overall),
    founded_year: manager.businessInfo.yearEstablished,
    employee_count: determineEmployeeCount(manager.managedProperties.unitsCount),
    buildings_count: manager.managedProperties.buildingsCount,
    units_count: manager.managedProperties.unitsCount,
    total_area: manager.managedProperties.totalArea,
    organization_type: manager.organizationType,
    primary_needs: manager.services.primaryNeeds,
    frequent_services: manager.services.frequentServices,
    managed_property_types: manager.managedProperties.propertyTypes,
    years_active: manager.experience.yearsActive,
    published_jobs: manager.experience.publishedJobs,
    completed_projects: manager.experience.completedProjects,
    active_contractors: manager.experience.activeContractors,
    average_response_time: manager.stats.averageResponseTime,
    payment_punctuality: manager.stats.paymentPunctuality,
    project_completion_rate: manager.stats.projectCompletionRate,
    contractor_retention_rate: manager.stats.contractorRetentionRate,
    rating: manager.rating.overall,
    review_count: manager.rating.reviewsCount,
    phone: manager.contactInfo.phone,
    email: manager.contactInfo.email,
    website: manager.contactInfo.website,
    address: manager.contactInfo.address
  };
};

export const mockBrowseManagers: BrowseManager[] = mockManagers.map(mapManagerToBrowse);

export function getMockBrowseManagers(filters: ManagerFilters = {}): BrowseManager[] {
  const {
    city,
    organizationType,
    searchQuery,
    sortBy = 'rating',
    limit,
    offset = 0
  } = filters;

  let results = mockBrowseManagers.slice();

  if (city) {
    const cityQuery = city.toLowerCase();
    results = results.filter(manager => manager.city.toLowerCase() === cityQuery);
  }

  if (organizationType) {
    const organizationQuery = organizationType.toLowerCase();
    results = results.filter(manager => manager.organization_type.toLowerCase() === organizationQuery);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    results = results.filter(manager =>
      manager.name.toLowerCase().includes(query) ||
      manager.primary_needs.some(need => need.toLowerCase().includes(query)) ||
      manager.managed_property_types.some(type => type.toLowerCase().includes(query))
    );
  }

  switch (sortBy) {
    case 'buildings':
      results.sort((a, b) => b.buildings_count - a.buildings_count);
      break;
    case 'units':
      results.sort((a, b) => b.units_count - a.units_count);
      break;
    case 'experience':
      results.sort((a, b) => b.years_active - a.years_active);
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

// Helper functions for working with manager data
export const getManagerById = (id: string): ManagerProfile | undefined => {
  return mockManagers.find(manager => manager.id === id);
};

export const getManagersByCity = (city: string): ManagerProfile[] => {
  return mockManagers.filter(manager => 
    manager.location.city.toLowerCase() === city.toLowerCase()
  );
};

export const getManagersByType = (type: string): ManagerProfile[] => {
  return mockManagers.filter(manager => 
    manager.organizationType === type
  );
};

export const getTopRatedManagers = (limit: number = 5): ManagerProfile[] => {
  return mockManagers
    .sort((a, b) => b.rating.overall - a.rating.overall)
    .slice(0, limit);
};

export const getActiveManagers = (): ManagerProfile[] => {
  return mockManagers.filter(manager => {
    const lastActive = new Date(manager.lastActive);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastActive > weekAgo;
  });
};

export const getVerifiedManagers = (): ManagerProfile[] => {
  return mockManagers.filter(manager => 
    manager.verification.status === 'verified'
  );
};

export const getManagersByPropertyType = (propertyType: string): ManagerProfile[] => {
  return mockManagers.filter(manager =>
    manager.managedProperties.propertyTypes.some(type => 
      type.toLowerCase().includes(propertyType.toLowerCase())
    )
  );
};

export const getManagersByBudgetRange = (minBudget: number, maxBudget: number): ManagerProfile[] => {
  return mockManagers.filter(manager =>
    manager.experience.budgetRange.min <= maxBudget && 
    manager.experience.budgetRange.max >= minBudget
  );
};