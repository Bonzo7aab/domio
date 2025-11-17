import type { Budget } from '../../types/budget';

export interface JobMock {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities?: string[];
  skills: string[];
  postedTime: string;
  applications: number;
  rating: number;
  verified: boolean;
  urgent: boolean;
  category: string;
  subcategory: string;
  clientType: string;
  isPremium: boolean;
  hasInsurance: boolean;
  completedJobs: number;
  certificates: string[];
  deadline: string;
  budget: Budget | string; // Support both Budget object and string for backward compatibility
  projectDuration: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  managementCompany?: string;
  managementContact?: string;
  managementPhone?: string;
  managementEmail?: string;
  buildingType: string;
  buildingYear: number;
  surface: string;
  additionalInfo: string;
  companyLogo?: string;
}

export const jobListMockData: JobMock[] = [
  {
    id: '1',
    title: 'Sprzątanie klatek schodowych',
    company: 'Wspólnota Mieszkaniowa "Słoneczna"',
    location: 'Warszawa',
    type: 'Stały zleceniodawca',
    salary: '45-60 zł/h',
    description: 'Poszukujemy rzetelnej firmy sprzątającej do regularnego utrzymania czystości w klatkach schodowych budynków mieszkalnych. Zlecenie obejmuje mycie podłóg, schodów, okien oraz odkurzanie.',
    requirements: [
      'Minimum 2 lata doświadczenia w sprzątaniu budynków mieszkalnych',
      'Własne środki czystości i sprzęt',
      'Ubezpieczenie OC minimum 100 000 zł',
      'Dostępność 3 razy w tygodniu'
    ],
    responsibilities: [
      'Mycie i odkurzanie klatek schodowych (5 kondygnacji)',
      'Czyszczenie okien na klatkach',
      'Wymiana worków na śmieci',
      'Mycie wejścia głównego i drzwi'
    ],
    skills: ['Wspólnota 124 mieszkania', 'Budynek z windą', 'Parking podziemny', 'Ochrona 24h'],
    postedTime: '2 godziny temu',
    applications: 12,
    rating: 4.8,
    verified: true,
    urgent: false,
    category: 'Utrzymanie Czystości i Zieleni',
    subcategory: 'Sprzątanie części wspólnych',
    clientType: 'Wspólnota Mieszkaniowa',
    isPremium: false,
    hasInsurance: true,
    completedJobs: 23,
    certificates: ['ISO 9001', 'Certyfikat DDD'],
    deadline: 'Rozpoczęcie do 2 tygodni',
    budget: '2500-3000 zł/miesiąc',
    projectDuration: 'Umowa na 12 miesięcy',
    contactPerson: 'Anna Kowalska - Przewodnicząca Zarządu',
    contactPhone: '+48 123 456 789',
    contactEmail: 'zarzad@sloneczna.pl',
    managementCompany: 'ProManage Sp. z o.o.',
    managementContact: 'Tomasz Nowak - Zarządca',
    managementPhone: '+48 22 987 65 43',
    managementEmail: 'kontakt@promanage.pl',
    buildingType: 'Budynek mieszkalny wielorodzinny',
    buildingYear: 1985,
    surface: '250 m² powierzchni do sprzątania',
    additionalInfo: 'Budynek po termomodernizacji, nowoczesne klatki schodowe. Parking podziemny wymaga dodatkowych uzgodnień.',
    companyLogo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMHNlcnZpY2V8ZW58MXx8fHwxNzU3MzgzNDcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: '2',
    title: 'Remont elewacji budynku',
    company: 'Wspólnota Mieszkaniowa ul. Parkowa 24',
    location: 'Kraków',
    type: 'Jednorazowe zlecenie',
    salary: '80-120 zł/m²',
    description: 'Zlecenie na kompleksowy remont elewacji 4-piętrowego budynku mieszkalnego. Wymaga oczyszczenia, gruntowania, malowania oraz naprawy drobnych uszkodzeń. Powierzchnia do remontu: ok. 800m².',
    requirements: [
      'Minimum 5 lat doświadczenia w remontach elewacji',
      'Uprawnienia do prac wysokościowych',
      'Własne rusztowania i sprzęt',
      'Ubezpieczenie OC minimum 500 000 zł',
      'Referencje z podobnych projektów'
    ],
    responsibilities: [
      'Montaż i demontaż rusztowań',
      'Oczyszczenie elewacji metodą piaskowania lub wysokociśnieniową',
      'Naprawa pęknięć i ubytków w tynku',
      'Gruntowanie powierzchni',
      'Malowanie farbą elewacyjną w kolorze ustalonym z zarządem',
      'Sprzątanie placu budowy'
    ],
    skills: ['Prace wysokościowe', 'Rusztowania', 'Farby elewacyjne', 'Doświadczenie minimum 3 lata'],
    postedTime: '4 godziny temu',
    applications: 8,
    rating: 4.6,
    verified: true,
    urgent: true,
    category: 'Roboty Remontowo-Budowlane',
    subcategory: 'Remonty dachów i elewacji',
    clientType: 'Wspólnota Mieszkaniowa',
    isPremium: false,
    hasInsurance: true,
    completedJobs: 89,
    certificates: ['Certyfikat budowlany'],
    deadline: 'Do końca września 2024',
    budget: '64 000 - 96 000 zł',
    projectDuration: '3-4 tygodnie',
    contactPerson: 'Marek Nowak - Zarządca',
    contactPhone: '+48 987 654 321',
    contactEmail: 'zarzad@parkowa24.pl',
    managementCompany: 'Administracja Parkowa Sp. z o.o.',
    managementContact: 'Marek Nowak - Główny Zarządca',
    managementPhone: '+48 987 654 321',
    managementEmail: 'zarzad@parkowa24.pl',
    buildingType: 'Budynek mieszkalny z lat 70-tych',
    buildingYear: 1975,
    surface: '800 m² elewacji',
    additionalInfo: 'Budynek wymaga szczególnej uwagi przy malowaniu - lokalizacja przy ruchliwej ulicy. Konieczne zabezpieczenie parkingu.',
    companyLogo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMHJlbm92YXRpb258ZW58MXx8fHwxNzU3NDA0MDM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: '3',
    title: 'Serwis instalacji elektrycznej',
    company: 'Spółdzielnia Mieszkaniowa "MEGA"',
    location: 'Gdańsk',
    type: 'Serwis stały',
    salary: '90-130 zł/h',
    description: 'Poszukujemy elektryka do stałej współpracy przy serwisie instalacji elektrycznych w budynkach mieszkalnych. Zakres prac: konserwacja, naprawy awarii, wymiana opraw oświetleniowych w częściach wspólnych.',
    requirements: ['Uprawnienia SEP', 'Doświadczenie w budownictwie', 'Dostępność interwencyjna', 'Własne narzędzia'],
    skills: ['Spółdzielnia 340 mieszkań', 'Budynek 5 kondygnacji', 'Nowoczesne instalacje', 'Klatki schodowe'],
    postedTime: '6 godzin temu',
    applications: 15,
    rating: 4.9,
    verified: true,
    urgent: false,
    category: 'Instalacje i systemy',
    subcategory: 'Serwis instalacji elektrycznych',
    clientType: 'Spółdzielnia Mieszkaniowa',
    isPremium: true,
    hasInsurance: true,
    completedJobs: 45,
    certificates: ['Uprawnienia SEP', 'Certyfikat jakości ISO'],
    deadline: 'Rozpoczęcie w ciągu 1 tygodnia',
    budget: '90-130 zł/h + koszty materiałów',
    projectDuration: 'Umowa serwisowa na 24 miesiące',
    contactPerson: 'Marek Kowalczyk - Prezes Zarządu',
    contactPhone: '+48 58 321 65 47',
    contactEmail: 'zarzad@mega-gdansk.pl',
    managementCompany: 'Zarządca Nieruchomości MEGA',
    managementContact: 'Piotr Zieliński - Zarządca',
    managementPhone: '+48 58 987 32 11',
    managementEmail: 'p.zielinski@mega.pl',
    buildingType: 'Kompleks budynków mieszkalnych',
    buildingYear: 1992,
    surface: '5 budynków, 340 mieszkań',
    additionalInfo: 'Instalacje elektryczne w częściach wspólnych wymagają stałego nadzoru. Dostęp do pomieszczeń technicznych 24/7.'
  },
  {
    id: '4',
    title: 'Przegląd techniczny budynku',
    company: 'Wspólnota Mieszkaniowa "Zielony Zakątek"',
    location: 'Wrocław',
    type: 'Jednorazowe zlecenie',
    salary: '1500-2500 zł',
    description: 'Zlecenie na wykonanie rocznego przeglądu technicznego budynku mieszkalnego według rozporządzenia o warunkach technicznych. Konieczne uprawnienia budowlane i doświadczenie w ocenie stanu technicznego.',
    requirements: ['Uprawnienia budowlane', 'Znajomość przepisów', 'Doświadczenie minimum 5 lat', 'Ubezpieczenie zawodowe'],
    responsibilities: [
      'Ocena stanu technicznego konstrukcji budynku',
      'Sprawdzenie instalacji wodno-kanalizacyjnej',
      'Kontrola instalacji elektrycznej i gazowej',
      'Przegląd stanu pokrycia dachowego',
      'Sporządzenie szczegółowego protokołu z przeglądu'
    ],
    skills: ['Wspólnota 89 mieszkań', 'Budynek z 1975r', 'Klatki schodowe 4', 'Parking zewnętrzny'],
    postedTime: '1 dzień temu',
    applications: 23,
    rating: 4.4,
    verified: false,
    urgent: false,
    category: 'Utrzymanie techniczne i konserwacja',
    subcategory: 'Przeglądy techniczne budynków',
    clientType: 'Wspólnota Mieszkaniowa',
    isPremium: false,
    hasInsurance: false,
    completedJobs: 12,
    certificates: [],
    deadline: 'Do końca miesiąca',
    budget: '2000-2500 zł',
    projectDuration: 'Jednorazowy przegląd',
    contactPerson: 'Agnieszka Nowak - Przewodnicząca',
    contactPhone: '+48 12 456 78 90',
    contactEmail: 'kontakt@zielonyzakatek.pl',
    buildingType: 'Budynek mieszkalny 4-kondygnacyjny',
    buildingYear: 1978,
    surface: '2400 m² powierzchni użytkowej',
    additionalInfo: 'Budynek wymaga kompleksowego przeglądu technicznego przed planowanym remontem dachu.'
  },
  {
    id: '5',
    title: 'Deratyzacja i dezynsekcja',
    company: 'Wspólnota Mieszkaniowa "Osiedle Słoneczne"',
    location: 'Poznań',
    type: 'Zlecenie okresowe',
    salary: '200-350 zł za budynek',
    description: 'Poszukujemy specjalistycznej firmy do wykonywania zabiegów deratyzacji i dezynsekcji w budynkach mieszkalnych. Wymagane pozwolenia i certyfikaty, doświadczenie w pracy z budynkami wielorodzinnymi.',
    requirements: ['Pozwolenia na biocydy', 'Certyfikaty DDD', 'Bezpieczne środki', 'Terminowość'],
    responsibilities: [
      'Inspekcja i identyfikacja miejsc występowania szkodników',
      'Aplikacja środków biobójczych zgodnie z przepisami',
      'Zabezpieczenie miejsca przeprowadzania zabiegu',
      'Kontrola skuteczności przeprowadzonych zabiegów',
      'Dokumentowanie wykonanych prac'
    ],
    skills: ['Osiedle 8 budynków', 'Wspólne piwnice', 'Lokale użytkowe', 'Parking wielopoziomowy'],
    postedTime: '1 dzień temu',
    applications: 19,
    rating: 4.2,
    verified: true,
    urgent: true,
    category: 'Specjalistyczne usługi',
    subcategory: 'Dezynsekcja i deratyzacja',
    clientType: 'Administracja Osiedlowa',
    isPremium: false,
    hasInsurance: true,
    completedJobs: 34,
    certificates: ['Certyfikat DDD', 'Pozwolenie na biocydy'],
    deadline: 'Natychmiast - problem pilny',
    budget: '800-1200 zł',
    projectDuration: 'Zabieg jednorazowy + kontrola po 30 dniach',
    contactPerson: 'Janusz Wiśniewski - Administrator',
    contactPhone: '+48 22 789 45 67',
    contactEmail: 'admin@osiedle-sloneczne.pl',
    managementCompany: 'Administracja Osiedlowa',
    managementContact: 'Janusz Wiśniewski',
    managementPhone: '+48 22 789 45 67',
    managementEmail: 'admin@osiedle-sloneczne.pl',
    buildingType: 'Osiedle domków szeregowych',
    buildingYear: 2010,
    surface: '15 budynków, tereny wspólne',
    additionalInfo: 'Pilna potrzeba deratyzacji z powodu zwiększonej aktywności gryzoni w piwnicach.',
    companyLogo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXN0JTIwY29udHJvbHxlbnwxfHx8fDE3NTc0MDQwMzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: '6',
    title: 'Konserwacja terenów zielonych',
    company: 'Spółdzielnia Mieszkaniowa "Parkowa"',
    location: 'Katowice',
    type: 'Sezonowe zlecenie',
    salary: '35-50 zł/h',
    description: 'Szukamy doświadczonej firmy ogrodniczej do kompleksowej pielęgnacji terenów zielonych przy budynkach mieszkalnych. Zakres: koszenie trawy, przycinanie krzewów, sadzenie roślin, nawożenie.',
    requirements: ['Znajomość roślin', 'Sprzęt ogrodniczy', 'Doświadczenie w ogrodnictwie', 'Terminowość'],
    responsibilities: [
      'Regularne koszenie trawników i wykaszanie chwastów',
      'Przycinanie krzewów i formowanie żywopłotów',
      'Nawożenie i podlewanie roślin w okresach suszy',
      'Sadzenie nowych roślin zgodnie z projektem',
      'Sprzątanie liści i utrzymanie czystości terenów zielonych'
    ],
    skills: ['Spółdzielnia 256 mieszkań', 'Duży teren zielony', 'Plac zabaw', 'Alejki spacerowe'],
    postedTime: '2 dni temu',
    applications: 31,
    rating: 4.7,
    verified: true,
    urgent: false,
    category: 'Utrzymanie Czystości i Zieleni',
    subcategory: 'Pielęgnacja terenów zielonych',
    clientType: 'Spółdzielnia Mieszkaniowa',
    isPremium: true,
    hasInsurance: true,
    completedJobs: 67,
    certificates: ['Certyfikat ogrodniczy', 'ISO 14001'],
    deadline: 'Sezon wiosenny - do końca marca',
    budget: '4500-6000 zł/miesiąc',
    projectDuration: 'Umowa sezonowa kwiecień-październik',
    contactPerson: 'Elżbieta Kowalska - Prezes',
    contactPhone: '+48 71 234 56 78',
    contactEmail: 'prezes@parkowa-spoldzielnia.pl',
    managementCompany: 'Spółdzielnia Mieszkaniowa Parkowa',
    managementContact: 'Robert Nowak - Zarządca',
    managementPhone: '+48 71 876 54 32',
    managementEmail: 'zarzadca@parkowa-spoldzielnia.pl',
    buildingType: 'Kompleks mieszkaniowy z rozległymi terenami zielonymi',
    buildingYear: 1988,
    surface: '12 000 m² terenów zielonych',
    additionalInfo: 'Kompleks obejmuje parki, trawniki, klomby, żywopłoty oraz miejsce rekreacji. Wymagana znajomość pielęgnacji różnych gatunków roślin.'
  }
];

