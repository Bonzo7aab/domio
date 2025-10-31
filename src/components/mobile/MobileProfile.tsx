import React from 'react';
import { User, Settings, HelpCircle, Star, Award, CreditCard, LogOut, LogIn, Euro, FileText, Shield, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface MobileProfileProps {
  user?: {
    id: string;
    name: string;
    email: string;
    userType: 'contractor' | 'manager';
    avatar?: string;
    companyName?: string;
    rating?: number;
    reviewsCount?: number;
    verificationStatus?: 'verified' | 'pending' | 'none';
    plan?: string;
  };
  onLoginClick?: () => void;
  onLogout?: () => void;
  onPricingClick?: () => void;
}

export const MobileProfile: React.FC<MobileProfileProps> = ({
  user,
  onLoginClick,
  onLogout,
  onPricingClick
}) => {
  // If not logged in, show login prompt
  if (!user) {
    return (
      <div className="mobile-profile flex flex-col h-full p-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Witaj w Urbi!</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Zaloguj się aby uzyskać dostęp do swoich zleceń, aplikacji i pełnej funkcjonalności platformy.
          </p>
          
          <div className="w-full max-w-sm space-y-3">
            <Button onClick={onLoginClick} className="w-full" size="lg">
              <LogIn className="h-5 w-5 mr-2" />
              Zaloguj się
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onPricingClick} 
              className="w-full"
            >
              <Euro className="h-5 w-5 mr-2" />
              Zobacz cennik
            </Button>
          </div>
        </div>
        
        {/* Quick links for non-logged users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Przydatne linki</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start">
              <HelpCircle className="h-5 w-5 mr-3" />
              Jak to działa?
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="h-5 w-5 mr-3" />
              Regulamin
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Shield className="h-5 w-5 mr-3" />
              Polityka prywatności
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in user profile
  return (
    <div className="mobile-profile overflow-y-auto h-full">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-white">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-white text-primary text-lg font-bold">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-bold">{user.name}</h2>
              {user.verificationStatus === 'verified' && (
                <Badge className="bg-success text-success-foreground">
                  <Shield className="h-3 w-3 mr-1" />
                  Zweryfikowany
                </Badge>
              )}
            </div>
            
            {user.companyName && (
              <p className="text-white/90 text-sm mb-1">{user.companyName}</p>
            )}
            
            <p className="text-white/80 text-sm">{user.email}</p>
            
            {user.rating && (
              <div className="flex items-center mt-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{user.rating}</span>
                <span className="text-white/80 text-sm ml-1">
                  ({user.reviewsCount} opinii)
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <div className="font-bold text-lg">
              {user.userType === 'contractor' ? '247' : '12'}
            </div>
            <div className="text-white/80 text-xs">
              {user.userType === 'contractor' ? 'Aplikacji' : 'Zleceń'}
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">
              {user.userType === 'contractor' ? '43' : '8'}
            </div>
            <div className="text-white/80 text-xs">
              {user.userType === 'contractor' ? 'Wygranych' : 'Aktywnych'}
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">96%</div>
            <div className="text-white/80 text-xs">Sukces</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-medium text-sm">Profil</div>
              <div className="text-xs text-muted-foreground">Edytuj dane</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 text-center">
              <Bell className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="font-medium text-sm">Powiadomienia</div>
              <div className="text-xs text-muted-foreground">Ustawienia</div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Info for Contractors */}
        {user.userType === 'contractor' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <CreditCard className="h-5 w-5 mr-2" />
                Plan subskrypcji
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {user.plan || 'Urbi Basic'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    50 zł/miesiąc • Aktywny
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={onPricingClick}>
                  Zmień plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Options */}
        <Card>
          <CardContent className="p-0">
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start h-12 px-4">
                <User className="h-5 w-5 mr-3" />
                Edytuj profil
              </Button>
              
              <Button variant="ghost" className="w-full justify-start h-12 px-4">
                <Settings className="h-5 w-5 mr-3" />
                Ustawienia
              </Button>
              
              <Button variant="ghost" className="w-full justify-start h-12 px-4">
                <Star className="h-5 w-5 mr-3" />
                Moje oceny
              </Button>
              
              {user.userType === 'contractor' && (
                <Button variant="ghost" className="w-full justify-start h-12 px-4">
                  <Award className="h-5 w-5 mr-3" />
                  Weryfikacja
                </Button>
              )}
              
              <Button variant="ghost" className="w-full justify-start h-12 px-4">
                <Bell className="h-5 w-5 mr-3" />
                Powiadomienia
              </Button>
              
              <Separator />
              
              <Button variant="ghost" className="w-full justify-start h-12 px-4">
                <HelpCircle className="h-5 w-5 mr-3" />
                Pomoc i wsparcie
              </Button>
              
              <Button variant="ghost" className="w-full justify-start h-12 px-4">
                <FileText className="h-5 w-5 mr-3" />
                Regulamin
              </Button>
              
              <Button variant="ghost" className="w-full justify-start h-12 px-4">
                <Shield className="h-5 w-5 mr-3" />
                Prywatność
              </Button>
              
              <Separator />
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Wyloguj się
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center mt-6 pt-6 border-t text-sm text-muted-foreground">
          <div>Urbi.eu Mobile v1.0.0</div>
          <div>© 2024 Urbi.eu</div>
        </div>
      </div>
    </div>
  );
};