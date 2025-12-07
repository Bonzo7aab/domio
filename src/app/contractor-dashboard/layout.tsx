import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../lib/database/companies';
import { fetchContractorById, fetchContractorDashboardStats } from '../../lib/database/contractors';
import { ContractorDashboardHeader } from '../../components/contractor-dashboard/ContractorDashboardHeader';
import { ContractorDashboardNav } from '../../components/contractor-dashboard/ContractorDashboardNav';

export default async function ContractorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirectTo=/contractor-dashboard');
  }

  // Fetch company data
  const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
  
  if (companyError || !company) {
    // Redirect to account page to set up company
    redirect('/account?tab=company');
  }

  // Fetch contractor profile
  const profile = await fetchContractorById(company.id);
  
  // Fetch stats for header (rating, completed projects)
  let stats = null;
  try {
    const dashboardData = await fetchContractorDashboardStats(supabase, company.id);
    stats = {
      averageRating: dashboardData.stats.averageRating,
      completedProjects: dashboardData.stats.completedProjects,
    };
  } catch (error) {
    console.error('Error fetching contractor stats for header:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ContractorDashboardHeader 
        profile={profile}
        stats={stats}
      />
      <ContractorDashboardNav />
      {children}
    </div>
  );
}