export interface MobileJobMock {
  id: string;
  title: string;
  category: string;
  budget: Budget | string; // Support both Budget object and string for backward compatibility
  location: string;
  distance: number;
  postedTime: string;
  company: string;
  urgent: boolean;
  applicants: number;
  rating: number;
  description: string;
  tags: string[];
}

export const mobileJobListMockData: MobileJobMock[] = [
  {
    id: '1',
    title: 'Remont łazienki w bloku z lat 80-tych',
    category: 'Remonty mieszkań',
    budget: '15000-25000',
    location: 'Warszawa, Mokotów',
    distance: 2.3,
    postedTime: '2 godz. temu',
    company: 'WSM Mokotów',
    urgent: true,
    applicants: 12,
    rating: 4.8,
    description: 'Kompleksowy remont łazienki około 6m²...',
    tags: ['Hydraulika', 'Glazura', 'Elektryka']
  },
  {
    id: '2',
    title: 'Malowanie klatki schodowej - 4 piętra',
    category: 'Prace malarskie',
    budget: '8000-12000',
    location: 'Kraków, Nowa Huta',
    distance: 1.8,
    postedTime: '4 godz. temu',
    company: 'Spółdzielnia Mieszkaniowa "Kombatantów"',
    urgent: false,
    applicants: 8,
    rating: 4.6,
    description: 'Malowanie i gruntowanie klatki schodowej...',
    tags: ['Malowanie', 'Gruntowanie']
  },
  {
    id: '3',
    title: 'Wymiana windowy - modernizacja',
    category: 'Instalacje techniczne',
    budget: '80000-120000',
    location: 'Gdańsk, Śródmieście',
    distance: 5.2,
    postedTime: '1 dzień temu',
    company: 'Zarząd Nieruchomości Gdańsk',
    urgent: false,
    applicants: 3,
    rating: 4.9,
    description: 'Kompleksowa wymiana windy osobowej...',
    tags: ['Windy', 'Modernizacja', 'Certyfikaty']
  }
];

