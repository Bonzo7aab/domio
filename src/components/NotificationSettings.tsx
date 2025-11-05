'use client'

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Edit2, X, Check, Bell, AlertCircle } from 'lucide-react';
import { useUserProfile } from '../contexts/AuthContext';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  mapPreferencesToComponent,
  savePushSubscription,
  deletePushSubscription,
  getPushSubscriptions
} from '../lib/database/notifications';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getServiceWorkerRegistration,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getUserAgent
} from '../lib/push-notifications/client';

export function NotificationSettings() {
  const { user, isAuthenticated } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isPushSupported, setIsPushSupported] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    jobUpdates: true,
    messageNotifications: true,
  });

  const [originalSettings, setOriginalSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    jobUpdates: true,
    messageNotifications: true,
  });

  // Load preferences from database on mount
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setIsLoadingPreferences(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setIsLoadingPreferences(true);
        const dbPreferences = await getNotificationPreferences(user.id);
        const componentPreferences = mapPreferencesToComponent(dbPreferences);
        
        setNotificationSettings({
          emailNotifications: componentPreferences.emailNotifications,
          pushNotifications: componentPreferences.pushNotifications,
          marketingEmails: componentPreferences.marketingEmails,
          jobUpdates: componentPreferences.jobUpdates,
          messageNotifications: componentPreferences.messageNotifications,
        });
        setOriginalSettings({
          emailNotifications: componentPreferences.emailNotifications,
          pushNotifications: componentPreferences.pushNotifications,
          marketingEmails: componentPreferences.marketingEmails,
          jobUpdates: componentPreferences.jobUpdates,
          messageNotifications: componentPreferences.messageNotifications,
        });
      } catch (err) {
        console.error('Error loading notification preferences:', err);
        setError('Nie udało się załadować ustawień powiadomień');
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [user, isAuthenticated]);

  // Check push notification support and permission status
  useEffect(() => {
    const checkPushSupport = () => {
      const supported = isPushNotificationSupported();
      setIsPushSupported(supported);
      
      if (supported) {
        const permission = getNotificationPermission();
        setPushPermissionStatus(permission);
      }
    };

    checkPushSupport();
  }, []);

  const handleNotificationChange = async (setting: string, value: boolean) => {
    // Special handling for push notifications
    if (setting === 'pushNotifications' && value === true) {
      // User wants to enable push notifications
      if (!isPushSupported) {
        setError('Powiadomienia push nie są obsługiwane w tej przeglądarce');
        return;
      }

      const permission = getNotificationPermission();
      
      if (permission === 'denied') {
        setError('Powiadomienia push zostały zablokowane. Odblokuj je w ustawieniach przeglądarki.');
        return;
      }

      if (permission === 'default') {
        // Request permission
        try {
          const newPermission = await requestNotificationPermission();
          setPushPermissionStatus(newPermission);
          
          if (newPermission !== 'granted') {
            setError('Powiadomienia push wymagają zgody użytkownika');
            return;
          }
        } catch (err) {
          console.error('Error requesting notification permission:', err);
          setError('Nie udało się uzyskać zgody na powiadomienia push');
          return;
        }
      }

      // Subscribe to push notifications
      try {
        const registration = await getServiceWorkerRegistration();
        if (!registration) {
          setError('Rejestracja service workera nie jest dostępna');
          return;
        }

        const subscription = await subscribeToPushNotifications(registration);
        if (subscription && user?.id) {
          await savePushSubscription(user.id, {
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userAgent: getUserAgent()
          });
        }
      } catch (err) {
        console.error('Error subscribing to push notifications:', err);
        setError('Nie udało się zasubskrybować powiadomień push');
        return;
      }
    } else if (setting === 'pushNotifications' && value === false) {
      // User wants to disable push notifications - unsubscribe
      try {
        const registration = await getServiceWorkerRegistration();
        if (registration) {
          await unsubscribeFromPushNotifications(registration);
          
          // Delete subscription from database
          if (user?.id) {
            const subscriptions = await getPushSubscriptions(user.id);
            for (const sub of subscriptions) {
              await deletePushSubscription(user.id, sub.endpoint);
            }
          }
        }
      } catch (err) {
        console.error('Error unsubscribing from push notifications:', err);
        // Continue anyway - user wants to disable
      }
    }

    // Update local state
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!isAuthenticated || !user?.id) {
      setError('Musisz być zalogowany, aby zapisać ustawienia');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Save notification preferences to database
      await saveNotificationPreferences(user.id, {
        emailNotifications: notificationSettings.emailNotifications,
        pushNotifications: notificationSettings.pushNotifications,
        marketingNotifications: notificationSettings.marketingEmails,
        messageNotifications: notificationSettings.messageNotifications,
        newJobNotifications: notificationSettings.jobUpdates,
      });

      setOriginalSettings(notificationSettings);
      setSuccess('Ustawienia powiadomień zostały zapisane');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Nie udało się zapisać ustawień powiadomień');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNotificationSettings(originalSettings);
    setIsEditing(false);
    setError('');
  };

  // Determine if push notifications can be enabled
  const canEnablePush = isPushSupported && pushPermissionStatus !== 'denied';
  const isPushDisabled = !isPushSupported || pushPermissionStatus === 'denied';

  if (isLoadingPreferences) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Ładowanie ustawień...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notification Settings Section */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Preferencje powiadomień</h4>
          </div>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={!isAuthenticated}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Anuluj
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Powiadomienia email</Label>
              <p className="text-sm text-muted-foreground">
                Otrzymuj powiadomienia na adres email
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(value) => handleNotificationChange('emailNotifications', value)}
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Powiadomienia push</Label>
              <p className="text-sm text-muted-foreground">
                {isPushDisabled 
                  ? 'Powiadomienia push nie są dostępne (zablokowane lub nieobsługiwane)'
                  : 'Otrzymuj powiadomienia w przeglądarce'
                }
              </p>
              {pushPermissionStatus === 'denied' && (
                <p className="text-xs text-destructive mt-1">
                  Powiadomienia zostały zablokowane. Odblokuj je w ustawieniach przeglądarki.
                </p>
              )}
            </div>
            <Switch
              checked={notificationSettings.pushNotifications && canEnablePush}
              onCheckedChange={(value) => handleNotificationChange('pushNotifications', value)}
              disabled={!isEditing || isPushDisabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Aktualizacje zleceń</Label>
              <p className="text-sm text-muted-foreground">
                Powiadomienia o nowych zleceniach i aktualizacjach
              </p>
            </div>
            <Switch
              checked={notificationSettings.jobUpdates}
              onCheckedChange={(value) => handleNotificationChange('jobUpdates', value)}
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Wiadomości</Label>
              <p className="text-sm text-muted-foreground">
                Powiadomienia o nowych wiadomościach
              </p>
            </div>
            <Switch
              checked={notificationSettings.messageNotifications}
              onCheckedChange={(value) => handleNotificationChange('messageNotifications', value)}
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Email marketingowy</Label>
              <p className="text-sm text-muted-foreground">
                Otrzymuj informacje o nowościach i promocjach
              </p>
            </div>
            <Switch
              checked={notificationSettings.marketingEmails}
              onCheckedChange={(value) => handleNotificationChange('marketingEmails', value)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

