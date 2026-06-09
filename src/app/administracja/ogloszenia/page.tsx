import { requirePlatformAdmin } from '../../../lib/admin/require-platform-admin';
import { fetchAdminJobListings, fetchAdminTenderListings } from '../../../lib/database/admin-listings';
import { ListingsModerationPanel } from '../../../components/admin/ListingsModerationPanel';

export default async function AdminListingsPage() {
  const { supabase } = await requirePlatformAdmin('/administracja/ogloszenia');
  const [jobs, tenders] = await Promise.all([
    fetchAdminJobListings(supabase),
    fetchAdminTenderListings(supabase),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Moderacja zgłoszeń zarządców</h2>
      <ListingsModerationPanel jobs={jobs} tenders={tenders} />
    </div>
  );
}
