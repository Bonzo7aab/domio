import { Suspense } from 'react';
import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { fetchContractorRatingSummary, fetchContractorReviews } from '../../../lib/database/contractors';
import { Card, CardContent } from '../../../components/ui/card';
import { RatingsContent } from './RatingsContent';

async function getRatingsData(userId: string) {
  const supabase = await createClient();
  
  // Fetch company
  const { data: company } = await fetchUserPrimaryCompany(supabase, userId);
  if (!company) {
    return null;
  }

  // Fetch all data in parallel
  const [ratingSummary, reviews] = await Promise.all([
    fetchContractorRatingSummary(company.id),
    fetchContractorReviews(company.id, 20),
  ]);

  return {
    ratingSummary,
    reviews: reviews || [],
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
async function RatingsDataFetcher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const ratingsData = await getRatingsData(user.id);

  if (!ratingsData) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <RatingsContent 
      ratingSummary={ratingsData.ratingSummary}
      reviews={ratingsData.reviews}
    />
  );
}

// Page component - renders immediately
export default function RatingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Suspense fallback={<LoadingFallback message="Ładowanie ocen..." />}>
        <RatingsDataFetcher />
      </Suspense>
    </div>
  );
}

