import { createClient } from '../../../lib/supabase/server';
import { fetchManagerById } from '../../../lib/database/managers';
import { ManagerProfileHeader } from '../../../components/managers/ManagerProfileHeader';
import { ManagerProfileNav } from '../../../components/managers/ManagerProfileNav';

export default async function ManagerProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Await params in Next.js 16+
  const { id } = await params;
  
  // Fetch manager profile using server-side Supabase client
  const supabase = await createClient();
  const profile = await fetchManagerById(id, supabase);

  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerProfileHeader profile={profile} />
      <ManagerProfileNav managerId={id} />
      {children}
    </div>
  );
}

