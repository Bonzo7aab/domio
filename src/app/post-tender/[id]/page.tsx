import { redirect } from 'next/navigation';

interface PostTenderEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostTenderEditPage({ params }: PostTenderEditPageProps) {
  const { id } = await params;
  redirect(`/post-contest/${id}`);
}
