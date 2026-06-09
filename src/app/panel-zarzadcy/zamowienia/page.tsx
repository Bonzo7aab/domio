import Link from 'next/link';
import type { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { fetchManagerOrders } from '../../../lib/database/manager-orders';
import { isOrdersFeatureEnabledForAuthUser } from '../../../lib/flagship/orders-feature';
import { ManagerZamowieniaContent } from '../../../components/manager-dashboard/ManagerZamowieniaContent';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

export default async function ManagerZamowieniaPage(): Promise<ReactElement> {
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

  if (!(await isOrdersFeatureEnabledForAuthUser(supabase, user))) {
    redirect('/manager-dashboard/overview');
  }

  const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4 flex flex-col items-center">
            <p className="text-muted-foreground">Najpierw uzupełnij dane firmy w profilu.</p>
            <Button asChild>
              <Link href="/account">Przejdź do konta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = await fetchManagerOrders(supabase, company.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ManagerZamowieniaContent orders={orders} />
    </div>
  );
}
