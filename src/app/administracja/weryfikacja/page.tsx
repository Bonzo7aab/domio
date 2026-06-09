import { requirePlatformAdmin } from '../../../lib/admin/require-platform-admin';
import {
  fetchApprovedVerificationQueue,
  fetchPendingVerificationQueue,
  fetchRejectedVerificationQueue,
} from '../../../lib/database/admin-verification';
import { VerificationQueueTabs } from '../../../components/admin/VerificationQueueTabs';

export default async function AdminVerificationQueuePage() {
  const { supabase } = await requirePlatformAdmin('/admin/verification');
  const [pending, rejected, approved] = await Promise.all([
    fetchPendingVerificationQueue(supabase),
    fetchRejectedVerificationQueue(supabase),
    fetchApprovedVerificationQueue(supabase),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Weryfikacja użytkowników</h2>
      <p className="text-sm text-muted-foreground">
        Wszyscy zarządcy i wykonawcy oczekujący na decyzję są widoczni w zakładce „W toku”, także bez
        przesłanych dokumentów.
      </p>
      <VerificationQueueTabs pending={pending} rejected={rejected} approved={approved} />
    </div>
  );
}
