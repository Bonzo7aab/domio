import { redirect } from 'next/navigation';

/** @deprecated Use /wybor-typu-konkursu */
export default function LegacyJobTypeSelectionPage() {
  redirect('/wybor-typu-konkursu');
}
