'use client';

import React from 'react';
import { Bell, Radar } from 'lucide-react';
import { toast } from 'sonner';
import {
  type ContractorNotificationChannels,
  type ContractorRadarSettings,
  getContractorAccountSettings,
  upsertContractorAccountSettings,
} from '../lib/database/contractor-account';
import { getNotifications } from '../lib/database/notifications';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

interface ContractorNotificationsPanelProps {
  userId: string;
}

const AVAILABLE_AREAS = ['Warszawa', 'Wilanów', 'Mokotów'] as const;

interface NotificationListItem {
  id: string;
  title: string;
  message: string | null;
  createdAt: string;
}

const NotificationChannelField = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-md border p-3">
    <span className="text-sm">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export function ContractorNotificationsPanel({ userId }: ContractorNotificationsPanelProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [channels, setChannels] = React.useState<ContractorNotificationChannels>({
    email: true,
    app: true,
    phoneCall: false,
    sms: false,
  });
  const [radar, setRadar] = React.useState<ContractorRadarSettings>({
    enabled: true,
    minAmountNet: 1000,
    areas: ['Warszawa'],
  });
  const [notifications, setNotifications] = React.useState<NotificationListItem[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [settings, notificationRows] = await Promise.all([
          getContractorAccountSettings(userId),
          getNotifications(userId),
        ]);
        setChannels(settings.notificationChannels);
        setRadar(settings.radar);
        setNotifications(
          notificationRows.slice(0, 6).map((item) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            createdAt: item.created_at,
          }))
        );
      } catch (error) {
        console.error('Error loading contractor notifications panel:', error);
        toast.error('Nie udało się załadować ustawień powiadomień');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [userId]);

  const toggleArea = (area: string, checked: boolean) => {
    setRadar((prev) => {
      const areas = checked ? [...prev.areas, area] : prev.areas.filter((item) => item !== area);
      return {
        ...prev,
        areas: areas.length > 0 ? areas : ['Warszawa'],
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await upsertContractorAccountSettings(userId, {
        notificationChannels: channels,
        radar,
      });
      toast.success('Ustawienia powiadomień zostały zapisane');
    } catch (error) {
      console.error('Error saving contractor notifications settings:', error);
      toast.error('Nie udało się zapisać ustawień powiadomień');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Ładowanie powiadomień...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Zgody na Powiadomienia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NotificationChannelField
            label="Mail"
            checked={channels.email}
            onChange={(checked) => setChannels((prev) => ({ ...prev, email: checked }))}
          />
          <NotificationChannelField
            label="Aplikacja"
            checked={channels.app}
            onChange={(checked) => setChannels((prev) => ({ ...prev, app: checked }))}
          />
          <NotificationChannelField
            label="Rozmowa telefoniczna"
            checked={channels.phoneCall}
            onChange={(checked) => setChannels((prev) => ({ ...prev, phoneCall: checked }))}
          />
          <NotificationChannelField
            label="Wiadomości tel. (SMS)"
            checked={channels.sms}
            onChange={(checked) => setChannels((prev) => ({ ...prev, sms: checked }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radar className="h-4 w-4" />
            Radar nowych zgłoszeń
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Włącz radar</p>
              <p className="text-xs text-muted-foreground">Monitoruje nowe zgłoszenia według Twoich filtrów</p>
            </div>
            <Switch
              checked={radar.enabled}
              onCheckedChange={(checked) => setRadar((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-net-amount">Powiadamiaj o zgłoszeniach powyżej kwoty netto (PLN)</Label>
            <Input
              id="min-net-amount"
              type="number"
              min={0}
              value={radar.minAmountNet}
              onChange={(event) =>
                setRadar((prev) => ({
                  ...prev,
                  minAmountNet: Math.max(0, Number(event.target.value || 0)),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Obszar powiadomień</Label>
            <div className="space-y-2 rounded-md border p-3">
              {AVAILABLE_AREAS.map((area) => (
                <label key={area} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={radar.areas.includes(area)}
                    onCheckedChange={(checked) => toggleArea(area, Boolean(checked))}
                  />
                  {area}
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            Zapisz ustawienia
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista powiadomień</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak powiadomień.</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{notification.title}</p>
                {notification.message ? <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString('pl-PL')}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

