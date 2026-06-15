import Link from 'next/link';
import { StaticInfoPage, staticInfoMetadata } from '../../components/StaticInfoPage';
import { routes } from '../../lib/routes';

export const metadata = staticInfoMetadata(
  'Kontakt',
  'Skontaktuj się z zespołem Vestiqo.',
);

export default function ContactPage() {
  return (
    <StaticInfoPage
      title="Kontakt"
      description="Masz pytania? Napisz do nas — chętnie pomożemy."
    >
      <p>
        W sprawach ogólnych, wsparcia technicznego oraz współpracy biznesowej prosimy
        o kontakt mailowy:
      </p>
      <p>
        <a
          href="mailto:kontakt@vestiqo.pl"
          className="font-medium text-primary hover:underline"
        >
          kontakt@vestiqo.pl
        </a>
      </p>
      <p>
        Przed wysłaniem wiadomości warto sprawdzić sekcję{' '}
        <Link href={routes.faq} className="font-medium text-primary hover:underline">
          Najczęściej zadawane pytania
        </Link>
        .
      </p>
    </StaticInfoPage>
  );
}
