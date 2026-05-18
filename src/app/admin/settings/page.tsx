import { requirePlatformAdmin } from '../../../lib/admin/require-platform-admin';
import { getRegistrationSettings } from '../../../lib/database/platform-settings';
import { AdminRegistrationSettingsForm } from '../../../components/admin/AdminRegistrationSettingsForm';

export default async function AdminSettingsPage() {
  const { supabase } = await requirePlatformAdmin('/admin/settings');
  const settings = await getRegistrationSettings(supabase);

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Ustawienia platformy</h2>
        <p className="text-sm text-muted-foreground">
          Konfiguracja globalna wpływająca na rejestrację nowych użytkowników.
        </p>
      </div>
      <AdminRegistrationSettingsForm initialSettings={settings} />
    </div>
  );
}
