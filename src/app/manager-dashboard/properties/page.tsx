import { Suspense } from 'react';
import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { fetchCompanyBuildings } from '../../../lib/database/buildings';
import { Card, CardContent } from '../../../components/ui/card';
import { PropertiesContent } from './PropertiesContent';

async function getPropertiesData(userId: string) {
  const supabase = await createClient();
  
  // Fetch company
  const { data: company } = await fetchUserPrimaryCompany(supabase, userId);
  if (!company) {
    return null;
  }

  // Fetch buildings
  const { data: buildings, error: buildingsError } = await fetchCompanyBuildings(supabase, company.id);
  
  if (buildingsError) {
    console.error('Error fetching buildings:', buildingsError);
    return { buildings: [] };
  }

  return { buildings: buildings || [] };
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
async function PropertiesDataFetcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const propertiesData = await getPropertiesData(user.id);

  if (!propertiesData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.</p>
        </CardContent>
      </Card>
    );
  }

  return <PropertiesContent buildings={propertiesData.buildings} />;
}

// Page component - renders immediately
export default function PropertiesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={<LoadingFallback message="Ładowanie budynków..." />}>
        <PropertiesDataFetcher />
      </Suspense>
    </div>
  );
}
