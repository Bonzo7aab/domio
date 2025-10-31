import React, { useState } from 'react';
import { Bell, Briefcase, Building2, Clock, CheckCircle, X, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface Notification {
  id: string;
  type: 'job_application' | 'job_update' | 'message' | 'tender' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  avatar?: string;
  actionData?: {
    jobId?: string;
    tenderId?: string;
    userId?: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'job_application',
    title: 'Nowa aplikacja na zlecenie',
    message: 'FirmaBud Sp. z o.o. aplikowała na "Remont łazienki w bloku z lat 80-tych"',
    timestamp: '5 min temu',
    isRead: false,
    avatar: '',
    actionData: { jobId: '1' }
  },
  {
    id: '2',
    type: 'message',
    title: 'Nowa wiadomość',
    message: 'Anna Kowalska wysłała wiadomość dotyczącą zlecenia',
    timestamp: '15 min temu',
    isRead: false,
    avatar: '',
    actionData: { userId: '2' }
  },
  {
    id: '3',
    type: 'tender',
    title: 'Przetarg rozstrzygnięty',
    message: 'Twoja oferta na "Wymiana windy" została wybrana jako najlepsza',
    timestamp: '2 godz. temu',
    isRead: true,
    actionData: { tenderId: '3' }
  },
  {
    id: '4',
    type: 'job_update',
    title: 'Zaktualizowano zlecenie',
    message: 'Dodano nowe wymagania do "Malowanie klatki schodowej"',
    timestamp: '3 godz. temu',
    isRead: true,
    actionData: { jobId: '2' }
  },
  {
    id: '5',
    type: 'payment',
    title: 'Płatność zrealizowana',
    message: 'Otrzymano płatność 15,000 zł za zlecenie "Remont mieszkania"',
    timestamp: '1 dzień temu',
    isRead: true
  },
  {
    id: '6',
    type: 'system',
    title: 'Aktualizacja aplikacji',
    message: 'Dostępna jest nowa wersja aplikacji Urbi z ulepszonymi funkcjami',
    timestamp: '2 dni temu',
    isRead: true
  }
];

interface MobileNotificationsProps {
  userType?: 'contractor' | 'manager';
  onJobSelect?: (jobId: string) => void;
}

export const MobileNotifications: React.FC<MobileNotificationsProps> = ({
  userType,
  onJobSelect
}) => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'job_application':
        return <Briefcase className="h-5 w-5 text-primary" />;
      case 'job_update':
        return <Briefcase className="h-5 w-5 text-warning" />;
      case 'message':
        return <Bell className="h-5 w-5 text-info" />;
      case 'tender':
        return <Building2 className="h-5 w-5 text-success" />;
      case 'payment':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'system':
        return <Bell className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'job_application':
        return 'border-l-primary';
      case 'job_update':
        return 'border-l-warning';
      case 'message':
        return 'border-l-info';
      case 'tender':
        return 'border-l-success';
      case 'payment':
        return 'border-l-success';
      case 'system':
        return 'border-l-muted-foreground';
      default:
        return 'border-l-muted-foreground';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Handle action based on notification type
    if (notification.actionData?.jobId && onJobSelect) {
      onJobSelect(notification.actionData.jobId);
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    filter === 'all' || !notification.isRead
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="mobile-notifications flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Powiadomienia
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} nieprzeczytanych
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            >
              <Filter className="h-4 w-4 mr-1" />
              {filter === 'all' ? 'Wszystkie' : 'Nieprzeczytane'}
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                Oznacz jako przeczytane
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {filter === 'unread' ? 'Brak nowych powiadomień' : 'Brak powiadomień'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {filter === 'unread' 
                ? 'Wszystkie powiadomienia zostały przeczytane'
                : 'Powiadomienia będą się tutaj pojawiać'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.isRead ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {notification.avatar ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={notification.avatar} />
                        <AvatarFallback>
                          {notification.title.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <h4 className={`text-sm font-medium ${
                          !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </span>
                          {!notification.isRead && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              Nowe
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {filteredNotifications.length > 0 && (
        <div className="border-t border-border p-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setFilter('unread')}
            >
              Tylko nowe ({unreadCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setFilter('all')}
            >
              Wszystkie ({notifications.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};