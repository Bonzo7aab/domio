import React from 'react';
import { Home, Search, MapPin, Bell, User, Briefcase, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

type MobileViewType = 'home' | 'search' | 'map' | 'profile' | 'notifications';

interface MobileBottomNavProps {
  currentView: string;
  onViewChange: (view: MobileViewType) => void;
  isAuthenticated: boolean;
  userType?: 'contractor' | 'manager';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  isAuthenticated,
  userType
}) => {
  const navItems = [
    {
      id: 'home' as MobileViewType,
      label: 'Zlecenia',
      icon: Home,
      alwaysShow: true
    },
    {
      id: 'search' as MobileViewType,
      label: 'Szukaj',
      icon: Search,
      alwaysShow: true
    },
    {
      id: 'map' as MobileViewType,
      label: 'Mapa',
      icon: MapPin,
      alwaysShow: true
    },
    {
      id: 'notifications' as MobileViewType,
      label: 'Powiadomienia',
      icon: Bell,
      alwaysShow: false,
      requiresAuth: true,
      badge: 3 // Mock notification count
    },
    {
      id: 'profile' as MobileViewType,
      label: userType === 'contractor' ? 'Panel' : userType === 'manager' ? 'Dashboard' : 'Profil',
      icon: userType === 'contractor' ? Briefcase : userType === 'manager' ? Building2 : User,
      alwaysShow: true
    }
  ];

  const visibleItems = navItems.filter(item => 
    item.alwaysShow || (item.requiresAuth && isAuthenticated)
  );

  return (
    <div className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
      <div className="flex items-center justify-around px-2 py-1">
        {visibleItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onViewChange(item.id)}
              className={`flex-1 flex flex-col items-center justify-center h-14 px-2 relative ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};