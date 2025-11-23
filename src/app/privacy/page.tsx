import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export const metadata: Metadata = {
  title: 'Polityka prywatności - Domio',
  description: 'Polityka prywatności i ochrona danych osobowych zgodnie z RODO',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-slate-900">
              Polityka prywatności
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Informacje ogólne</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych 
                użytkowników serwisu Domio (dalej: "Platforma" lub "Serwis") w związku z korzystaniem 
                z Platformy zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 
                z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem 
                danych osobowych i w sprawie swobodnego przepływu takich danych (RODO).
              </p>
              <p className="text-slate-700 leading-relaxed">
                Administratorem danych osobowych jest Domio [wstawić dane firmy: nazwa, adres, NIP, email].
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Podstawa prawna przetwarzania danych</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Przetwarzamy dane osobowe na następujących podstawach prawnych:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Art. 6 ust. 1 lit. a RODO - zgoda użytkownika (rejestracja konta, newsletter)</li>
                <li>Art. 6 ust. 1 lit. b RODO - wykonanie umowy (świadczenie usług platformy)</li>
                <li>Art. 6 ust. 1 lit. f RODO - uzasadniony interes administratora (weryfikacja użytkowników, bezpieczeństwo platformy)</li>
                <li>Art. 6 ust. 1 lit. c RODO - obowiązek prawny (np. prowadzenie dokumentacji)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Zakres przetwarzanych danych</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Przetwarzamy następujące kategorie danych osobowych:
              </p>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">3.1. Dane rejestracyjne i profilowe:</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>Imię i nazwisko</li>
                <li>Adres e-mail</li>
                <li>Numer telefonu</li>
                <li>Typ konta (zarządca/wykonawca)</li>
                <li>Nazwa firmy/organizacji</li>
                <li>Hasło (zahashowane)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">3.2. Dane dotyczące działalności:</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>Informacje o firmie (NIP, adres, dane rejestrowe)</li>
                <li>Certyfikaty i uprawnienia</li>
                <li>Portfolio i referencje</li>
                <li>Dokumenty weryfikacyjne</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 mb-3">3.3. Dane związane z korzystaniem z platformy:</h3>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li>Historia zleceń i ofert</li>
                <li>Wiadomości między użytkownikami</li>
                <li>Recenzje i oceny</li>
                <li>Lokalizacja (dla funkcji geograficznych)</li>
                <li>Dane techniczne (adres IP, typ przeglądarki, logi systemowe)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Cele przetwarzania danych</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Dane osobowe przetwarzamy w następujących celach:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Świadczenie usług platformy (połączenie zarządców z wykonawcami)</li>
                <li>Rejestracja i utrzymanie kont użytkowników</li>
                <li>Weryfikacja tożsamości i kwalifikacji użytkowników</li>
                <li>Komunikacja między użytkownikami</li>
                <li>Obsługa zleceń i ofert</li>
                <li>Analiza statystyczna i poprawa funkcjonalności</li>
                <li>Zapewnienie bezpieczeństwa i przeciwdziałanie nadużyciom</li>
                <li>Wypełnienie obowiązków prawnych</li>
                <li>Marketing własny (za zgodą użytkownika)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Pliki cookies</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Platforma wykorzystuje pliki cookies w następujących celach:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
                <li><strong>Cookies niezbędne:</strong> Utrzymanie sesji użytkownika, bezpieczeństwo (podstawa: uzasadniony interes) - wymagane do działania platformy</li>
                <li><strong>Cookies funkcjonalne:</strong> Zapamiętanie preferencji użytkownika (np. stan sidebaru, tryb testowy) - wymagana zgoda</li>
                <li><strong>Cookies analityczne:</strong> Analiza ruchu na platformie - wymagana zgoda (obecnie nie używane, możliwość wdrożenia w przyszłości)</li>
              </ul>
              <p className="text-slate-700 leading-relaxed">
                Użytkownik może w każdej chwili zmienić ustawienia cookies w przeglądarce lub za pomocą 
                bannera zgody na cookies. Wyłączenie cookies niezbędnych może wpłynąć na funkcjonalność platformy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Okres przechowywania danych</h2>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Dane konta użytkownika - do czasu usunięcia konta</li>
                <li>Dokumenty weryfikacyjne - do czasu zakończenia weryfikacji lub usunięcia konta</li>
                <li>Wiadomości między użytkownikami - zgodnie z wymogami prawnymi lub do czasu usunięcia konta</li>
                <li>Dane w celach marketingowych - do czasu wycofania zgody</li>
                <li>Logi systemowe - maksymalnie 12 miesięcy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Udostępnianie danych osobowych</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Dane osobowe mogą być udostępniane:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li><strong>Innym użytkownikom platformy:</strong> Dane profilowe widoczne w publicznych profilach (zgodnie z ustawieniami prywatności)</li>
                <li><strong>Dostawcom usług IT:</strong> Hosting, baza danych (Supabase), analityka - na podstawie umów powierzenia zgodnych z RODO</li>
                <li><strong>Organom państwowym:</strong> W przypadkach wymaganych przepisami prawa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Prawa użytkownika</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Użytkownik ma prawo do:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-700">
                <li>Dostępu do swoich danych osobowych</li>
                <li>Sprostowania (poprawienia) danych</li>
                <li>Usunięcia danych ("prawo do bycia zapomnianym")</li>
                <li>Ograniczenia przetwarzania</li>
                <li>Przenoszenia danych</li>
                <li>Sprzeciwu wobec przetwarzania</li>
                <li>Wycofania zgody w dowolnym momencie</li>
                <li>Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Bezpieczeństwo danych</h2>
              <p className="text-slate-700 leading-relaxed">
                Stosujemy odpowiednie środki techniczne i organizacyjne zapewniające ochronę danych osobowych, 
                w tym szyfrowanie połączeń (SSL/TLS), ograniczony dostęp do danych oraz regularne kopie zapasowe. 
                Dokumenty weryfikacyjne są przechowywane w bezpiecznym magazynie z ograniczonym dostępem.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Kontakt</h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                W sprawach dotyczących ochrony danych osobowych można kontaktować się z administratorem:
              </p>
              <ul className="list-none space-y-2 text-slate-700">
                <li>E-mail: [wstawić email kontaktowy]</li>
                <li>Adres: [wstawić adres firmy]</li>
              </ul>
            </section>

            <section className="pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

