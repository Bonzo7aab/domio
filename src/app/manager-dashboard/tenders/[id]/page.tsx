import { redirect } from 'next/navigation';

interface TenderBidEvaluationPageProps {
  params: Promise<{ id: string }>;
}

export default async function TenderBidEvaluationPage({ params }: TenderBidEvaluationPageProps) {
  const { id } = await params;
  redirect(`/manager-dashboard/konkursy/porownaj/${id}`);
}
