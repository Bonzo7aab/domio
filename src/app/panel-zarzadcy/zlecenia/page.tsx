import { redirect } from 'next/navigation';

/** @deprecated Use /panel-zarzadcy/konkursy */
export default function LegacyManagerJobsPage() {
  redirect('/panel-zarzadcy/konkursy');
}
