import React from 'react';
import { Search, Bell, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBackClick?: () => void;
  showSearch?: boolean;
  onSearchClick?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  showMenu?: boolean;
  onMenuClick?: () => void;
  rightAction?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBackClick,
  showSearch = false,
  onSearchClick,
  showNotifications = false,
  notificationCount = 0,
  onNotificationsClick,
  showMenu = false,
  onMenuClick,
  rightAction
}) => {
  return (
    <div className="mobile-header sticky top-0 z-50 bg-white border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackClick}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showMenu && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold text-foreground truncate">
            {title}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchClick}
              className="h-9 w-9"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNotificationsClick}
              className="h-9 w-9 relative"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
          )}
          
          {rightAction}
        </div>
      </div>
    </div>
  );
};