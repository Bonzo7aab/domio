import { 
  Home, 
  Users, 
  Building2, 
  DollarSign, 
  User, 
  LogIn, 
  LogOut, 
  Bookmark, 
  MessageCircle, 
  Bell, 
  Play, 
  GraduationCap, 
  Settings,
  FileText,
  Plus,
  Search,
  HelpCircle,
  Shield,
  CheckCircle,
  Mail,
  Lock
} from 'lucide-react';

export interface SitemapEntry {
  category: string;
  label: string;
  path: string;
  icon: any;
  description: string;
  keywords: string[];
  requiresAuth?: boolean;
  userTypes?: ('manager' | 'contractor')[];
  shortcut?: string;
}

export const sitemapEntries: SitemapEntry[] = [
  // Główne
  {
    category: "Główne",
    label: "Strona główna",
    path: "/",
    icon: Home,
    description: "Przeglądaj ogłoszenia i oferty",
    keywords: ["home", "główna", "start", "strona główna", "ogłoszenia"]
  },
  {
    category: "Główne",
    label: "Wykonawcy",
    path: "/contractors",
    icon: Users,
    description: "Przeglądaj profile wykonawców",
    keywords: ["wykonawcy", "contractors", "firmy", "usługi"]
  },
  {
    category: "Główne",
    label: "Zarządcy Nieruchomości",
    path: "/managers",
    icon: Building2,
    description: "Przeglądaj profile zarządców",
    keywords: ["zarządcy", "managers", "nieruchomości", "property"]
  },
  {
    category: "Główne",
    label: "Cennik",
    path: "/pricing",
    icon: DollarSign,
    description: "Sprawdź nasze ceny i plany",
    keywords: ["cennik", "pricing", "ceny", "plany", "koszt"]
  },

  // Dla Wykonawców
  {
    category: "Dla Wykonawców",
    label: "Panel Wykonawcy",
    path: "/contractor-dashboard",
    icon: User,
    description: "Zarządzaj swoimi ofertami i aplikacjami",
    keywords: ["panel", "dashboard", "wykonawca", "oferty", "aplikacje"],
    requiresAuth: true,
    userTypes: ['contractor']
  },
  {
    category: "Dla Wykonawców",
    label: "Dodaj Ogłoszenie",
    path: "/job-type-selection",
    icon: Plus,
    description: "Utwórz nowe ogłoszenie o pracę",
    keywords: ["dodaj", "ogłoszenie", "praca", "job", "post", "nowe"],
    requiresAuth: true,
    userTypes: ['manager']
  },

  // Dla Zarządców
  {
    category: "Dla Zarządców",
    label: "Panel Zarządcy",
    path: "/manager-dashboard",
    icon: Building2,
    description: "Zarządzaj swoimi ogłoszeniami i aplikacjami",
    keywords: ["panel", "dashboard", "zarządca", "ogłoszenia", "aplikacje"],
    requiresAuth: true,
    userTypes: ['manager']
  },
  {
    category: "Dla Zarządców",
    label: "Utwórz Przetarg",
    path: "/tender-creation",
    icon: FileText,
    description: "Utwórz nowy przetarg",
    keywords: ["przetarg", "tender", "utwórz", "nowy", "oferty"],
    requiresAuth: true,
    userTypes: ['manager']
  },

  // Konto
  {
    category: "Konto",
    label: "Profil",
    path: "/account",
    icon: User,
    description: "Zarządzaj swoim profilem",
    keywords: ["profil", "account", "ustawienia", "dane", "settings"],
    requiresAuth: true
  },
  {
    category: "Konto",
    label: "Zapisane Ogłoszenia",
    path: "/bookmarked-jobs",
    icon: Bookmark,
    description: "Przeglądaj zapisane ogłoszenia",
    keywords: ["zapisane", "bookmark", "ulubione", "favorites"],
    requiresAuth: true
  },
  {
    category: "Konto",
    label: "Wiadomości",
    path: "/messages",
    icon: MessageCircle,
    description: "Sprawdź swoje wiadomości",
    keywords: ["wiadomości", "messages", "chat", "komunikacja"],
    requiresAuth: true
  },
  {
    category: "Konto",
    label: "Powiadomienia",
    path: "#",
    icon: Bell,
    description: "Ustawienia powiadomień",
    keywords: ["powiadomienia", "notifications", "alerty", "bell"],
    requiresAuth: true
  },

  // Pomoc
  {
    category: "Pomoc",
    label: "Strona Powitalna",
    path: "/welcome",
    icon: Play,
    description: "Dowiedz się więcej o platformie",
    keywords: ["welcome", "powitalna", "start", "onboarding", "intro"]
  },
  {
    category: "Pomoc",
    label: "Tutorial",
    path: "/tutorial",
    icon: GraduationCap,
    description: "Przejdź przez samouczek platformy",
    keywords: ["tutorial", "samouczek", "nauka", "guide", "help"]
  },
  {
    category: "Pomoc",
    label: "Uzupełnij Profil",
    path: "/profile-completion",
    icon: Settings,
    description: "Dokończ konfigurację swojego profilu",
    keywords: ["profil", "completion", "uzupełnij", "konfiguracja"],
    requiresAuth: true
  },
  {
    category: "Pomoc",
    label: "Weryfikacja",
    path: "/verification",
    icon: Shield,
    description: "Zweryfikuj swoje konto",
    keywords: ["weryfikacja", "verification", "verify", "potwierdź"],
    requiresAuth: true
  },
  {
    category: "Pomoc",
    label: "Konsultacja Ekspercka",
    path: "/expert-consultation",
    icon: HelpCircle,
    description: "Skorzystaj z konsultacji eksperckiej",
    keywords: ["konsultacja", "ekspert", "expert", "consultation", "pomoc"]
  },

  // Autoryzacja
  {
    category: "Autoryzacja",
    label: "Zaloguj się",
    path: "/user-type-selection",
    icon: LogIn,
    description: "Zaloguj się do swojego konta",
    keywords: ["login", "zaloguj", "logowanie", "sign in", "auth"],
    requiresAuth: false
  },
  {
    category: "Autoryzacja",
    label: "Rejestracja",
    path: "/register",
    icon: User,
    description: "Utwórz nowe konto",
    keywords: ["register", "rejestracja", "sign up", "nowe konto", "register"],
    requiresAuth: false
  },
  {
    category: "Autoryzacja",
    label: "Wyloguj się",
    path: "#",
    icon: LogOut,
    description: "Wyloguj się z konta",
    keywords: ["logout", "wyloguj", "sign out", "wyjście"],
    requiresAuth: true
  },
  {
    category: "Autoryzacja",
    label: "Przypomnij Hasło",
    path: "/forgot-password",
    icon: Lock,
    description: "Odzyskaj dostęp do konta",
    keywords: ["hasło", "password", "forgot", "reset", "odzyskaj"],
    requiresAuth: false
  }
];

export const getFilteredSitemap = (
  isAuthenticated: boolean, 
  userType?: 'manager' | 'contractor'
): SitemapEntry[] => {
  return sitemapEntries.filter(entry => {
    // Show public routes to everyone
    if (!entry.requiresAuth) {
      return true;
    }
    
    // Show authenticated routes only to authenticated users
    if (entry.requiresAuth && !isAuthenticated) {
      return false;
    }
    
    // Show role-specific routes only to users with matching role
    if (entry.userTypes && userType) {
      return entry.userTypes.includes(userType);
    }
    
    // Show general authenticated routes to all authenticated users
    return true;
  });
};

export const getSitemapByCategory = (entries: SitemapEntry[]) => {
  const grouped = entries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, SitemapEntry[]>);
  
  return grouped;
};
