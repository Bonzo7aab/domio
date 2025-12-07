import { Suspense } from 'react';
import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { fetchContractorsByWorkHistory } from '../../../lib/database/contractors';
import { Card, CardContent } from '../../../components/ui/card';
import { ContractorsContent } from './ContractorsContent';

async function getContractorsData(userId: string) {
  const supabase = await createClient();
  
  // Fetch company
  const { data: company } = await fetchUserPrimaryCompany(supabase, userId);
  if (!company) {
    return null;
  }

  // Fetch contractors
  try {
    const contractors = await fetchContractorsByWorkHistory(supabase, company.id);
    return { contractors };
  } catch (error) {
    console.error('Error fetching contractors:', error);
    return { contractors: [] };
  }
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
async function ContractorsDataFetcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const contractorsData = await getContractorsData(user.id);

  if (!contractorsData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.</p>
        </CardContent>
      </Card>
    );
  }

  return <ContractorsContent contractors={contractorsData.contractors} />;
}

// Page component - renders immediately
export default function ContractorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={<LoadingFallback message="Ładowanie wykonawców..." />}>
        <ContractorsDataFetcher />
      </Suspense>
    </div>
  );
}
