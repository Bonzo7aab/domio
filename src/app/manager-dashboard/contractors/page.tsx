import { redirect } from 'next/navigation';

/** OPD-42: Wykonawcy tab removed — redirect legacy URL. */
export default function ManagerContractorsRedirectPage(): never {
  redirect('/manager-dashboard/konkursy');
}
