import Link from 'next/link';
import { StaticInfoPage, staticInfoMetadata } from '../../components/StaticInfoPage';
import { routes } from '../../lib/routes';

export const metadata = staticInfoMetadata(
  'Pomoc dla Zarządców',
  'Wsparcie dla zarządców nieruchomości korzystających z Vestiqo.',
);

export default function ManagerHelpPage() {
  return (
    <StaticInfoPage
      title="Pomoc dla Zarządców"
      description="Wsparcie dla zarządców nieruchomości korzystających z Vestiqo."
    >
      <p>
        Jako zarządca możesz tworzyć konkursy, zbierać oferty wykonawców, porównywać
        propozycje i wybierać najlepszego partnera do realizacji inwestycji.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <Link href={routes.wyborTypuKonkursu} className="text-primary hover:underline">
            Utwórz nowy konkurs
          </Link>
        </li>
        <li>
          <Link href={routes.panelZarzadcy} className="text-primary hover:underline">
            Przejdź do panelu zarządcy
          </Link>
        </li>
        <li>
          <Link href={routes.samouczek} className="text-primary hover:underline">
            Samouczek platformy
          </Link>
        </li>
      </ul>
    </StaticInfoPage>
  );
}
