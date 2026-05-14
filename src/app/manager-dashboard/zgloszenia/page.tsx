import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { fetchManagerSubmissions } from '../../../lib/database/manager-submissions';
import { ManagerMojeZgloszeniaContent } from '../../../components/manager-dashboard/ManagerMojeZgloszeniaContent';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import type { ReactElement } from 'react';

export default async function ZgloszeniaPage(): Promise<ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Wymagane logowanie.</p>
      </div>
    );
  }

  const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4 flex flex-col items-center">
            <p className="text-muted-foreground">Najpierw uzupełnij dane firmy w profilu.</p>
            <Button asChild>
              <Link href="/account?tab=company">Przejdź do konta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submissions = await fetchManagerSubmissions(supabase, company.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold">Zgłoszenia</h1>
        <Button asChild>
          <Link href="/post-job?from=zgloszenia">Dodaj zgłoszenie</Link>
        </Button>
      </div>
      <ManagerMojeZgloszeniaContent submissions={submissions} />
    </div>
  );
}
