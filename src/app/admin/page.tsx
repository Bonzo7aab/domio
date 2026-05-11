import Link from 'next/link';
import { requirePlatformAdmin } from '../../lib/admin/require-platform-admin';
import { fetchAdminDashboardMetrics } from '../../lib/database/admin-metrics';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default async function AdminHomePage() {
  const { supabase } = await requirePlatformAdmin('/admin');
  const metrics = await fetchAdminDashboardMetrics(supabase);

  const postsNoOffers = metrics.activeJobsWithoutApplications + metrics.activeTendersWithoutBids;
  const staleOffers = metrics.staleJobApplications + metrics.staleTenderBids;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Monitor jakości rynku: zgłoszenia bez ofert, opóźniona akceptacja, zbliżające się końce polis OC.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zgłoszenia bez ofert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{postsNoOffers}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Zlecenia: {metrics.activeJobsWithoutApplications}, przetargi: {metrics.activeTendersWithoutBids}
            </p>
            <Link href="/admin/listings" className="mt-2 inline-block text-sm text-primary underline">
              Moderuj listingu →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Oferty &gt; 48 h bez akceptacji zarządcy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{staleOffers}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Aplikacje: {metrics.staleJobApplications}, przetargi: {metrics.staleTenderBids}
            </p>
            <Link href="/admin/offers" className="mt-2 inline-block text-sm text-primary underline">
              Moderuj oferty →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Polisy OC wygasające (7 dni)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{metrics.contractorsOcExpiring7d}</div>
            <Link href="/admin/verification" className="mt-2 inline-block text-sm text-primary underline">
              Kolejka weryfikacji →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
