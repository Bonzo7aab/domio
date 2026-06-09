import { requirePlatformAdmin } from '../../../lib/admin/require-platform-admin';
import { fetchAdminJobApplications, fetchAdminTenderBids } from '../../../lib/database/admin-offers';
import { OffersModerationPanel } from '../../../components/admin/OffersModerationPanel';

export default async function AdminOffersPage() {
  const { supabase } = await requirePlatformAdmin('/administracja/oferty');
  const [applications, bids] = await Promise.all([
    fetchAdminJobApplications(supabase),
    fetchAdminTenderBids(supabase),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Moderacja ofert wykonawców</h2>
      <OffersModerationPanel applications={applications} bids={bids} />
    </div>
  );
}
