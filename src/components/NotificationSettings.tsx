'use client'

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Edit2, X, Check, Bell } from 'lucide-react';

export function NotificationSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement saving notification settings
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Saving notification settings:', notificationSettings);
      setOriginalSettings(notificationSettings);
      setSuccess('Ustawienia powiadomień zostały zapisane');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNotificationSettings(originalSettings);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
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
                Otrzymuj powiadomienia w przeglądarce
              </p>
            </div>
            <Switch
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(value) => handleNotificationChange('pushNotifications', value)}
              disabled={!isEditing}
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

