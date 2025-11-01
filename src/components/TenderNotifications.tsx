import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Gavel,
  Play,
  Trophy,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { useUserProfile } from '../contexts/AuthContext';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import { mockTenderNotifications } from '../mocks';

interface TenderNotification {
  id: string;
  type: 'new_tender' | 'deadline_reminder' | 'evaluation_started' | 'tender_awarded' | 'tender_cancelled';
  title: string;
  message: string;
  tenderTitle: string;
  organizerName: string;
  estimatedValue?: string;
  deadline?: Date;
  timestamp: Date;
  read: boolean;
  tenderId: string;
}

interface TenderNotificationsProps {
  onTenderSelect?: (tenderId: string) => void;
}

export const TenderNotifications: React.FC<TenderNotificationsProps> = ({
  onTenderSelect
}) => {
  const { user } = useUserProfile();
  const [notifications, setNotifications] = useState<TenderNotification[]>(mockTenderNotifications);
  const [isOpen, setIsOpen] = useState(false);

  // Only show for contractors
  if (!user || user.userType !== 'contractor') {
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

  const handleNotificationClick = (notification: TenderNotification) => {
    markAsRead(notification.id);
    if (onTenderSelect) {
      onTenderSelect(notification.tenderId);
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

  const formatDeadline = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Termin minął';
    if (diffDays === 0) return 'Kończy się dzisiaj';
    if (diffDays === 1) return 'Kończy się jutro';
    return `${diffDays} dni do końca`;
  };

  const getNotificationIcon = (type: TenderNotification['type']) => {
    switch (type) {
      case 'new_tender':
        return <Gavel className="h-5 w-5 text-blue-600" />;
      case 'deadline_reminder':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'evaluation_started':
        return <Eye className="h-5 w-5 text-purple-600" />;
      case 'tender_awarded':
        return <Trophy className="h-5 w-5 text-green-600" />;
      case 'tender_cancelled':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationPriority = (notification: TenderNotification): 'high' | 'medium' | 'low' => {
    if (notification.type === 'deadline_reminder' && notification.deadline) {
      const daysLeft = Math.ceil((notification.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 1) return 'high';
      if (daysLeft <= 3) return 'medium';
    }
    if (notification.type === 'new_tender') return 'medium';
    return 'low';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Gavel className="h-5 w-5" />
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
            <h3 className="font-semibold">Powiadomienia o przetargach</h3>
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
              <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">Brak powiadomień</h3>
              <p className="text-sm text-gray-500">
                Powiadomienia o przetargach pojawią się tutaj
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const priority = getNotificationPriority(notification);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    } ${
                      priority === 'high' ? 'border-l-4 border-l-red-500 bg-red-50' :
                      priority === 'medium' ? 'border-l-4 border-l-orange-500 bg-orange-50' : ''
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

                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-gray-800">
                            📋 {notification.tenderTitle}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1">
                            Organizator: {notification.organizerName}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs">
                          {notification.estimatedValue && (
                            <div className="flex items-center gap-1">
                              <span className="text-green-600 font-medium">💰</span>
                              <span className="text-green-600 font-medium">
                                {notification.estimatedValue}
                              </span>
                            </div>
                          )}
                          
                          {notification.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-orange-500" />
                              <span className={`
                                ${priority === 'high' ? 'text-red-600 font-medium' : 
                                  priority === 'medium' ? 'text-orange-600 font-medium' : 
                                  'text-gray-500'}
                              `}>
                                {formatDeadline(notification.deadline)}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>

                        {notification.type === 'deadline_reminder' && notification.deadline && (
                          <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded text-xs">
                            <div className="flex items-center gap-1 text-orange-700">
                              <AlertCircle className="h-3 w-3" />
                              <span className="font-medium">Pilne!</span>
                            </div>
                            <p className="text-orange-600 mt-1">
                              Termin składania ofert: {notification.deadline.toLocaleDateString('pl-PL')} {notification.deadline.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}

                        {notification.type === 'new_tender' && (
                          <div className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded text-xs">
                            <div className="flex items-center gap-1 text-blue-700">
                              <Play className="h-3 w-3" />
                              <span className="font-medium">Nowa możliwość!</span>
                            </div>
                            <p className="text-blue-600 mt-1">
                              Przetarg dopasowany do Twojej specjalizacji
                            </p>
                          </div>
                        )}

                        {notification.type === 'tender_awarded' && (
                          <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-xs">
                            <div className="flex items-center gap-1 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              <span className="font-medium">Wyniki dostępne</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                // Navigate to tenders page
                setIsOpen(false);
              }}
            >
              Zobacz wszystkie przetargi
              <Gavel className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TenderNotifications;