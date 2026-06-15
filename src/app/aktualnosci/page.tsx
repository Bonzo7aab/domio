import { StaticInfoPage, staticInfoMetadata } from '../../components/StaticInfoPage';

export const metadata = staticInfoMetadata(
  'Aktualności',
  'Nowości i informacje z platformy Vestiqo.',
);

export default function NewsPage() {
  return (
    <StaticInfoPage
      title="Aktualności"
      description="Nowości i informacje z platformy Vestiqo."
    >
      <p>
        Wkrótce opublikujemy tutaj aktualności dotyczące rozwoju platformy, nowych
        funkcji oraz wydarzeń branżowych.
      </p>
    </StaticInfoPage>
  );
}
