# Domio - Szczegółowy Przegląd Platformy

## Opis Ogólny
Domio to platforma B2B łącząca spółdzielnie i wspólnoty mieszkaniowe z firmami wykonawczymi w branży zarządzania nieruchomościami. System oferuje 5 głównych kategorii zleceń i obsługuje dwa modele współpracy: zlecenia bezpośrednie oraz formalne przetargi online.

## Model Biznesowy - Freemium
- **Zarządcy**: Dostęp bezpłatny (stanowią "popyt")
- **Wykonawcy**: Plan Basic (50 zł/miesiąc) i Pro (100 zł/miesiąc)
- **Paleta kolorów**: Primary blue #1e40af, Success green #059669, Warning orange #d97706, Destructive red #dc2626

---

## GŁÓWNE WIDOKI I ŚCIEŻKI UŻYTKOWNIKA

### 1. WIDOK GŁÓWNY (list)
**Lokalizacja**: Domyślny widok aplikacji
**Dostęp**: Publiczny

#### Funkcjonalności:
- **Enhanced Job List**: Lista zleceń z filtrami i wyszukiwarką
- **Enhanced Map View**: Interaktywna mapa z lokalizacjami zleceń
- **Job Filters**: Sidebar z filtrami (kategoria, lokalizacja, budżet, data)
- **Header Navigation**: Główne menu nawigacyjne
- **Beta Status Bar**: Pasek statusu wersji beta
- **Feedback Widget**: Widget do zbierania opinii użytkowników
- **Beta Welcome Modal**: Modal powitalny dla nowych użytkowników

#### Ścieżki użytkownika:
1. **Przeglądanie zleceń** → Kliknięcie zlecenia → `job-details`
2. **Dodanie zlecenia** → Przycisk "Dodaj zlecenie" → `job-type-selection`
3. **Zarządcy** → Menu → `manager-browse`
4. **Wykonawcy** → Menu → `contractor-browse`
5. **Cennik** → Menu → `pricing`
6. **Logowanie** → Menu → `user-type-selection`

#### Komponenty:
- EnhancedJobList, EnhancedMapView, JobFilters, Header
- BetaStatusBar, FeedbackWidget, BetaWelcomeModal

---

### 2. SZCZEGÓŁY ZLECENIA (job-details)
**Dostęp**: Publiczny (z głównej listy)
**Trigger**: Kliknięcie na zlecenie w liście

#### Funkcjonalności:
- Pełne szczegóły zlecenia (opis, wymagania, budżet, lokalizacja)
- Informacje o zarządcy/wspólnocie
- System aplikowania na zlecenie (wymaga logowania)
- Galeria zdjęć i dokumentów
- Mapa lokalizacji
- Historia ofert (jeśli publiczna)

#### Ścieżki użytkownika:
1. **Aplikowanie na zlecenie** → Wymaga logowania → `login`
2. **Powrót** → `list`
3. **Kontakt z zarządcą** → System wiadomości (po zalogowaniu)

---

### 3. WYBÓR TYPU ZLECENIA (job-type-selection)
**Dostęp**: Po kliknięciu "Dodaj zlecenie"
**Wymaga**: Uwierzytelnienie dla przetargów

#### Funkcjonalności:
- **Wybór zlecenia bezpośredniego**: Szybki proces, bezpośrednie aplikowanie
- **Wybór przetargu**: Formalna procedura, większe projekty
- Porównanie typów współpracy
- Wyjaśnienie różnic i zastosowań

#### Ścieżki użytkownika:
1. **Zlecenie** → `post-job`
2. **Przetarg** → `manager` (dashboard zarządcy) lub `login` jeśli niezalogowany
3. **Powrót** → `list`

---

### 4. DODAWANIE ZLECENIA (post-job)
**Dostęp**: Z job-type-selection
**Wymagania**: Może wymagać logowania

