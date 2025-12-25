import { Suspense } from 'react';
import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { fetchCompanyBuildings } from '../../../lib/database/buildings';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { OverviewContent } from './OverviewContent';
import { budgetFromDatabase } from '../../../types/budget';
import Link from 'next/link';

async function getOverviewData(userId: string) {
  const supabase = await createClient();
  
  // Fetch company
  const { data: company } = await fetchUserPrimaryCompany(supabase, userId);
  if (!company) {
    return null;
  }

  // Fetch all data in parallel
  const [buildingsResult, activeJobsResult, completedJobsResult, recentJobsResult] = await Promise.all([
    fetchCompanyBuildings(supabase, company.id),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('status', 'active'),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('status', 'completed'),
    supabase
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
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const buildings = buildingsResult.data || [];
  const buildingsCount = buildings.length;
  const totalUnits = buildings.reduce((sum, b) => sum + (b.units_count || 0), 0);
  const activeJobsCount = activeJobsResult.count || 0;
  const completedJobsCount = completedJobsResult.count || 0;

  // Format recent jobs
  const recentJobs = (recentJobsResult.data || []).map((job: any) => {
    const location = typeof job.location === 'string' 
      ? job.location 
      : job.location?.city || 'Nieznana lokalizacja';
    
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
      applications: 0, // Would need to fetch separately
      deadline: job.deadline || '',
      address: location
    };
  });

  // Mock contractors for now (can be replaced with real query later)
  const contractors = [
    {
      id: '1',
      name: 'Firma Malarze Sp. z o.o.',
      specialization: 'Roboty malarskie',
      rating: 4.8,
      completedJobs: 23,
      currentJob: 'Malowanie klatki schodowej',
      avatar: ''
    },
    {
      id: '2',
      name: 'TechService Windy',
      specialization: 'Konserwacja wind',
      rating: 4.9,
      completedJobs: 15,
      currentJob: 'Przegląd roczny wind',
      avatar: ''
    },
    {
      id: '3',
      name: 'Zielona Firma',
      specialization: 'Utrzymanie zieleni',
      rating: 4.5,
      completedJobs: 31,
      currentJob: 'Przycinanie krzewów',
      avatar: ''
    }
  ];

  return {
    dashboardStats: {
      totalProperties: buildingsCount,
      totalUnits,
      activeJobs: activeJobsCount,
      completedJobs: completedJobsCount,
      avgRating: 4.7, // Mock data - can be calculated from reviews
      monthlyBudget: 125000 // Mock data
    },
    recentJobs,
    contractors: contractors.slice(0, 3)
  };
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
async function OverviewDataFetcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const overviewData = await getOverviewData(user.id);

  if (!overviewData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4 gap-2 flex flex-col justify-center">
          <p className="text-muted-foreground">Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.</p>
          <Link href="/account?tab=company">
            <Button>Dodaj dane firmy w profilu</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <OverviewContent data={overviewData} />;
}

// Page component - renders immediately
export default function OverviewPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={<LoadingFallback message="Ładowanie danych..." />}>
        <OverviewDataFetcher />
      </Suspense>
    </div>
  );
}
