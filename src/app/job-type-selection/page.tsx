'use client'

import JobTypeSelectionPage from '../../components/JobTypeSelectionPage';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { fetchUserPrimaryCompany } from '../../lib/database/companies';
import { toast } from 'sonner';

export default function JobTypeSelection() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [isCheckingCompany, setIsCheckingCompany] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login with return path
      router.push(`/login?redirectTo=${encodeURIComponent('/job-type-selection')}`);
    }
  }, [user, isLoading, router]);

  // Check if user has a company (only for managers)
  useEffect(() => {
    const checkCompany = async () => {
      if (!user?.id || user.userType !== 'manager') {
        setHasCompany(null);
        setIsCheckingCompany(false);
        return;
      }
      
      setIsCheckingCompany(true);
      try {
        const supabase = createClient();
        const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);
        setHasCompany(!!company);
      } catch (error) {
        console.error('Error checking company:', error);
        setHasCompany(false);
      } finally {
        setIsCheckingCompany(false);
      }
    };
    
    checkCompany();
  }, [user]);

  // Show nothing while checking auth or if not authenticated (will redirect)
  if (isLoading || !user) {
    return null;
  }

  const handleSelectJob = () => {
    // Check if company exists before navigating (for managers)
    if (user?.userType === 'manager') {
      if (hasCompany === false) {
        toast.error('Najpierw musisz dodać dane firmy w profilu');
        router.push('/account?tab=company');
        return;
      }

      // If still checking, wait
      if (isCheckingCompany || hasCompany === null) {
        return;
      }
    }

    router.push('/post-job');
  };

  const handleSelectTender = () => {
    if (user?.userType !== 'manager') {
      router.push('/login');
      return;
    }

    // Check if company exists before navigating
    if (hasCompany === false) {
      toast.error('Najpierw musisz dodać dane firmy w profilu');
      router.push('/account?tab=company');
      return;
    }

    // If still checking, wait
    if (isCheckingCompany || hasCompany === null) {
      return;
    }

    router.push('/manager-dashboard/tenders?create=true');
  };

  return (
    <JobTypeSelectionPage 
      onBack={() => router.push('/')}
      onSelectJob={handleSelectJob}
      onSelectTender={handleSelectTender}
      isAuthenticated={user?.userType === 'manager'}
      userType={user?.userType}
      hasCompany={hasCompany}
      isCheckingCompany={isCheckingCompany}
    />
  );
}
