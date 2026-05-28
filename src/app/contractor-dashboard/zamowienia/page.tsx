import type { ReactElement } from 'react';
import { createClient } from '../../../lib/supabase/server';
import { fetchContractorOrders } from '../../../lib/database/contractor-orders';
import { ContractorZamowieniaContent } from '../../../components/contractor-dashboard/ContractorZamowieniaContent';

export default async function ContractorZamowieniaPage(): Promise<ReactElement> {
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

  const orders = await fetchContractorOrders(supabase, user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ContractorZamowieniaContent orders={orders} />
    </div>
  );
}
