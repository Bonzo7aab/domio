import { redirect } from 'next/navigation';

export default function MojeZgloszeniaRedirectPage(): never {
  redirect('/manager-dashboard/zgloszenia');
}
