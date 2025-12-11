import { createClient } from '../../../lib/supabase/server';
import { fetchContractorById } from '../../../lib/database/contractors';
import { ContractorProfileHeader } from '../../../components/contractors/ContractorProfileHeader';
import { ContractorProfileNav } from '../../../components/contractors/ContractorProfileNav';

export default async function ContractorProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Await params in Next.js 16+
  const { id } = await params;
  
  // Fetch contractor profile using server-side Supabase client
  const supabase = await createClient();
  const profile = await fetchContractorById(id, supabase);

  return (
    <div className="min-h-screen bg-gray-50">
      <ContractorProfileHeader profile={profile} />
      <ContractorProfileNav contractorId={id} />
      {children}
    </div>
  );
}
