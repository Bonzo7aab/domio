import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { buildEvaluationContext } from '../../lib/flagship/context';
import { isOrdersFeatureEnabled } from '../../lib/flagship/orders-feature';
import { UserAccountHeader } from '../../components/UserAccountHeader';
import { ManagerDashboardNav } from '../../components/manager-dashboard/ManagerDashboardNav';

export default async function ManagerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/logowanie?redirectTo=/panel-zarzadcy');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type, platform_role')
    .eq('id', user.id)
    .maybeSingle();

  const showOrders = await isOrdersFeatureEnabled(
    buildEvaluationContext({
      id: user.id,
      email: user.email,
      userType: profile?.user_type,
      platformRole: profile?.platform_role ?? undefined,
    }),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <UserAccountHeader />
      <ManagerDashboardNav showOrders={showOrders} />
      {children}
    </div>
  );
}
