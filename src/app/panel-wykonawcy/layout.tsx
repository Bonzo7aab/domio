import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../lib/database/companies';
import { fetchContractorById, fetchContractorDashboardStats } from '../../lib/database/contractors';
import { buildEvaluationContext } from '../../lib/flagship/context';
import { isOrdersFeatureEnabled } from '../../lib/flagship/orders-feature';
import { ContractorDashboardHeader } from '../../components/contractor-dashboard/ContractorDashboardHeader';
import { ContractorDashboardNav } from '../../components/contractor-dashboard/ContractorDashboardNav';

export default async function ContractorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check authentication
  // Note: Middleware should handle redirects, but this is a fallback
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    // Use the actual pathname from the request (middleware should have already redirected)
    // This is a fallback in case middleware doesn't catch it
    redirect('/logowanie?redirectTo=/panel-wykonawcy');
  }

  // Fetch company data
  const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
  
  if (companyError || !company) {
    // Redirect to account page to set up company
    redirect('/konto?tab=company');
  }

  // Fetch contractor profile
  const contractorProfile = await fetchContractorById(company.id);
  
  // Fetch stats for header (rating, completed projects)
  let stats = null;
  try {
    const dashboardData = await fetchContractorDashboardStats(supabase, company.id, user.id);
    stats = {
      averageRating: dashboardData.stats.averageRating,
      completedProjects: dashboardData.stats.completedProjects,
    };
  } catch (error) {
    console.error('Error fetching contractor stats for header:', error);
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_type, platform_role')
    .eq('id', user.id)
    .maybeSingle();

  const showOrders = await isOrdersFeatureEnabled(
    buildEvaluationContext({
      id: user.id,
      email: user.email,
      userType: userProfile?.user_type,
      platformRole: userProfile?.platform_role ?? undefined,
    }),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ContractorDashboardHeader 
        profile={contractorProfile}
        stats={stats}
      />
      <ContractorDashboardNav showOrders={showOrders} />
      {children}
    </div>
  );
}

