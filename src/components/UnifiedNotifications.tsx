import { Bell, Bookmark, Calendar, Check, CheckCircle, Clock, Eye, Gavel, Search, Settings, Star, Trophy, UserCheck, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
// import { useUser } from '../hooks/useUser';
import { useUserProfile } from '../contexts/AuthContext';

// Job notifications types
interface JobNotification {
  id: string;
  category: 'job';
  type: 'new_job' | 'saved_search' | 'price_alert' | 'deadline_reminder';
  title: string;
  description: string;
  jobId?: string;
  searchQuery?: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

// Application notifications types
interface ApplicationNotification {
  id: string;
  category: 'application';
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

// Tender notifications types
interface TenderNotification {
  id: string;
  category: 'tender';
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

type UnifiedNotification = JobNotification | ApplicationNotification | TenderNotification;

interface UnifiedNotificationsProps {
  onJobSelect?: (jobId: string) => void;
  onSearchSelect?: (query: string) => void;
  onApplicationSelect?: (applicationId: string) => void;
  onTenderSelect?: (tenderId: string) => void;
}

export const UnifiedNotifications: React.FC<UnifiedNotificationsProps> = ({
  onJobSelect,
  onSearchSelect,
  onApplicationSelect,
  onTenderSelect
}) => {
  const { user } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isMounted, setIsMounted] = useState(false);

  // Ensure consistent hydration by only rendering user-dependent content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Job notifications
  const [jobNotifications] = useState<JobNotification[]>([
    {
      id: 'job-1',
      category: 'job',
      type: 'new_job',
      title: 'Nowe pilne zlecenie: Sprzątanie klatek',
      description: 'Wspólnota Mieszkaniowa w Warszawie opublikowała pilne zlecenie',
      jobId: '1',
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
      urgent: true
    },
    {
      id: 'job-2',
      category: 'job',
      type: 'saved_search',
      title: 'Nowe wyniki dla "elektryk kraków"',
      description: '3 nowe zlecenia pasujące do Twojego wyszukiwania',
      searchQuery: 'elektryk kraków',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: false,
      urgent: false
    },
    {
      id: 'job-3',
      category: 'job',
      type: 'price_alert',
      title: 'Wysokopłatne zlecenie w Twojej okolicy',
      description: 'Remont elewacji - 120 zł/m² w Krakowie',
      jobId: '2',
      timestamp: new Date(Date.now() - 2 * 3600000),
      read: true,
      urgent: false
    }
  ]);

  // Application notifications (only for managers)
  const [applicationNotifications] = useState<ApplicationNotification[]>([
    {
      id: 'app-1',
      category: 'application',
      type: 'new_application',
      title: 'Nowa oferta na zlecenie',
      message: 'Otrzymano nową ofertę na zlecenie sprzątania klatek schodowych',
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
      id: 'app-2',
      category: 'application',
      type: 'new_application',
      title: 'Nowa oferta na zlecenie',
      message: 'Otrzymano nową ofertę na remont elewacji budynku',
      contractorName: 'Anna Nowak',
      contractorAvatar: '',
      contractorRating: 4.6,
      jobTitle: 'Remont elewacji budynku - 4-piętrowy',
      timestamp: new Date('2024-01-18T09:15:00'),
      read: false,
      applicationId: 'app-2',
      jobId: '2'
    }
  ]);

  // Tender notifications (only for contractors)
  const [tenderNotifications] = useState<TenderNotification[]>([
    {
      id: 'tender-1',
      category: 'tender',
      type: 'new_tender',
      title: 'Nowy przetarg dostępny',
      message: 'Opublikowano nowy przetarg w Twojej specjalizacji',
      tenderTitle: 'Kompleksowy remont elewacji budynku mieszkalnego',
      organizerName: 'Wspólnota Mieszkaniowa "Kwiatowa"',
      estimatedValue: '450,000 PLN',
      deadline: new Date('2024-02-15T23:59:59'),
      timestamp: new Date('2024-01-18T14:30:00'),
      read: false,
      tenderId: 'tender-1'
    },
    {
      id: 'tender-2',
      category: 'tender',
      type: 'deadline_reminder',
      title: 'Zbliża się termin składania ofert',
      message: 'Zostały 3 dni do końca składania ofert w przetargu',
      tenderTitle: 'Serwis i konserwacja wind w kompleksie mieszkaniowym',
      organizerName: 'SM "Podgórskie Tarasy"',
      estimatedValue: '120,000 PLN',
      deadline: new Date('2024-01-25T23:59:59'),
      timestamp: new Date('2024-01-22T09:00:00'),
      read: false,
      tenderId: 'tender-2'
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

  // Combine all notifications based on user type
  const getAllNotifications = (): UnifiedNotification[] => {
    let notifications: UnifiedNotification[] = [...jobNotifications];
    
    // Only include user-specific notifications after mount to prevent hydration mismatch
    if (isMounted) {
      if (user?.userType === 'manager') {
        notifications = [...notifications, ...applicationNotifications];
      }
      
      if (user?.userType === 'contractor') {
        notifications = [...notifications, ...tenderNotifications];
      }
    }
    
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const allNotifications = getAllNotifications();
  const unreadCount = allNotifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    // This would update the state of the specific notification type
    // For now, we'll just log it
    console.log('Mark as read:', notificationId);
  };

  const markAllAsRead = () => {
    // This would update all notifications as read
    console.log('Mark all as read');
  };

  const deleteNotification = (notificationId: string) => {
    // This would delete the notification
    console.log('Delete notification:', notificationId);
  };

  const handleNotificationClick = (notification: UnifiedNotification) => {
    markAsRead(notification.id);
    
    switch (notification.category) {
      case 'job':
        const jobNotif = notification as JobNotification;
        if (jobNotif.jobId && onJobSelect) {
          onJobSelect(jobNotif.jobId);
        } else if (jobNotif.searchQuery && onSearchSelect) {
          onSearchSelect(jobNotif.searchQuery);
        }
        break;
      case 'application':
        const appNotif = notification as ApplicationNotification;
        if (onApplicationSelect) {
          onApplicationSelect(appNotif.applicationId);
        }
        break;
      case 'tender':
        const tenderNotif = notification as TenderNotification;
        if (onTenderSelect) {
          onTenderSelect(tenderNotif.tenderId);
        }
        break;
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (notification: UnifiedNotification) => {
    const urgent = 'urgent' in notification ? notification.urgent : false;
    const iconClass = urgent ? 'text-destructive' : 'text-primary';
    
    switch (notification.category) {
      case 'job':
        const jobNotif = notification as JobNotification;
        switch (jobNotif.type) {
          case 'new_job':
            return <Search className={`h-4 w-4 ${iconClass}`} />;
          case 'saved_search':
            return <Bookmark className={`h-4 w-4 ${iconClass}`} />;
          case 'price_alert':
            return <Bell className={`h-4 w-4 ${iconClass}`} />;
          case 'deadline_reminder':
            return <Clock className={`h-4 w-4 ${iconClass}`} />;
        }
        break;
      case 'application':
        const appNotif = notification as ApplicationNotification;
        switch (appNotif.type) {
          case 'new_application':
            return <UserCheck className="h-4 w-4 text-blue-600" />;
          case 'application_update':
            return <Clock className="h-4 w-4 text-orange-600" />;
          case 'interview_request':
            return <Calendar className="h-4 w-4 text-purple-600" />;
          case 'contract_signed':
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        }
        break;
      case 'tender':
        const tenderNotif = notification as TenderNotification;
        switch (tenderNotif.type) {
          case 'new_tender':
            return <Gavel className="h-4 w-4 text-blue-600" />;
          case 'deadline_reminder':
            return <Clock className="h-4 w-4 text-orange-600" />;
          case 'evaluation_started':
            return <Eye className="h-4 w-4 text-purple-600" />;
          case 'tender_awarded':
            return <Trophy className="h-4 w-4 text-green-600" />;
          case 'tender_cancelled':
            return <X className="h-4 w-4 text-red-600" />;
        }
        break;
    }
    
    return <Bell className={`h-4 w-4 ${iconClass}`} />;
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

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'jobs':
        return allNotifications.filter(n => n.category === 'job');
      case 'applications':
        return allNotifications.filter(n => n.category === 'application');
      case 'tenders':
        return allNotifications.filter(n => n.category === 'tender');
      default:
        return allNotifications;
    }
  };

  const renderNotification = (notification: UnifiedNotification) => {
    return (
      <div
        key={notification.id}
        className={`p-4 border-b cursor-pointer transition-colors group ${
          !notification.read 
            ? 'bg-primary/5 hover:bg-primary/10' 
            : 'hover:bg-muted/50'
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3 flex-1">
            {getNotificationIcon(notification)}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                !notification.read ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {'description' in notification ? notification.description : notification.message}
              </p>
              
              {/* Additional info based on notification type */}
              {notification.category === 'application' && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-xs">
                      {(notification as ApplicationNotification).contractorName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{(notification as ApplicationNotification).contractorName}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-500">{(notification as ApplicationNotification).contractorRating}</span>
                  </div>
                </div>
              )}
              
              {notification.category === 'tender' && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    📋 {(notification as TenderNotification).tenderTitle}
                  </p>
                  <p className="text-xs text-gray-500">
                    Organizator: {(notification as TenderNotification).organizerName}
                  </p>
                  {notification.estimatedValue && (
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 font-medium">💰</span>
                      <span className="text-green-600 font-medium">
                        {notification.estimatedValue}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
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
    );
  };

  // Always show the bell icon button
  const bellButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsOpen(!isOpen)}
      className={`relative ${isOpen ? 'bg-primary/10' : ''}`}
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

  if (!isOpen) {
    return bellButton;
  }

  return (
    <>
      {/* Bell Button - Always visible */}
      {bellButton}
      
      <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30"
          onClick={() => setIsOpen(false)}
        />

        {/* Notification Panel */}
        <Card className="relative w-96 max-h-[80vh] shadow-xl border-2 bg-white">
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
              Najnowsze aktualizacje
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

          {/* Tabs for filtering */}
          <div className="px-6 pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full ${
                isMounted && user?.userType === 'manager' ? 'grid-cols-3' :
                isMounted && user?.userType === 'contractor' ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                <TabsTrigger value="all" className="text-xs">Wszystkie</TabsTrigger>
                <TabsTrigger value="jobs" className="text-xs">Zlecenia</TabsTrigger>
                {isMounted && user?.userType === 'manager' && (
                  <TabsTrigger value="applications" className="text-xs">Oferty</TabsTrigger>
                )}
                {isMounted && user?.userType === 'contractor' && (
                  <TabsTrigger value="tenders" className="text-xs">Przetargi</TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {getFilteredNotifications().length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Brak powiadomień</p>
              </div>
            ) : (
              <div className="space-y-1">
                {getFilteredNotifications().map(renderNotification)}
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
    </>
  );
};