#### Funkcjonalności:
- Formularz dodawania zlecenia
- Wybór kategorii (5 głównych kategorii)
- Opis wymagań i specyfikacji
- Ustalenie budżetu i terminów
- Dodawanie załączników
- Wybór lokalizacji na mapie
- Podgląd przed publikacją

#### Ścieżki użytkownika:
1. **Publikacja** → Zlecenie trafia do `list`
2. **Anulowanie** → `list`
3. **Zapisanie wersji roboczej** → Profil użytkownika

---

### 5. PANEL ZARZĄDCY (manager) - PRYWATNY
**Dostęp**: Tylko zalogowani zarządcy
**Wymagania**: Konto zarządcy + uwierzytelnienie

#### Funkcjonalności:
- **Dashboard z metrykami**: Aktywne zlecenia, wydatki, oszczędności
- **Moje zlecenia**: Lista wszystkich zleceń zarządcy
- **Otrzymane oferty**: System oceny i porównania ofert
- **System przetargów**: Tworzenie i zarządzanie przetargami
- **Historia współpracy**: Archiwum zrealizowanych projektów
- **Oceny wykonawców**: System oceniania i recenzji
- **Komunikator**: Wiadomości z wykonawcami
- **Faktury i płatności**: Historia finansowa
- **Ustawienia profilu**: Zarządzanie danymi wspólnoty

#### Ścieżki użytkownika:
1. **Nowy przetarg** → TenderCreationForm
2. **Szczegóły oferty** → Widok porównania ofert
3. **Profil wykonawcy** → `contractor-profile`
4. **Nowe zlecenie** → `post-job`

---

### 6. PANEL WYKONAWCY (contractor) - PRYWATNY  
**Dostęp**: Tylko zalogowani wykonawcy
**Wymagania**: Konto wykonawcy + uwierzytelnienie + aktywna subskrypcja

#### Funkcjonalności:
- **Dashboard z metrykami**: Złożone oferty, wygrane zlecenia, przychody
- **Dostępne zlecenia**: Przefiltrowana lista dopasowanych zleceń
- **Moje aplikacje**: Status złożonych ofert i aplikacji
- **Kalendarz projektów**: Harmonogram realizowanych zleceń
- **Profil firmy**: Zarządzanie danymi i portfoliem
- **System ocen**: Otrzymane recenzje i oceny
- **Komunikator**: Korespondencja z zarządcami
- **Faktury**: Historia płatności i rozliczeń
- **Statystyki Pro**: Analityka rynku (plan Pro)

#### Ścieżki użytkownika:
1. **Przeglądanie zleceń** → `list` lub wewnętrzny widok
2. **Składanie oferty** → Formularz aplikacji
3. **Profil zarządcy** → `manager-profile`
4. **Ustawienia** → `account`

---

### 7. PRZEGLĄDAJ WYKONAWCÓW (contractor-browse)
**Dostęp**: Publiczny
**Trigger**: Menu "Wykonawcy"

#### Funkcjonalności:
- **Lista zweryfikowanych wykonawców**: Publiczny katalog firm
- **Filtry specjalizacji**: Kategorie usług, lokalizacja, oceny
- **Odznaki weryfikacji**: Visual indicators jakości
- **System ocen**: Publiczne recenzje i oceny
- **Mapy wykonawców**: Geograficzne rozmieszczenie
- **Portfolia firm**: Galeria realizowanych projektów

#### Ścieżki użytkownika:
1. **Profil wykonawcy** → `contractor-profile`
2. **Filtrowanie** → Aktualizacja listy
3. **Kontakt** → Wymaga logowania
4. **Powrót** → `list`

---

### 8. PRZEGLĄDAJ ZARZĄDCÓW (manager-browse)  
**Dostęp**: Publiczny
**Trigger**: Menu "Zarządcy"

#### Funkcjonalności:
- **Lista wspólnot i spółdzielni**: Publiczny katalog
- **Informacje o nieruchomościach**: Typy budynków, lokalizacje
- **Historia współpracy**: Publiczne opinie i oceny
- **Aktywne zlecenia**: Otwarte możliwości współpracy
- **Mapy wspólnot**: Geograficzne rozmieszczenie

