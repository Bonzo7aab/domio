import React from 'react';
import { ArrowLeft, Briefcase, Building2, Star, Users, TrendingUp, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { MobileUserTypeSelectionProps } from '../../types/auth';

export const MobileUserTypeSelection: React.FC<MobileUserTypeSelectionProps> = ({
  onBack,
  onUserTypeSelect
}) => {
  return (
    <div className="mobile-user-type-selection flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-border px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">
            Wybierz typ konta
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Witaj w Urbi!</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Wybierz typ konta, aby rozpocząć korzystanie z platformy
          </p>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          {/* Contractor Card */}
          <Card className="border-2 border-primary/20 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Jestem Wykonawcą</CardTitle>
              <p className="text-sm text-muted-foreground">
                Firma budowlana szukająca zleceń
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 text-success mr-2" />
                  <span>Dostęp do zweryfikowanych zleceń</span>
                </div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-success mr-2" />
                  <span>Budowanie reputacji i ocen</span>
                </div>
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 text-success mr-2" />
                  <span>Bezpieczeństwo płatności</span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Plan Basic</span>
                  <Badge variant="secondary">50 zł/miesiąc</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  7 dni darmowego okresu próbnego
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => onUserTypeSelect('contractor', 'register')}
                >
                  Zarejestruj się za darmo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onUserTypeSelect('contractor', 'login')}
                >
                  Mam już konto
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manager Card */}
          <Card className="border-2 border-success/20 hover:border-success/50 transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-xl">Jestem Zarządcą</CardTitle>
              <p className="text-sm text-muted-foreground">
                Zarządzam wspólnotą lub spółdzielnią
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 text-success mr-2" />
                  <span>Dostęp do bazy wykonawców</span>
                </div>
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 text-success mr-2" />
                  <span>System przetargów online</span>
                </div>
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 text-success mr-2" />
                  <span>Transparentność procesów</span>
                </div>
              </div>
              
              <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                <div className="flex items-center justify-between text-sm">
                  <span>Plan Free</span>
                  <Badge className="bg-success text-success-foreground">
                    Zawsze darmowy
                  </Badge>
                </div>
                <div className="text-xs text-success/80 mt-1">
                  Pełny dostęp bez ograniczeń
                </div>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full bg-success hover:bg-success/90"
                  onClick={() => onUserTypeSelect('manager', 'register')}
                >
                  Rozpocznij za darmo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-success text-success hover:bg-success/10"
                  onClick={() => onUserTypeSelect('manager', 'login')}
                >
                  Mam już konto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-8 space-y-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1" />
              <span>Bezpieczne</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              <span>Zweryfikowane</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Efektywne</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Rejestrując się akceptujesz nasze Warunki użytkowania i Politykę prywatności
          </p>
        </div>
      </div>
    </div>
  );
};