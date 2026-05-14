import { redirect } from 'next/navigation';

export default function NieruchomosciZgloszeniaRedirectPage(): never {
  redirect('/manager-dashboard/overview');
}