#### Ścieżki użytkownika:
1. **Profil zarządcy** → `manager-profile`
2. **Aktywne zlecenia** → `list` z filtrem
3. **Powrót** → `list`

---

### 9. PROFIL WYKONAWCY (contractor-profile)
**Dostęp**: Z contractor-browse lub linki wewnętrzne
**Typ**: Publiczny widok profilu

#### Funkcjonalności:
- **Informacje firmowe**: Dane kontaktowe, specjalizacje, doświadczenie
- **Portfolio**: Galeria zrealizowanych projektów
- **Oceny i recenzje**: System społecznościowy
- **Certyfikaty**: Weryfikacja uprawnień
- **Dostępność**: Kalendarz i terminy
- **Obszar działania**: Mapa obsługiwanych lokalizacji
- **Cennik orientacyjny**: Przykładowe wyceny usług

#### Ścieżki użytkownika:
1. **Kontakt**: Wymaga logowania
2. **Zlecenie bezpośrednie**: Formularz zapytania
3. **Powrót**: `contractor-browse`

---

### 10. PROFIL ZARZĄDCY (manager-profile)
**Dostęp**: Z manager-browse lub linki wewnętrzne  
**Typ**: Publiczny widok profilu

#### Funkcjonalności:
- **Informacje o wspólnoty**: Adres, typ budynków, liczba lokali
- **Kontakt**: Dane zarządcy/administratora
- **Aktywne zlecenia**: Bieżące możliwości współpracy
- **Historia projektów**: Zrealizowane inwestycje
- **Oceny współpracy**: Opinie wykonawców
- **Zdjęcia nieruchomości**: Galeria budynków

#### Ścieżki użytkownika:
1. **Aplikowanie na zlecenia**: `job-details`
2. **Kontakt**: System wiadomości (po logowaniu)
3. **Powrót**: `manager-browse`

---

### 11. WYBÓR TYPU UŻYTKOWNIKA (user-type-selection)
**Dostęp**: Przed logowaniem/rejestracją
**Trigger**: Przycisk "Zaloguj się"

#### Funkcjonalności:
- **Wybór: Jestem Wykonawcą**: Ścieżka dla firm budowlanych
- **Wybór: Jestem Zarządcą**: Ścieżka dla zarządców nieruchomości
- **Różnicowanie interfejsu**: Personalizacja doświadczenia
- **Wyjaśnienie ról**: Korzyści dla każdego typu użytkownika

#### Ścieżki użytkownika:
1. **Wykonawca - Logowanie** → `login` (contractor)
2. **Wykonawca - Rejestracja** → `register` (contractor)  
3. **Zarządca - Logowanie** → `login` (manager)
4. **Zarządca - Rejestracja** → `register` (manager)
5. **Powrót** → `list`

---

### 12. LOGOWANIE (login)
**Dostęp**: Z user-type-selection lub bezpośrednio
**Kontekst**: Zachowuje wybrany typ użytkownika

#### Funkcjonalności:
- **Formularz logowania**: Email/telefon + hasło
- **Typu użytkownika**: Predefiniowany lub wybieralny
- **Zapomniałem hasła**: Link do resetowania
- **Nie mam konta**: Link do rejestracji
- **Walidacja**: Real-time sprawdzanie poprawności
- **Bezpieczeństwo**: Zabezpieczenia przed atakami

#### Ścieżki użytkownika:
1. **Sukces logowania**: Przekierowanie do odpowiedniego dashboardu
2. **Reset hasła** → `forgot-password`
3. **Rejestracja** → `register`
4. **Powrót** → `user-type-selection` lub `list`

---

### 13. REJESTRACJA (register)
**Dostęp**: Z user-type-selection, login lub bezpośrednio
**Kontekst**: Zachowuje wybrany typ użytkownika

