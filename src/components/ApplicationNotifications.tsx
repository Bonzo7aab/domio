import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bell, 
  X, 
  Eye, 
  UserCheck, 
  MessageSquare,
  Calendar,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useUserProfile } from '../contexts/AuthContext';

interface ApplicationNotification {
  id: string;
  type: 'new_application' | 'application_update' | 'interview_request' | 'contract_signed';
  title: string;
  message: string;
  contractorName: string;
  contractorAvatar?: string;
  contractorRating: number;
  jobTitle: string;
  timestamp: Date;
  read: boolean;
  applicationId: string;
  jobId: string;
}

interface ApplicationNotificationsProps {
  onApplicationSelect?: (applicationId: string) => void;
  onJobSelect?: (jobId: string) => void;
}

// Mock notifications for managers
const mockNotifications: ApplicationNotification[] = [
  {
    id: 'notif-1',
    type: 'new_application',
    title: 'Nowa aplikacja na zlecenie',
    message: 'Otrzymano nową aplikację na zlecenie sprzątania klatek schodowych',
    contractorName: 'Jan Kowalski',
    contractorAvatar: '',
    contractorRating: 4.8,
    jobTitle: 'Sprzątanie klatek schodowych - budynek 5-kondygnacyjny',
    timestamp: new Date('2024-01-18T14:30:00'),
    read: false,
    applicationId: 'app-1',
    jobId: '1'
  },
  {
    id: 'notif-2',
    type: 'new_application',
    title: 'Nowa aplikacja na zlecenie',
    message: 'Otrzymano nową aplikację na remont elewacji budynku',
    contractorName: 'Anna Nowak',
    contractorAvatar: '',
    contractorRating: 4.6,
    jobTitle: 'Remont elewacji budynku - 4-piętrowy',
    timestamp: new Date('2024-01-18T09:15:00'),
    read: false,
    applicationId: 'app-2',
    jobId: '2'
  },
  {
    id: 'notif-3',
    type: 'application_update',
    title: 'Wykonawca wysłał dodatkowe dokumenty',
    message: 'Wykonawca przesłał aktualizację aplikacji z dodatkowymi certyfikatami',
    contractorName: 'Piotr Wiśniewski',
    contractorAvatar: '',
    contractorRating: 4.9,
    jobTitle: 'Serwis instalacji elektrycznej',
    timestamp: new Date('2024-01-17T16:45:00'),
    read: true,
    applicationId: 'app-3',
    jobId: '3'
  },
  {
    id: 'notif-4',
    type: 'contract_signed',
    title: 'Kontrakt został podpisany',
    message: 'Wykonawca zaakceptował warunki kontraktu i podpisał umowę',
    contractorName: 'Marek Zieliński',
    contractorAvatar: '',
    contractorRating: 4.7,
    jobTitle: 'Konserwacja wind w budynku',
    timestamp: new Date('2024-01-16T11:20:00'),
    read: true,
    applicationId: 'app-4',
    jobId: '4'
  }
];

export const ApplicationNotifications: React.FC<ApplicationNotificationsProps> = ({
  onApplicationSelect,
  onJobSelect
}) => {
  const { user } = useUserProfile();
  const [notifications, setNotifications] = useState<ApplicationNotification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  // Only show for managers
  if (!user || user.userType !== 'manager') {
    return null;
  }

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleNotificationClick = (notification: ApplicationNotification) => {
    markAsRead(notification.id);
    if (onApplicationSelect) {
      onApplicationSelect(notification.applicationId);
    }
    setIsOpen(false);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;
    
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'short'
    }).format(date);
  };

  const getNotificationIcon = (type: ApplicationNotification['type']) => {
    switch (type) {
      case 'new_application':
        return <UserCheck className="h-5 w-5 text-blue-600" />;
      case 'application_update':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'interview_request':
        return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'contract_signed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Powiadomienia o aplikacjach</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Oznacz wszystkie jako przeczytane
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} nowych powiadomień
            </p>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">Brak powiadomień</h3>
              <p className="text-sm text-gray-500">
                Powiadomienia o nowych aplikacjach pojawią się tutaj
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={notification.contractorAvatar} />
                          <AvatarFallback className="text-xs">
                            {notification.contractorName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{notification.contractorName}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-500">{notification.contractorRating}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-xs text-gray-500 truncate">
                          📋 {notification.jobTitle}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-sm"
              onClick={() => {
                // Navigate to applications management
                setIsOpen(false);
              }}
            >
              Zobacz wszystkie aplikacje
              <Eye className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ApplicationNotifications;