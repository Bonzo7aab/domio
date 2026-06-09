import { redirect } from 'next/navigation';

/** @deprecated Use /dodaj-konkurs */
export default function LegacyPostJobPage() {
  redirect('/dodaj-konkurs');
}
