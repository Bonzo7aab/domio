import { StaticInfoPage, staticInfoMetadata } from '../../components/StaticInfoPage';

export const metadata = staticInfoMetadata(
  'O nas',
  'Poznaj Vestiqo — platformę do profesjonalnego zarządzania konkursami w nieruchomościach.',
);

export default function AboutPage() {
  return (
    <StaticInfoPage
      title="O nas"
      description="Poznaj Vestiqo — platformę do profesjonalnego zarządzania konkursami w nieruchomościach."
    >
      <p>
        Vestiqo łączy wspólnoty mieszkaniowe, spółdzielnie i zarządców nieruchomości
        z wykwalifikowanymi wykonawcami. Umożliwiamy przejrzyste prowadzenie konkursów
        ofert, porównywanie propozycji i bezpieczną współpracę na każdym etapie inwestycji.
      </p>
      <p>
        Naszym celem jest uporządkowanie procesu wyboru wykonawców w branży nieruchomości
        — od drobnych remontów po większe projekty modernizacyjne.
      </p>
    </StaticInfoPage>
  );
}
