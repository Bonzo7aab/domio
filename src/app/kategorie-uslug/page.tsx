import Link from 'next/link';
import { StaticInfoPage, staticInfoMetadata } from '../../components/StaticInfoPage';
import { routes } from '../../lib/routes';

export const metadata = staticInfoMetadata(
  'Kategorie usług',
  'Przeglądaj konkursy według kategorii usług w Vestiqo.',
);

export default function ServiceCategoriesPage() {
  return (
    <StaticInfoPage
      title="Kategorie usług"
      description="Przeglądaj konkursy według kategorii usług w Vestiqo."
    >
      <p>
        Kategorie usług są dostępne na stronie głównej — pozwalają szybko filtrować
        konkursy według branży, np. remonty, instalacje, utrzymanie czystości czy
        prace ogrodnicze.
      </p>
      <p>
        <Link href={routes.home} className="font-medium text-primary hover:underline">
          Przejdź do listy konkursów
        </Link>
      </p>
    </StaticInfoPage>
  );
}