#### Funkcjonalności:
- **Formularz rejestracji**: Dane osobowe/firmowe
- **Wybór typu konta**: Wykonawca vs Zarządca (jeśli nie ustalony)
- **Walidacja danych**: Sprawdzanie poprawności w czasie rzeczywistym
- **Akceptacja regulaminu**: Zgody prawne
- **Weryfikacja email**: System aktywacji konta
- **Różne pola**: Dostosowane do typu użytkownika

#### Ścieżki użytkownika:
1. **Sukces rejestracji** → `onboarding`
2. **Mam już konto** → `login`
3. **Powrót** → `user-type-selection` lub `list`

---

### 14. RESET HASŁA (forgot-password)
**Dostęp**: Z formularza logowania

#### Funkcjonalności:
- **Formularz resetu**: Wprowadzenie adresu email
- **Wysyłka linka**: System mailingowy
- **Potwierdzenie**: Informacja o wysłaniu
- **Nowe hasło**: Formularz zmiany (po kliknięciu w link)
- **Bezpieczeństwo**: Tokeny czasowe

#### Ścieżki użytkownika:
1. **Email wysłany** → Oczekiwanie na email
2. **Powrót do logowania** → `login`
3. **Główna strona** → `list`

---

### 15. KONTO UŻYTKOWNIKA (account)
**Dostęp**: Tylko zalogowani użytkownicy
**Wymagania**: Aktywne uwierzytelnienie

#### Funkcjonalności:
- **Dane osobowe**: Edycja profilu podstawowego
- **Dane firmowe**: Informacje o firmie/wspólnocie (według typu)
- **Ustawienia bezpieczeństwa**: Zmiana hasła, 2FA
- **Preferencje**: Notyfikacje, język, powiadomienia
- **Historia aktywności**: Logi działań w systemie
- **Weryfikacja**: Status i dokumenty weryfikacyjne
- **Subskrypcja**: Zarządzanie planem (wykonawcy)
- **Usunięcie konta**: RODO compliance

#### Ścieżki użytkownika:
1. **Weryfikacja dokumentów** → `verification`
2. **Zmiana planu** → `pricing`
3. **Powrót** → Dashboard użytkownika

---

### 16. PROCES ONBOARDINGU (onboarding)
**Dostęp**: Automatycznie po pierwszej rejestracji
**Wymagania**: Nowe konto bez ukończonego profilu

#### Funkcjonalności:
- **Kroki konfiguracyjne**: Wielostopniowy wizard
- **Profil firmowy**: Szczegółowe dane (wykonawcy)
- **Profil wspólnoty**: Informacje o nieruchomości (zarządcy)
- **Upload dokumentów**: Podstawowe dokumenty weryfikacyjne
- **Specjalizacje**: Wybór kategorii usług (wykonawcy)
- **Obszar działania**: Geograficzne preferencje
- **Zdjęcia/logo**: Upload materiałów wizualnych
- **Postęp**: Pasek ukończenia profilu

#### Ścieżki użytkownika:
1. **Ukończenie** → Dashboard użytkownika (`manager` lub `contractor`)
2. **Pominięcie kroków** → Niepełny profil z notyfikacjami
3. **Weryfikacja** → `verification` (opcjonalnie)

---

### 17. WERYFIKACJA DOKUMENTÓW (verification)
**Dostęp**: Z onboardingu, account lub dashboard
**Wymagania**: Zalogowany użytkownik

#### Funkcjonalności:
- **Upload dokumentów**: Drag&drop interfejs
- **Typy dokumentów**: KRS, ubezpieczenia, certyfikaty, uprawnienia
- **Status weryfikacji**: Oczekująca, zatwierdzona, odrzucona
- **Komentarze moderatora**: Feedback przy odrzuceniu
- **Poziomy weryfikacji**: Podstawowa vs Pro
- **Korzyści**: Wyjaśnienie korzyści z weryfikacji
- **Tracking**: Historia zmian statusu

