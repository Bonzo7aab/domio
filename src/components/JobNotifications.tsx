import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Settings, Search, Bookmark, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';

interface JobNotification {
  id: string;
  type: 'new_job' | 'saved_search' | 'price_alert' | 'deadline_reminder';
  title: string;
  description: string;
  jobId?: string;
  searchQuery?: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

interface JobNotificationsProps {
  onJobSelect?: (jobId: string) => void;
  onSearchSelect?: (query: string) => void;
}

export const JobNotifications: React.FC<JobNotificationsProps> = ({
  onJobSelect,
  onSearchSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<JobNotification[]>([
    {
      id: '1',
      type: 'new_job',
      title: 'Nowe pilne zlecenie: Sprzątanie klatek',
      description: 'Wspólnota Mieszkaniowa w Warszawie opublikowała pilne zlecenie',
      jobId: '1',
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
      urgent: true
    },
    {
      id: '2',
      type: 'saved_search',
      title: 'Nowe wyniki dla "elektryk kraków"',
      description: '3 nowe zlecenia pasujące do Twojego wyszukiwania',
      searchQuery: 'elektryk kraków',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: false,
      urgent: false
    },
    {
      id: '3',
      type: 'price_alert',
      title: 'Wysokopłatne zlecenie w Twojej okolicy',
      description: 'Remont elewacji - 120 zł/m² w Krakowie',
      jobId: '2',
      timestamp: new Date(Date.now() - 2 * 3600000),
      read: true,
      urgent: false
    },
    {
      id: '4',
      type: 'deadline_reminder',
      title: 'Przypomnienie o terminie aplikacji',
      description: 'Zlecenie "Serwis instalacji" kończy przyjmowanie ofert za 2 dni',
      jobId: '3',
      timestamp: new Date(Date.now() - 4 * 3600000),
      read: true,
      urgent: false
    }
  ]);

  const [settings, setSettings] = useState({
    newJobs: true,
    savedSearches: true,
    priceAlerts: true,
    deadlineReminders: true,
    emailNotifications: false,
    pushNotifications: true
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = (notification: JobNotification) => {
    markAsRead(notification.id);
    
    if (notification.jobId && onJobSelect) {
      onJobSelect(notification.jobId);
    } else if (notification.searchQuery && onSearchSelect) {
      onSearchSelect(notification.searchQuery);
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string, urgent: boolean) => {
    const iconClass = urgent ? 'text-destructive' : 'text-primary';
    
    switch (type) {
      case 'new_job':
        return <Search className={`h-4 w-4 ${iconClass}`} />;
      case 'saved_search':
        return <Bookmark className={`h-4 w-4 ${iconClass}`} />;
      case 'price_alert':
        return <Bell className={`h-4 w-4 ${iconClass}`} />;
      case 'deadline_reminder':
        return <Clock className={`h-4 w-4 ${iconClass}`} />;
      default:
        return <Bell className={`h-4 w-4 ${iconClass}`} />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Teraz';
    if (minutes < 60) return `${minutes}m temu`;
    if (hours < 24) return `${hours}h temu`;
    return `${days}d temu`;
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Notification Panel */}
      <Card className="relative w-96 max-h-[80vh] shadow-xl border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Powiadomienia</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} nowe
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Najnowsze aktualizacje zleceń
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* Quick Actions */}
          {unreadCount > 0 && (
            <div className="px-6 pb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                Oznacz wszystkie jako przeczytane
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Brak powiadomień</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      !notification.read 
                        ? 'bg-primary/5 hover:bg-primary/10' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between space-x-3">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.type, notification.urgent)}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Settings */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Ustawienia powiadomień</Label>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Nowe zlecenia</Label>
                <Switch
                  checked={settings.newJobs}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, newJobs: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Zapisane wyszukiwania</Label>
                <Switch
                  checked={settings.savedSearches}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, savedSearches: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Alerty cenowe</Label>
                <Switch
                  checked={settings.priceAlerts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, priceAlerts: checked }))
                  }
                />
              </div>
            </div>

            <Alert className="mt-4">
              <AlertDescription className="text-xs">
                Aby otrzymywać powiadomienia email, włącz tę opcję w ustawieniach konta.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};