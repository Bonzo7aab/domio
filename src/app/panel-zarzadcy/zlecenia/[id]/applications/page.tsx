import { redirect } from 'next/navigation';

interface LegacyApplicationsPageProps {
  params: Promise<{ id: string }>;
}

/** @deprecated Use /panel-zarzadcy/konkursy/[id]/aplikacje */
export default async function LegacyJobApplicationsPage({
  params,
}: LegacyApplicationsPageProps): Promise<never> {
  const { id } = await params;
  redirect(`/panel-zarzadcy/konkursy/${id}/aplikacje`);
}
