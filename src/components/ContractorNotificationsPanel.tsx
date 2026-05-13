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
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

interface ContractorNotificationsPanelProps {
  userId: string;
}

/** Radar UI is disabled until the feature ships; preferences still persist server-side when re-enabled. */
const RADAR_COMING_SOON = true;

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
  disabled,
  rightSlot,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}) => (
  <div
    className={`flex items-center justify-between rounded-md border p-3 gap-3 ${disabled ? 'bg-muted/40' : ''}`}
  >
    <div className="flex items-center gap-2 flex-wrap min-w-0">
      <span className="text-sm font-medium">{label}</span>
      {rightSlot}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);

const SoonBadge = () => (
  <Badge variant="secondary" className="text-[10px] font-semibold tracking-wide shrink-0">
    SOON!
  </Badge>
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
        setChannels({
          email: settings.notificationChannels.email,
          app: settings.notificationChannels.app,
          phoneCall: false,
          sms: false,
        });
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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await upsertContractorAccountSettings(userId, {
        notificationChannels: {
          email: channels.email,
          app: channels.app,
          phoneCall: false,
          sms: false,
        },
        ...(RADAR_COMING_SOON ? {} : { radar }),
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
            label="SMS"
            checked={false}
            onChange={() => {}}
            disabled
            rightSlot={<SoonBadge />}
          />
          <Button onClick={handleSave} disabled={isSaving}>
            Zapisz ustawienia
          </Button>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radar className="h-4 w-4" />
            Radar nowych zgłoszeń
          </CardTitle>
          <SoonBadge />
        </CardHeader>
        <CardContent className="pointer-events-none select-none space-y-4 opacity-55" aria-hidden>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Włącz radar</p>
              <p className="text-xs text-muted-foreground">Monitoruje nowe zgłoszenia według Twoich filtrów</p>
            </div>
            <Switch checked={radar.enabled} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-net-amount">Powiadaj o zgłoszeniach powyżej kwoty netto (PLN)</Label>
            <Input id="min-net-amount" type="number" min={0} value={radar.minAmountNet} disabled />
          </div>

          <div className="space-y-2">
            <Label>Obszar powiadomień</Label>
            <div className="space-y-2 rounded-md border p-3">
              {AVAILABLE_AREAS.map((area) => (
                <label key={area} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={radar.areas.includes(area)} disabled />
                  {area}
                </label>
              ))}
            </div>
          </div>
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
                {notification.message ? (
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                ) : null}
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
