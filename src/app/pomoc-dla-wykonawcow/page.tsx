import Link from 'next/link';
import { StaticInfoPage, staticInfoMetadata } from '../../components/StaticInfoPage';
import { routes } from '../../lib/routes';

export const metadata = staticInfoMetadata(
  'Pomoc dla Wykonawców',
  'Wsparcie dla firm wykonawczych korzystających z Vestiqo.',
);

export default function ContractorHelpPage() {
  return (
    <StaticInfoPage
      title="Pomoc dla Wykonawców"
      description="Wsparcie dla firm wykonawczych korzystających z Vestiqo."
    >
      <p>
        Jako wykonawca możesz przeglądać aktywne konkursy, składać oferty, śledzić
        status zgłoszeń i budować relacje z zarządcami nieruchomości.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <Link href={routes.home} className="text-primary hover:underline">
            Przeglądaj konkursy
          </Link>
        </li>
        <li>
          <Link href={routes.panelWykonawcy} className="text-primary hover:underline">
            Przejdź do panelu wykonawcy
          </Link>
        </li>
        <li>
          <Link href={routes.rejestracja} className="text-primary hover:underline">
            Załóż konto wykonawcy
          </Link>
        </li>
      </ul>
    </StaticInfoPage>
  );
}