#### Ścieżki użytkownika:
1. **Dokument załadowany** → Oczekiwanie na moderację
2. **Pełna weryfikacja** → Odznaka zweryfikowanego wykonawcy
3. **Powrót** → `account` lub dashboard

---

### 18. CENNIK (pricing)
**Dostęp**: Publiczny, link w menu głównym

#### Funkcjonalności:
- **Zakładki użytkowników**: Wykonawcy vs Zarządcy
- **Plany dla wykonawców**:
  - **Domio Basic**: 50 zł/miesiąc - dostęp do zleceń, podstawowa weryfikacja
  - **Domio Pro**: 100 zł/miesiąc - wszystko z Basic + odznaka eksperta, wyróżnienie w wynikach, statystyki, priorytetowe powiadomienia
- **Plan dla zarządców**: Domio Free - zawsze darmowy
- **Przełącznik rozliczenia**: Miesięczne vs roczne (2 miesiące gratis)
- **Porównanie planów**: Funkcjonalności i korzyści
- **FAQ**: Najczęściej zadawane pytania
- **Testimoniale**: Opinie użytkowników
- **Gwarancje**: 7 dni trial, anulacja w każdej chwili

#### Ścieżki użytkownika:
1. **Rozpocznij za darmo (zarządcy)** → `register` jako manager
2. **Rozpocznij za darmo (wykonawcy)** → `register` jako contractor  
3. **Porozmawiaj z ekspertem** → `expert-consultation`
4. **Główny CTA** → Rejestracja według aktywnej zakładki

---

### 19. KONSULTACJA Z EKSPERTEM (expert-consultation)
**Dostęp**: Z cennika lub linki marketingowe

#### Funkcjonalności:
- **Formularz konsultacji**: Szczegółowy questionaire
  - Dane osobowe (imię, nazwisko, email, telefon)
  - Informacje firmowe (nazwa, rozmiar działalności)
  - Typ użytkownika (wykonawca/zarządca)
  - Główne wyzwania w branży
  - Preferowany sposób kontaktu (telefon/email)
  - Preferowana pora kontaktu
  - Dodatkowe pytania
- **Profil eksperta**: Marcin Kowalski - 10 lat doświadczenia
- **Korzyści konsultacji**: Spersonalizowana strategia, odpowiedzi na pytania
- **Gwarancje**: Bezpłatna, bez zobowiązań, odpowiedź w 24h
- **Strona potwierdzenia**: Po wysłaniu formularza

#### Ścieżki użytkownika:
1. **Formularz wysłany** → Strona potwierdzenia
2. **Powrót do cennika** → `pricing`
3. **Kontakt ekspertowy** → Email/telefon w ciągu 24h

---

### 20. DEMO SYSTEMU (test-demo)
**Dostęp**: Menu deweloperskie lub linki testowe

#### Funkcjonalności:
- **Interaktywna prezentacja**: Guided tour funkcjonalności
- **Scenariusze testowe**: Różne przypadki użycia
- **Symulacja procesów**: Przetargi, aplikacje, komunikacja
- **Dane testowe**: Przykładowe zlecenia i profile
- **Tryby demonstracyjne**: Różne role użytkowników

---

### 21. PRZEWODNIK TESTOWANIA (testing-guide)
**Dostęp**: Beta Status Bar, menu deweloperskie

#### Funkcjonalności:
- **Instrukcje testowania**: Jak używać platformy w wersji beta
- **Scenariusze testowe**: Lista rzeczy do przetestowania
- **Cel testów**: Wyjaśnienie celów fazy beta
- **Feedback**: Jak zgłaszać uwagi i błędy
- **Różne dla ról**: Oddzielne instrukcje dla zarządców i wykonawców

---

### 22. DASHBOARD BETA (beta-dashboard)
**Dostęp**: Menu deweloperskie

#### Funkcjonalności:
- **Statystyki testowania**: Metryki użytkowania
- **Zgłoszenia**: Lista feedbacku od użytkowników
- **Status funkcji**: Które funkcje są testowane
- **Plany rozwoju**: Roadmapa funkcjonalności

