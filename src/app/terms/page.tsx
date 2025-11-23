import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export const metadata: Metadata = {
  title: 'Warunki użytkowania - Domio',
  description: 'Regulamin korzystania z platformy Domio',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-slate-900">
              Warunki użytkowania
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Postanowienia ogólne</h2>
              <p className="text-slate-700 leading-relaxed">
                Niniejszy Regulamin określa zasady korzystania z platformy Domio, będącej serwisem 
                łączącym zarządców nieruchomości z wykonawcami usług budowlanych i remontowych.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Definicje</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Platforma:</strong> Serwis internetowy Domio dostępny pod adresem [wstawić URL]</li>
                <li><strong>Użytkownik:</strong> Osoba fizyczna, prawna lub jednostka organizacyjna korzystająca z Platformy</li>
                <li><strong>Zarądca:</strong> Użytkownik reprezentujący zarząd nieruchomości lub zarządzający nieruchomościami</li>
                <li><strong>Wykonawca:</strong> Użytkownik świadczący usługi budowlane lub remontowe</li>
                <li><strong>Zlecenie:</strong> Ogłoszenie o potrzebie wykonania usługi zamieszczone przez Zarządcę</li>
                <li><strong>Oferta:</strong> Propozycja wykonania zlecenia złożona przez Wykonawcę</li>
                <li><strong>Przetarg:</strong> Procedura wyboru wykonawcy na podstawie złożonych ofert</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Rejestracja i konto użytkownika</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Korzystanie z pełnych funkcji Platformy wymaga rejestracji konta</li>
                <li>Użytkownik zobowiązany jest podać prawdziwe i aktualne dane</li>
                <li>Użytkownik odpowiada za zachowanie poufności danych logowania</li>
                <li>Zabronione jest udostępnianie konta osobom trzecim</li>
                <li>Platforma zastrzega sobie prawo do weryfikacji danych użytkownika</li>
                <li>Konto może zostać zawieszone lub usunięte w przypadku naruszenia Regulaminu</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Zasady korzystania z Platformy</h2>
              <p className="text-slate-700 leading-relaxed mb-4">Użytkownik zobowiązuje się do:</p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Przestrzegania przepisów prawa</li>
                <li>Niepublikowania treści niezgodnych z prawem lub dobrymi obyczajami</li>
                <li>Niepublikowania treści naruszających prawa osób trzecich</li>
                <li>Nieprowadzenia działalności konkurencyjnej wobec Platformy</li>
                <li>Niepróby obejścia zabezpieczeń Platformy</li>
                <li>Niepublikowania fałszywych informacji o sobie lub swojej działalności</li>
                <li>Niepublikowania treści reklamowych bez zgody Platformy</li>
                <li>Szanowania praw innych użytkowników</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Zlecenia i oferty</h2>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">5.1. Zlecenia Zarządców:</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>Zarządcy mogą publikować zlecenia dotyczące usług budowlanych i remontowych</li>
                <li>Zlecenie powinno zawierać dokładny opis prac, lokalizację, budżet i termin</li>
                <li>Zarządca odpowiada za prawdziwość informacji zawartych w zleceniu</li>
                <li>Platforma nie gwarantuje znalezienia wykonawcy dla każdego zlecenia</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">5.2. Oferty Wykonawców:</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>Wykonawcy mogą składać oferty na zlecenia odpowiadające ich kompetencjom</li>
                <li>Oferta powinna zawierać cenę, termin realizacji i opis proponowanego rozwiązania</li>
                <li>Wykonawca odpowiada za prawdziwość informacji zawartych w ofercie</li>
                <li>Złożenie oferty nie jest równoznaczne z zawarciem umowy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Odpowiedzialność</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Platforma jest wyłącznie miejscem łączącym Zarządców z Wykonawcami. 
                Domio nie ponosi odpowiedzialności za:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Zawartość umów między Użytkownikami</li>
                <li>Jakość wykonanych usług</li>
                <li>Terminy realizacji zleceń</li>
                <li>Wypadki lub szkody powstałe podczas wykonywania usług</li>
                <li>Spory między Użytkownikami</li>
                <li>Naruszenia prawa przez Użytkowników</li>
                <li>Dokładność informacji podanych przez Użytkowników</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-4">
                Wszelkie umowy zawierane są bezpośrednio między Zarządcą a Wykonawcą. 
                Platforma nie jest stroną tych umów.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Model biznesowy</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Konta Zarządców są bezpłatne</li>
                <li>Wykonawcy mogą korzystać z płatnych planów subskrypcyjnych</li>
                <li>Szczegóły dotyczące opłat znajdują się w zakładce Cennik</li>
                <li>Platforma nie pobiera prowizji od transakcji między Użytkownikami</li>
                <li>Platforma zastrzega sobie prawo do zmiany modelu biznesowego z odpowiednim wyprzedzeniem</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Weryfikacja użytkowników</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Platforma oferuje możliwość weryfikacji kont użytkowników poprzez przesłanie dokumentów:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Weryfikacja jest dobrowolna</li>
                <li>Zweryfikowani użytkownicy otrzymują oznaczenie wizualne na profilu</li>
                <li>Zweryfikowani użytkownicy mogą otrzymywać więcej zleceń/ofert</li>
                <li>Dokumenty weryfikacyjne są przetwarzane zgodnie z Polityką Prywatności</li>
                <li>Platforma zastrzega sobie prawo do odmowy weryfikacji bez podania przyczyny</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Recenzje i oceny</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Użytkownicy mogą wystawiać recenzje i oceny po zakończeniu współpracy</li>
                <li>Recenzje powinny być prawdziwe i obiektywne</li>
                <li>Zabronione jest publikowanie recenzji fałszywych lub naruszających dobre imię</li>
                <li>Platforma zastrzega sobie prawo do usunięcia recenzji naruszających Regulamin</li>
                <li>Recenzje są widoczne publicznie na profilach użytkowników</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Prawa autorskie</h2>
              <p className="text-slate-700 leading-relaxed">
                Wszystkie treści zamieszczone na Platformie są chronione prawem autorskim. 
                Użytkownik zachowuje prawa autorskie do treści przez siebie zamieszczonych, 
                udzielając jednocześnie Platformie licencji na ich wykorzystanie w celach 
                funkcjonowania serwisu. Zabronione jest kopiowanie, modyfikowanie lub rozpowszechnianie 
                treści Platformy bez zgody administratora.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Naruszenia Regulaminu</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                W przypadku naruszenia Regulaminu, Platforma może:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Usunąć treści naruszające Regulamin</li>
                <li>Ostrzec użytkownika</li>
                <li>Zawiesić konto użytkownika</li>
                <li>Usunąć konto użytkownika</li>
                <li>Zablokować dostęp do Platformy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Zmiany Regulaminu</h2>
              <p className="text-slate-700 leading-relaxed">
                Administrator zastrzega sobie prawo do zmiany Regulaminu. 
                O zmianach Użytkownicy będą informowani przez Platformę (e-mail, powiadomienie w serwisie). 
                Kontynuacja korzystania z Platformy po wprowadzeniu zmian oznacza ich akceptację. 
                W przypadku braku akceptacji zmian, Użytkownik powinien zaprzestać korzystania z Platformy 
                i usunąć swoje konto.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">13. Postanowienia końcowe</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                W sprawach nieuregulowanych niniejszym Regulaminem mają zastosowanie 
                przepisy prawa polskiego, w szczególności Kodeksu Cywilnego.
              </p>
              <p className="text-slate-700 leading-relaxed mb-4">
                Wszelkie spory wynikające z korzystania z Platformy będą rozstrzygane przez 
                sądy właściwe dla siedziby administratora Platformy.
              </p>
              <p className="text-sm text-slate-600 mt-8 pt-8 border-t border-slate-200">
                Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

