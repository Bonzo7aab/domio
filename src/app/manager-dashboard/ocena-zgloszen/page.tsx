import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { fetchContractorReviews } from '../../../lib/database/contractors';
import { fetchReviewsWrittenByManagerUser } from '../../../lib/database/manager-reviews';
import { ManagerRatingsOcenaContent } from '../../../components/manager-dashboard/ManagerRatingsOcenaContent';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import type { ReactElement } from 'react';

export default async function OcenaZgloszenPage(): Promise<ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Wymagane logowanie.</p>
      </div>
    );
  }

  const { data: company } = await fetchUserPrimaryCompany(supabase, user.id);

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-4 flex flex-col items-center">
            <p className="text-muted-foreground">Najpierw uzupełnij dane firmy w profilu.</p>
            <Button asChild>
              <Link href="/account?tab=company">Przejdź do konta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [written, received] = await Promise.all([
    fetchReviewsWrittenByManagerUser(supabase, user.id),
    fetchContractorReviews(company.id, 50, 0),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ManagerRatingsOcenaContent written={written} received={received} />
    </div>
  );
}
