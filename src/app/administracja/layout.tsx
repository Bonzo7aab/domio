import Link from 'next/link';
import { headers } from 'next/headers';
import { requirePlatformAdmin } from '../../lib/admin/require-platform-admin';
import { AdminNav } from '../../components/admin/AdminNav';
import { Button } from '../../components/ui/button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const redirectTo = headerStore.get('x-pathname') ?? '/administracja';
  const session = await requirePlatformAdmin(redirectTo);
  const email = session.email ?? '';

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Panel administracyjny</h1>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Wróć do strony głównej</Link>
            </Button>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