---

### 23. KONFIGURACJA TESTÓW (testing-config)
**Dostęp**: Menu deweloperskie

#### Funkcjonalności:
- **Ustawienia testowe**: Konfiguracja trybu beta
- **Mock data**: Zarządzanie danymi testowymi
- **Feature flags**: Włączanie/wyłączanie funkcji
- **Debugging**: Narzędzia diagnostyczne

---

## SYSTEM PRZETARGÓW ONLINE

### Kompletny proces przetargowy:
1. **Tworzenie przetargu**: Formularz z wymaganiami, kryteriami, terminami
2. **Publikacja**: Automatyczne powiadomienia do wykonawców
3. **Składanie ofert**: System BidSubmissionForm
4. **Ocena ofert**: BidEvaluationPanel z porównaniem
5. **Wybór zwycięzcy**: Automatyczne powiadomienia
6. **Realizacja**: Tracking postępu projektu

### Transparentność:
- Publiczny dostęp do części informacji
- Historia przetargów
- Kryteria oceny
- Timeline procesu

---

## KLUCZOWE KOMPONENTY SYSTEMOWE

### Zarządzanie Stanem:
- **AuthContext**: Globalne zarządzanie uwierzytelnieniem
- **ViewType**: 23 różne widoki aplikacji
- **User State**: Rozróżnienie typów użytkowników
- **Beta Features**: System flag dla funkcji testowych

### Responsywność:
- **Mobile-first**: Priorytet dla urządzeń mobilnych
- **Adaptive UI**: Dostosowanie do rozmiaru ekranu
- **Touch-friendly**: Duże elementy interaktywne

### UX/UI:
- **Professional Design**: Paleta kolorów branży nieruchomości
- **Consistent Navigation**: Spójne menu i nawigacja
- **Loading States**: Feedback wizualny podczas ładowania
- **Error Handling**: Graceful handling błędów

### Bezpieczeństwo:
- **Role-based Access**: Różne uprawnienia dla typów użytkowników
- **Protected Routes**: Weryfikacja dostępu do prywatnych sekcji
- **Input Validation**: Walidacja wszystkich formularzy
- **RODO Compliance**: Zgodność z ochroną danych

---

## NAJWAŻNIEJSZE ŚCIEŻKI KONWERSJI

### Dla Zarządców (Free Forever):
1. **Główna** → `pricing` → "Rozpocznij za darmo" → `register` → `onboarding` → `manager`
2. **Alternatywna** → `list` → "Dodaj zlecenie" → `job-type-selection` → Wymaga logowania → `user-type-selection` → `register`

### Dla Wykonawców (Paid Plans):  
1. **Główna** → `pricing` → "Rozpocznij za darmo" → `register` → `onboarding` → `contractor`
2. **Ekspercka** → `pricing` → "Porozmawiaj z ekspertem" → `expert-consultation` → Lead nurturing
3. **Przez zlecenia** → `list` → `job-details` → "Aplikuj" → `login` → `register`

### Retention & Engagement:
1. **Beta Welcome** → Modal powitalny → `testing-guide` → Edukacja
2. **Feedback Loop** → FeedbackWidget → Stałe zbieranie opinii
3. **Onboarding** → Guided setup → Profile completion → Feature discovery

---

## PODSUMOWANIE ARCHITEKTURY

**Stan aplikacji**: Centralne zarządzanie przez React hooks i Context API
**Routing**: Single-page application z conditional rendering
**UI Framework**: Shadcn/ui + Tailwind CSS v4
**Authentication**: Context-based z persistent state
**Data**: Mock data z symulacją API calls
**Testing**: Dedicated beta testing infrastructure
**Mobile**: Responsive design with mobile-specific components

Platforma jest w pełni funkcjonalna w wersji MVP z kompletnym systemem uwierzytelniania, onboardingu, przetargów online oraz ścieżkami konwersji dostosowanymi do modelu freemium.