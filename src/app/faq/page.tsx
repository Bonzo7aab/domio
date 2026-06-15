import Link from 'next/link';
import { StaticInfoPage, staticInfoMetadata } from '../../components/StaticInfoPage';
import { routes } from '../../lib/routes';

export const metadata = staticInfoMetadata(
  'Najczęściej zadawane pytania',
  'Odpowiedzi na najczęstsze pytania dotyczące Vestiqo.',
);

const faqItems = [
  {
    question: 'Czym jest Vestiqo?',
    answer:
      'Vestiqo to platforma do zarządzania konkursami ofert w nieruchomościach — dla wspólnot, spółdzielni, zarządców i wykonawców.',
  },
  {
    question: 'Kto może publikować konkurs?',
    answer:
      'Konkursy mogą tworzyć zarządcy nieruchomości oraz podmioty reprezentujące wspólnoty i spółdzielnie mieszkaniowe.',
  },
  {
    question: 'Jak wykonawca może złożyć ofertę?',
    answer:
      'Wykonawca zakłada konto, uzupełnia profil firmy i składa ofertę bezpośrednio w wybranym konkursie na platformie.',
  },
  {
    question: 'Gdzie znajdę regulamin i politykę prywatności?',
    answer: 'Dokumenty są dostępne w stopce serwisu.',
  },
];

export default function FaqPage() {
  return (
    <StaticInfoPage
      title="Najczęściej zadawane pytania"
      description="Odpowiedzi na najczęstsze pytania dotyczące Vestiqo."
    >
      <div className="space-y-6">
        {faqItems.map((item) => (
          <section key={item.question}>
            <h2 className="text-lg font-semibold text-[hsl(var(--brand-navy))]">
              {item.question}
            </h2>
            <p>{item.answer}</p>
          </section>
        ))}
      </div>
      <p>
        Nie znalazłeś odpowiedzi?{' '}
        <Link href={routes.kontakt} className="font-medium text-primary hover:underline">
          Skontaktuj się z nami
        </Link>
        .
      </p>
    </StaticInfoPage>
  );
}
