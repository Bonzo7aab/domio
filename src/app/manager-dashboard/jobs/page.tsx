import { Suspense } from 'react';
import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { Card, CardContent } from '../../../components/ui/card';
import { JobsContent } from './JobsContent';
import { budgetFromDatabase } from '../../../types/budget';

async function getJobsData(userId: string) {
  const supabase = await createClient();
  
  // Fetch company
  const { data: company } = await fetchUserPrimaryCompany(supabase, userId);
  if (!company) {
    return null;
  }

  // Fetch all jobs for the company
  const { data: jobsData, error: jobsError } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      budget_min,
      budget_max,
      budget_type,
      currency,
      deadline,
      status,
      job_categories (name),
      location
    `)
    .eq('company_id', company.id)
    .order('created_at', { ascending: false });

  if (jobsError) {
    console.error('Error fetching jobs:', jobsError);
    return { jobs: [], companyId: company.id };
  }

  // Get all job IDs to count applications
  const jobIds = (jobsData || []).map((job: any) => job.id);

  // Count applications for each job
  const applicationCounts: { [key: string]: number } = {};
  if (jobIds.length > 0) {
    const { data: applicationsData } = await (supabase as any)
      .from('job_applications')
      .select('job_id')
      .in('job_id', jobIds);

    if (applicationsData) {
      for (const app of applicationsData) {
        const jobId = app.job_id;
        if (jobId) {
          applicationCounts[jobId] = (applicationCounts[jobId] || 0) + 1;
        }
      }
    }
  }

  // Format jobs for display
  const jobs = (jobsData || []).map((job: any) => {
    const location = typeof job.location === 'string' 
      ? job.location 
      : job.location?.city || 'Nieznana lokalizacja';

    // Format budget
    const budget = budgetFromDatabase({
      budget_min: job.budget_min ?? null,
      budget_max: job.budget_max ?? null,
      budget_type: (job.budget_type || 'fixed') as 'fixed' | 'hourly' | 'negotiable' | 'range',
      currency: job.currency || 'PLN',
    });

    return {
      id: job.id,
      title: job.title,
      category: job.job_categories?.name || 'Inne',
      status: job.status || 'active',
      budget,
      applications: applicationCounts[job.id] || 0,
      deadline: job.deadline || '',
      address: location
    };
  });

  return { jobs, companyId: company.id };
}

// Loading fallback component
function LoadingFallback({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-2 text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Async data fetcher component
async function JobsDataFetcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const jobsData = await getJobsData(user.id);

  if (!jobsData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.</p>
        </CardContent>
      </Card>
    );
  }

  return <JobsContent jobs={jobsData.jobs} companyId={jobsData.companyId} />;
}

// Page component - renders immediately
export default function JobsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={<LoadingFallback message="Ładowanie zleceń..." />}>
        <JobsDataFetcher />
      </Suspense>
    </div>
  );
}
