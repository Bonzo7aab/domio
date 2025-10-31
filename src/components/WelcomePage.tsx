import React from 'react';
import { ArrowRight, Building, Users, Wrench, Shield, Star, MapPin } from 'lucide-react';
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

  const features = [
    {
      icon: Users,
      title: 'Zweryfikowana baza firm',
      description: 'Tylko sprawdzone firmy wykonawcze z potwierdzonymi certyfikatami i ubezpieczeniami',
      color: 'text-blue-600'
    },
    {
      icon: Shield,
      title: 'Bezpieczne transakcje',
      description: 'System escrow i gwarancje wykonania zapewniają bezpieczeństwo każdej transakcji',
      color: 'text-green-600'
    },
    {
      icon: Star,
      title: 'System ocen i opinii',
      description: 'Transparentne recenzje od zarządców pomagają w wyborze najlepszych wykonawców',
      color: 'text-warning'
    },
    {
      icon: MapPin,
      title: 'Lokalne usługi',
      description: 'Znajdź wykonawców w swojej okolicy dla szybszej realizacji projektów',
      color: 'text-primary'
    }
  ];

  const categories = [
    { name: 'Utrzymanie Czystości i Zieleni', count: '150+ firm' },
    { name: 'Roboty Remontowo-Budowlane', count: '200+ firm' },
    { name: 'Instalacje i systemy', count: '180+ firm' },
    { name: 'Utrzymanie techniczne', count: '120+ firm' },
    { name: 'Specjalistyczne usługi', count: '90+ firm' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-3xl font-bold">D</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary mb-2">Domio</h1>
            <h2 className="text-2xl font-bold text-foreground">
              Witaj{user?.firstName ? `, ${user.firstName}` : ''}! 👋
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {user?.userType === 'manager' 
                ? 'Rozpocznij zarządzanie projektami z najlepszymi wykonawcami w branży nieruchomości'
                : 'Znajdź nowe projekty od zaufanych zarządców nieruchomości w Twojej okolicy'
              }
            </p>
          </div>
        </div>

        {/* User Type Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-4 py-2 text-lg">
            {user?.userType === 'manager' ? (
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

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-background ${feature.color}`}>
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

        {/* Categories Overview */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">5 głównych kategorii usług</CardTitle>
            <CardDescription>
              Kompleksowe pokrycie wszystkich potrzeb zarządzania nieruchomościami
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((category, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{category.name}</h4>
                  <p className="text-xs text-primary font-medium">{category.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">
                {user?.userType === 'manager' 
                  ? 'Gotowy do publikowania pierwszego zlecenia?'
                  : 'Gotowy do znalezienia pierwszego projektu?'
                }
              </h3>
              <p className="text-primary-foreground/90">
                {user?.userType === 'manager'
                  ? 'Przeprowadzimy Cię przez proces tworzenia profilu i publikowania zlecenia'
                  : 'Pokażemy Ci jak uzupełnić profil firmy i aplikować o projekty'
                }
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button 
                  variant="secondary" 
                  onClick={onGetStarted}
                  className="text-primary"
                >
                  Rozpocznij
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onTutorial}
                  className="bg-white text-primary border-white hover:bg-white/90"
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