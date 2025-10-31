# 🧪 Urbi.eu - Instrukcja dla Beta Testerów

Witamy w programie beta testowania platformy Urbi.eu! Ten dokument zawiera wszystkie informacje potrzebne do efektywnego testowania naszej platformy.

## 🎯 O platformie Urbi.eu

Urbi.eu to nowoczesna platforma łącząca zarządców nieruchomości (spółdzielnie, wspólnoty mieszkaniowe) z firmami wykonawczymi. Nasza misja to usprawnienie procesów znajdowania i realizacji projektów w branży zarządzania nieruchomościami.

### Główne funkcjonalności:
- **System zleceń bezpośrednich** - szybkie procesy dla prostych prac
- **System przetargów** - formalne procedury dla większych projektów
- **Mapa interaktywna** - geolokalizacja projektów
- **System ocen i referencji** - budowanie zaufania
- **Komunikacja** - bezpośredni kontakt zarządca-wykonawca

## 🛡️ Bezpieczeństwo testów

### ✅ Środowisko testowe
- Wszystkie dane są **mockowane** (przykładowe)
- Nie musisz podawać prawdziwych danych osobowych
- Możesz swobodnie testować bez obaw o bezpieczeństwo
- Żadne działania nie wpływają na prawdziwe dane

### 🔒 Dane testowe
- Użyj fikcyjnych adresów email do rejestracji
- Wypełniaj formularze przykładowymi danymi
- Wszystkie transakcje są symulowane

## 👥 Role testowe

### 🏢 Zarządca nieruchomości
**Kto może testować:**
- Zarządcy wspólnot mieszkaniowych
- Zarządcy spółdzielni
- Administratorzy budynków
- Osoby z branży nieruchomości

**Co będziesz testować:**
1. Publikowanie zleceń i przetargów
2. Przeglądanie ofert od wykonawców
3. System komunikacji
4. Panel zarządzania projektami
5. Ocenę wykonawców

### 🔨 Wykonawca
**Kto może testować:**
- Firmy budowlane i remontowe
- Rzemieślnicy
- Firmy sprzątające
- Firmy ochrony i konserwacji
- Dostawcy usług dla nieruchomości

**Co będziesz testować:**
1. Wyszukiwanie zleceń według kategorii
2. Składanie ofert na zlecenia
3. Uczestnictwo w przetargach
4. Tworzenie profilu firmy
5. System referencji

## 🚀 Jak rozpocząć testowanie

### Krok 1: Pierwszy kontakt z platformą
1. Odwiedź platformę
2. Przeczytaj komunikat powitalny
3. Wybierz swoją rolę (zarządca/wykonawca)

### Krok 2: Rejestracja
1. Kliknij "Zaloguj się" → wybierz swoją rolę → "Zarejestruj się"
2. Użyj fikcyjnego adresu email (np. test@example.com)
3. Ustaw proste hasło (np. test123)
4. Wypełnij podstawowe dane

### Krok 3: Onboarding
1. Przejdź przez proces wprowadzenia
2. Wypełnij profil przykładowymi danymi
3. Dodaj fikcyjne dokumenty/certyfikaty

### Krok 4: Eksploracja
1. Przejrzyj interfejs użytkownika
2. Przetestuj główne funkcjonalności
3. Wypróbuj mapę i filtry
4. Sprawdź powiadomienia

## 📋 Scenariusze testowe

### Dla zarządców:

#### Scenariusz 1: Publikowanie prostego zlecenia
1. Zaloguj się jako zarządca
2. Kliknij "Dodaj ogłoszenie" → "Zlecenie"
3. Wypełnij formularz zlecenia
4. Ustaw lokalizację na mapie
5. Opublikuj zlecenie
6. Sprawdź czy zlecenie jest widoczne w liście

#### Scenariusz 2: Tworzenie przetargu
1. Przejdź do "Dodaj ogłoszenie" → "Przetarg"
2. Wypełnij szczegółowe informacje
3. Dodaj dokumenty przetargowe
4. Ustaw terminy składania ofert
5. Opublikuj przetarg
6. Sprawdź przetarg w liście

#### Scenariusz 3: Zarządzanie ofertami
1. Sprawdź powiadomienia o nowych ofertach
2. Przejrzyj złożone oferty
3. Oceń wykonawców
4. Rozpocznij komunikację z wybranym wykonawcą

### Dla wykonawców:

#### Scenariusz 1: Znajdowanie i aplikowanie na zlecenie
1. Zaloguj się jako wykonawca
2. Przeglądaj listę zleceń
3. Użyj filtrów (kategoria, lokalizacja, budżet)
4. Sprawdź zlecenia na mapie
5. Otwórz szczegóły zlecenia
6. Złóż ofertę
7. Sprawdź status w "Moje oferty"

#### Scenariusz 2: Uczestnictwo w przetargu
1. Znajdź aktywny przetarg
2. Przeczytaj specyfikację
3. Przygotuj ofertę przetargową
4. Dołącz wymagane dokumenty
5. Złóż ofertę przed terminem
6. Śledź status przetargu

#### Scenariusz 3: Budowanie profilu
1. Uzupełnij profil firmy
2. Dodaj portfolio i referencje
3. Załącz certyfikaty
4. Sprawdź jak wygląda profil dla zarządców

## 🔍 Na co zwrócić szczególną uwagę

### Interface i UX:
- Czy wszystkie przyciski działają?
- Czy nawigacja jest intuicyjna?
- Czy formularze są zrozumiałe?
- Czy komunikaty błędów są jasne?

