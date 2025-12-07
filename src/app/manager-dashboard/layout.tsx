import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../lib/database/companies';
import { ManagerDashboardHeader } from '../../components/manager-dashboard/ManagerDashboardHeader';
import { ManagerDashboardNav } from '../../components/manager-dashboard/ManagerDashboardNav';

export default async function ManagerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirectTo=/manager-dashboard');
  }

  // Fetch company data
  const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
  
  // Get user email from auth user
  const userEmail = user.email;

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerDashboardHeader 
        company={company}
        userEmail={userEmail}
        userCompany={null}
      />
      <ManagerDashboardNav />
      {children}
    </div>
  );
}
