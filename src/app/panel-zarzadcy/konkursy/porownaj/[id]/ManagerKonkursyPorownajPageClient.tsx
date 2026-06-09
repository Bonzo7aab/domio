'use client';

import { useParams } from 'next/navigation';
import { ManagerOfferCompareClient } from '../../../../../components/manager-dashboard/ManagerOfferCompareClient';

export function ManagerKonkursyPorownajPageClient(): React.ReactElement {
  const params = useParams();
  const id = params.id as string;

  return <ManagerOfferCompareClient submissionId={id} kind="tender" contestMode />;
}
