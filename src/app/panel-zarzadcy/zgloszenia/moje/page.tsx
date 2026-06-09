import { redirect } from 'next/navigation';

export default function MojeZgloszeniaRedirectPage(): never {
  redirect('/panel-zarzadcy/zgloszenia');
}
