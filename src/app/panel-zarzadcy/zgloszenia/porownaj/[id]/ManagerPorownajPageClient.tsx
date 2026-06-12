'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ManagerOfferCompareClient } from '../../../../../components/manager-dashboard/ManagerOfferCompareClient';

export function ManagerPorownajPageClient(): React.ReactElement {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const typ = searchParams.get('typ');
  const kind = typ === 'przetarg' ? 'contest' : 'job';

  return <ManagerOfferCompareClient submissionId={id} kind={kind} />;
}