### Funkcjonalność:
- Czy wyszukiwanie działa poprawnie?
- Czy filtry zawężają wyniki?
- Czy mapa ładuje się i pokazuje lokalizacje?
- Czy powiadomienia pojawiają się w odpowiednim czasie?

### Responsywność:
- Czy aplikacja działa na telefonie?
- Czy elementy są łatwe do kliknięcia na touchscreen?
- Czy tekst jest czytelny na małych ekranach?

### Performance:
- Czy strony ładują się szybko?
- Czy nie ma długich opóźnień?
- Czy animacje są płynne?

## 📱 Testowanie na urządzeniach

### Desktop:
- Przetestuj w Chrome, Firefox, Safari, Edge
- Sprawdź różne rozdzielczości ekranu
- Użyj narzędzi deweloperskich do sprawdzenia błędów

### Mobile:
- Testuj na rzeczywistych urządzeniach (iOS/Android)
- Sprawdź gesty dotykowe
- Przetestuj orientację pionową i poziomą
- Sprawdź czy elementy są dostępne palcem

## 💬 Jak przekazać feedback

### 1. Widget Feedback (ZALECANE)
- Kliknij przycisk "Feedback" w prawym dolnym rogu
- Wybierz typ feedback'u (błąd, sugestia, opinia)
- Oceń doświadczenie gwiazdkami
- Opisz szczegółowo problem/sugestię

### 2. Email bezpośredni
- Wyślij na: **beta@urbi.eu**
- Użyj dla dłuższych raportów z załącznikami
- Dołącz zrzuty ekranu jeśli potrzebne

### Co uwzględnić w feedback'u:
- **Opis problemu/sugestii** - co dokładnie nie działa?
- **Kroki do odtworzenia** - jak wywołać problem?
- **Urządzenie i przeglądarka** - na czym testowałeś?
- **Oczekiwania vs rzeczywistość** - jak powinno działać?
- **Priorytet** - czy to blokuje dalsze testowanie?

## 🏆 Przykłady dobrego feedback'u

### ✅ Dobrze:
> "Problem: Przycisk 'Wyślij ofertę' nie działa na iPhone Safari
> 
> Kroki: 1) Otwieram zlecenie 2) Wypełniam formularz oferty 3) Klikam 'Wyślij' 4) Nic się nie dzieje
> 
> Urządzenie: iPhone 12, Safari
> 
> Oczekiwanie: Oferta powinna zostać wysłana i pokazać się komunikat sukcesu"

### ❌ Źle:
> "Nie działa"

## 📊 Beta Dashboard

Sprawdź swój postęp testowania w **Beta Dashboard**:
- Otwórz menu użytkownika (po zalogowaniu)
- Kliknij "Dashboard beta"
- Zobacz statystyki testów
- Śledź swój wkład w rozwój platformy

## 🎯 Cele programu beta

### Nasze cele:
1. **Walidacja koncepcji** - czy platforma spełnia potrzeby branży?
2. **Optymalizacja UX** - czy interfejs jest intuicyjny?
3. **Testowanie funkcjonalności** - czy wszystko działa jak powinno?  
4. **Feedback rynkowy** - jakie funkcje są najważniejsze?
5. **Stabilność techniczna** - czy system jest niezawodny?

### Twój wkład:
- Każda opinia ma znaczenie
- Pomagasz kształtować finalny produkt
- Wpływasz na przyszłość branży w Polsce
- Stajesz się częścią społeczności Urbi.eu

## 🔄 Harmonogram beta testów

### Faza 1: Podstawowe funkcjonalności (aktualnie)
- System zleceń
- System przetargów
- Rejestracja i profile
- Podstawowa komunikacja

### Faza 2: Zaawansowane funkcje (planowane)
- Płatności i faktury
- Zaawansowane raportowanie
- Integracje z systemami zewnętrznymi
- Aplikacja mobilna

### Faza 3: Optymalizacja (planowane)
- Performance improvements
- Dodatkowe kategorie zleceń
- Funkcje społecznościowe
- AI-powered matching

## 🤝 Społeczność beta testerów

Dołącz do naszej społeczności testerów:
- **Discord:** [link będzie dodany]
- **Newsletter:** beta@urbi.eu
- **Updates:** Śledź komunikaty w aplikacji

## ❓ FAQ dla testerów

### P: Czy muszę płacić za testowanie?
O: Nie, testowanie jest całkowicie bezpłatne.

### P: Jak długo trwają testy beta?
O: Planujemy 8-12 tygodni intensywnych testów.

### P: Czy otrzymam dostęp do finalnej wersji?
O: Tak, beta testerzy otrzymają preferencyjne warunki.

### P: Czy mogę zaprosić kolegów do testów?
O: Tak, zachęcamy do dzielenia się linkiem z branżą.

### P: Co jeśli znajdę poważny błąd?
O: Natychmiast napisz na beta@urbi.eu z opisem "URGENT" w temacie.

## 🚀 Dziękujemy!

Dziękujemy za udział w programie beta testowania Urbi.eu! 

Twoja opinia i zaangażowanie są kluczowe dla stworzenia najlepszej platformy dla branży nieruchomości w Polsce. Razem budujemy przyszłość tej branży!

---

**Zespół Urbi.eu**  
beta@urbi.eu  
[Strona główna] | [Discord] | [LinkedIn]

*Dokument zaktualizowany: {{ current_date }}*
*Wersja beta: 1.0.0*