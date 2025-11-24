import React from 'react';
import { 
  ArrowRight, 
  Building, 
  Users, 
  Wrench, 
  Shield, 
  Star, 
  MapPin, 
  MessageCircle, 
  FileText, 
  BarChart3, 
  CheckCircle, 
  Building2,
  ClipboardList,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useUserProfile } from '../contexts/AuthContext';

interface WelcomePageProps {
  onBack: () => void;
  onGetStarted: () => void;
  onTutorial: () => void;
}

export function WelcomePage({ onBack, onGetStarted, onTutorial }: WelcomePageProps) {
  const { user } = useUserProfile();
  const isManager = user?.userType === 'manager';

  // Manager-specific features
  const managerFeatures = [
    {
      icon: FileText,
      title: 'Darmowe publikowanie zleceń',
      description: 'Publikuj ogłoszenia i przetargi bezpłatnie. Znajdź najlepszych wykonawców dla swoich projektów.',
      color: 'text-blue-600'
    },
    {
      icon: Building2,
      title: 'Zarządzanie nieruchomościami',
      description: 'Zarządzaj budynkami, lokalizacjami i dokumentacją w jednym miejscu. Pełna kontrola nad swoimi nieruchomościami.',
      color: 'text-green-600'
    },
    {
      icon: Users,
      title: 'Zweryfikowana baza wykonawców',
      description: 'Dostęp do sprawdzonych firm z potwierdzonymi certyfikatami, ubezpieczeniami i opiniami.',
      color: 'text-purple-600'
    },
    {
      icon: ClipboardList,
      title: 'Zarządzanie aplikacjami',
      description: 'Przeglądaj, oceniaj i wybieraj najlepsze oferty. System wspiera Cię w podejmowaniu decyzji.',
      color: 'text-orange-600'
    },
    {
      icon: MessageCircle,
      title: 'Komunikacja z wykonawcami',
      description: 'Bezpośrednia komunikacja z wykonawcami. Zadawaj pytania, negocjuj warunki, koordynuj projekty.',
      color: 'text-blue-500'
    },
    {
      icon: BarChart3,
      title: 'Analityka i statystyki',
      description: 'Śledź wydatki, analizuj trendy i optymalizuj zarządzanie nieruchomościami dzięki szczegółowym raportom.',
      color: 'text-indigo-600'
    }
  ];

  // Contractor-specific features
  const contractorFeatures = [
    {
      icon: FileText,
      title: 'Dostęp do zweryfikowanych zleceń',
      description: 'Przeglądaj ogłoszenia od sprawdzonych zarządców nieruchomości. Tylko prawdziwe, wiarygodne zlecenia.',
      color: 'text-blue-600'
    },
    {
      icon: ClipboardList,
      title: 'System przetargów',
      description: 'Składaj oferty w przetargach i konkuruj o najlepsze projekty. Profesjonalny system oceny ofert.',
      color: 'text-green-600'
    },
    {
      icon: Building,
      title: 'Profesjonalny profil',
      description: 'Wyeksponuj swoje doświadczenie, portfolio i certyfikaty. Bądź widoczny dla zarządców szukających wykonawców.',
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Śledzenie aplikacji',
      description: 'Zarządzaj wszystkimi swoimi aplikacjami w jednym miejscu. Śledź status i otrzymuj powiadomienia.',
      color: 'text-orange-600'
    },
    {
      icon: Award,
      title: 'Portfolio projektów',
      description: 'Pokaż swoje najlepsze realizacje. Buduj zaufanie i wyróżnij się na tle konkurencji.',
      color: 'text-blue-500'
    },
    {
      icon: MessageCircle,
      title: 'Komunikacja z zarządcami',
      description: 'Bezpośredni kontakt z klientami. Zadawaj pytania, negocjuj warunki, buduj relacje.',
      color: 'text-indigo-600'
    }
  ];

  // Platform capabilities (shown to all users)
  const platformCapabilities = [
    {
      icon: Shield,
      title: 'System weryfikacji',
      description: 'Wszystkie firmy są weryfikowane pod kątem certyfikatów, ubezpieczeń i dokumentacji.',
      color: 'text-green-600'
    },
    {
      icon: Star,
      title: 'Oceny i opinie',
      description: 'Transparentny system ocen pomaga w wyborze najlepszych partnerów biznesowych.',
      color: 'text-yellow-600'
    },
    {
      icon: MapPin,
      title: 'Wyszukiwanie lokalne',
      description: 'Znajdź wykonawców w swojej okolicy lub zarządców w Twoim regionie dla szybszej realizacji.',
      color: 'text-red-600'
    },
    {
      icon: CheckCircle,
      title: 'Bezpieczne transakcje',
      description: 'Platforma zapewnia bezpieczeństwo i transparentność we wszystkich interakcjach.',
      color: 'text-blue-600'
    }
  ];

  const categories = [
    { name: 'Utrzymanie Czystości i Zieleni' },
    { name: 'Roboty Remontowo-Budowlane' },
    { name: 'Instalacje i systemy' },
    { name: 'Utrzymanie techniczne' },
    { name: 'Specjalistyczne usługi' }
  ];

  const features = isManager ? managerFeatures : contractorFeatures;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 bg-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-3xl font-bold">D</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold" style={{ color: '#1e40af' }}>Domio</h1>
            <h2 className="text-2xl font-bold text-foreground">
              Witaj{user?.firstName ? `, ${user.firstName}` : ''}! 👋
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {isManager 
                ? 'Platforma B2B łącząca zarządców nieruchomości z wykwalifikowanymi wykonawcami. Zarządzaj projektami, znajdź najlepszych wykonawców i optymalizuj swoje operacje.'
                : 'Platforma B2B dla wykonawców. Znajdź nowe projekty od zaufanych zarządców nieruchomości, rozwijaj swoją firmę i buduj portfolio.'
              }
            </p>
          </div>
        </div>

        {/* User Type Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-4 py-2 text-lg">
            {isManager ? (
              <>
                <Users className="h-5 w-5 mr-2" />
                Zarządca nieruchomości
              </>
            ) : (
              <>
                <Wrench className="h-5 w-5 mr-2" />
                Firma wykonawcza
              </>
            )}
          </Badge>
        </div>

        {/* Main Features - User Type Specific */}
        <div>
          <h3 className="text-2xl font-bold text-center mb-6">
            {isManager ? 'Co oferujemy zarządcom' : 'Co oferujemy wykonawcom'}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border border-slate-200 hover:border-blue-300 transition-colors bg-white"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-slate-50 ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Platform Capabilities */}
        <div>
          <h3 className="text-2xl font-bold text-center mb-6">
            Funkcje platformy
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformCapabilities.map((capability, index) => (
              <Card 
                key={index} 
                className="border border-slate-200 hover:border-blue-300 transition-colors bg-white"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-slate-50 ${capability.color}`}>
                      <capability.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{capability.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {capability.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Categories Overview */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">5 głównych kategorii usług</CardTitle>
            <CardDescription>
              Kompleksowe pokrycie wszystkich potrzeb zarządzania nieruchomościami
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((category, index) => (
                <div 
                  key={index} 
                  className="text-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{category.name}</h4>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-blue-800 text-white border-0">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">
                {isManager 
                  ? 'Gotowy do publikowania pierwszego zlecenia?'
                  : 'Gotowy do znalezienia pierwszego projektu?'
                }
              </h3>
              <p className="text-white/90">
                {isManager
                  ? 'Przeprowadzimy Cię przez proces tworzenia profilu firmy, dodawania nieruchomości i publikowania pierwszego zlecenia lub przetargu.'
                  : 'Pokażemy Ci jak uzupełnić profil firmy, dodać portfolio projektów i aplikować o pierwsze zlecenia od zarządców.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  variant="secondary" 
                  onClick={onGetStarted}
                  className="bg-white text-blue-800 hover:bg-slate-100"
                >
                  Rozpocznij
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onTutorial}
                  className="bg-transparent text-white border-white hover:bg-white/10"
                >
                  Rozpocznij przewodnik
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            Wróć do poprzedniego ekranu
          </Button>
        </div>
      </div>
    </div>
  );
};