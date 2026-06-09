import { redirect } from 'next/navigation';

interface LegacyPorownajPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ typ?: string }>;
}

export default async function LegacyPorownajPage({
  params,
  searchParams,
}: LegacyPorownajPageProps): Promise<never> {
  const { id } = await params;
  const { typ } = await searchParams;
  if (typ === 'zgłoszenie') {
    redirect(`/panel-zarzadcy/zlecenia/${id}/applications`);
  }
  redirect(`/panel-zarzadcy/konkursy/porownaj/${id}`);
}
