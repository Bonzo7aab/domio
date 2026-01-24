-- =============================================
-- CATEGORY SYSTEM MIGRATION
-- 6 Main Service Pillars with Subcategories
-- =============================================

-- First, deactivate old categories (keep them for backward compatibility)
UPDATE job_categories SET is_active = FALSE WHERE parent_id IS NULL;

-- =============================================
-- 1. ROBOTY BUDOWLANE I REMONTY (Inwestycje)
-- =============================================
INSERT INTO job_categories (name, slug, description, icon, sort_order, is_active) VALUES
('Roboty Budowlane i Remonty', 'roboty-budowlane-remonty', 'Remonty dachów, termomodernizacja, renowacja, wymiana stolarki', 'hammer', 1, TRUE)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Get the parent ID
DO $$
DECLARE
    roboty_id UUID;
BEGIN
    SELECT id INTO roboty_id FROM job_categories WHERE slug = 'roboty-budowlane-remonty';
    
    -- Subcategories for Roboty Budowlane i Remonty
    INSERT INTO job_categories (name, slug, description, parent_id, sort_order, is_active) VALUES
    ('Remonty dachów i izolacje', 'remonty-dachow-izolacje', 'Naprawa i wymiana pokryć dachowych, izolacje termiczne i przeciwwilgociowe', roboty_id, 1, TRUE),
    ('Termomodernizacja i elewacje', 'termomodernizacja-elewacje', 'Ocieplanie budynków, modernizacja elewacji, wymiana systemów grzewczych', roboty_id, 2, TRUE),
    ('Renowacja klatek schodowych i korytarzy', 'renowacja-klatek-schodowych', 'Remonty części wspólnych, malowanie, wymiana posadzek', roboty_id, 3, TRUE),
    ('Wymiana stolarki okiennej i drzwiowej', 'wymiana-stolarki', 'Wymiana okien, drzwi, modernizacja stolarki', roboty_id, 4, TRUE)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      parent_id = EXCLUDED.parent_id,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;
END $$;

-- =============================================
-- 2. SPRZĄTANIE I UTRZYMANIE CZYSTOŚCI (Płynność)
-- =============================================
INSERT INTO job_categories (name, slug, description, icon, sort_order, is_active) VALUES
('Sprzątanie i Utrzymanie Czystości', 'sprzatanie-utrzymanie-czystosci', 'Sprzątanie nieruchomości, mycie okien, DDD', 'sparkles', 2, TRUE)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

DO $$
DECLARE
    sprzatanie_id UUID;
BEGIN
    SELECT id INTO sprzatanie_id FROM job_categories WHERE slug = 'sprzatanie-utrzymanie-czystosci';
    
    -- Subcategories for Sprzątanie i Utrzymanie Czystości
    INSERT INTO job_categories (name, slug, description, parent_id, sort_order, is_active) VALUES
    ('Bieżące sprzątanie nieruchomości', 'biezace-sprzatanie', 'Sprzątanie części wspólnych, klatek schodowych, korytarzy', sprzatanie_id, 1, TRUE),
    ('Sprzątanie hal garażowych i parkingów', 'sprzatanie-garazy-parkingi', 'Czyszczenie hal garażowych, parkingów, miejsc postojowych', sprzatanie_id, 2, TRUE),
    ('Mycie okien i przeszkleń', 'mycie-okien-przeszklen', 'Mycie okien, fasad, przeszkleń (w tym alpinistyczne)', sprzatanie_id, 3, TRUE),
    ('Sprzątanie poremontowe i pobudowlane', 'sprzatanie-poremontowe', 'Sprzątanie po remontach i pracach budowlanych', sprzatanie_id, 4, TRUE),
    ('Dezynsekcja, deratyzacja i DDD', 'dezynsekcja-deratyzacja-ddd', 'Usługi dezynfekcji, dezynsekcji, deratyzacji', sprzatanie_id, 5, TRUE)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      parent_id = EXCLUDED.parent_id,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;
END $$;

-- =============================================
-- 3. ZIELEŃ I TERENY ZEWNĘTRZNE (High-Frequency)
-- =============================================
INSERT INTO job_categories (name, slug, description, icon, sort_order, is_active) VALUES
('Zieleń i Tereny Zewnętrzne', 'zielen-tereny-zewnetrzne', 'Pielęgnacja zieleni, brukarstwo, mała architektura, odśnieżanie', 'tree-pine', 3, TRUE)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

DO $$
DECLARE
    zielen_id UUID;
BEGIN
    SELECT id INTO zielen_id FROM job_categories WHERE slug = 'zielen-tereny-zewnetrzne';
    
    -- Subcategories for Zieleń i Tereny Zewnętrzne
    INSERT INTO job_categories (name, slug, description, parent_id, sort_order, is_active) VALUES
    ('Pielęgnacja roślinności i trawników', 'pielegnacja-roslinnosci', 'Koszenie trawy, przycinanie krzewów, pielęgnacja roślin', zielen_id, 1, TRUE),
    ('Brukarstwo i naprawy dróg osiedlowych', 'brukarstwo-naprawy-drog', 'Naprawa i układanie kostki brukowej, remonty dróg osiedlowych', zielen_id, 2, TRUE),
    ('Mała architektura i place zabaw', 'mala-architektura-place-zabaw', 'Budowa i konserwacja placów zabaw, małej architektury', zielen_id, 3, TRUE),
    ('Odśnieżanie i utrzymanie zimowe', 'odsniezanie-utrzymanie-zimowe', 'Odśnieżanie, posypywanie, utrzymanie terenów zimą', zielen_id, 4, TRUE)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      parent_id = EXCLUDED.parent_id,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;
END $$;

-- =============================================
-- 4. INSTALACJE I SYSTEMY TECHNICZNE (Specjalistyczne)
-- =============================================
INSERT INTO job_categories (name, slug, description, icon, sort_order, is_active) VALUES
('Instalacje i Systemy Techniczne', 'instalacje-systemy-techniczne', 'Instalacje wodno-kanalizacyjne, elektryczne, windy, systemy bezpieczeństwa', 'zap', 4, TRUE)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

DO $$
DECLARE
    instalacje_id UUID;
BEGIN
    SELECT id INTO instalacje_id FROM job_categories WHERE slug = 'instalacje-systemy-techniczne';
    
    -- Subcategories for Instalacje i Systemy Techniczne
    INSERT INTO job_categories (name, slug, description, parent_id, sort_order, is_active) VALUES
    ('Instalacje wodno-kanalizacyjne i C.O.', 'instalacje-wodno-kanalizacyjne-co', 'Instalacje wodne, kanalizacyjne, centralne ogrzewanie', instalacje_id, 1, TRUE),
    ('Instalacje elektryczne i oświetlenie', 'instalacje-elektryczne-oswietlenie', 'Instalacje elektryczne, oświetlenie części wspólnych', instalacje_id, 2, TRUE),
    ('Serwis i modernizacja wind', 'serwis-modernizacja-wind', 'Konserwacja, naprawa i modernizacja wind', instalacje_id, 3, TRUE),
    ('Systemy bezpieczeństwa', 'systemy-bezpieczenstwa', 'CCTV, domofony, systemy PPOŻ, monitoring', instalacje_id, 4, TRUE)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      parent_id = EXCLUDED.parent_id,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;
END $$;

-- =============================================
-- 5. PRZEGLĄDY I OBSŁUGA TECHNICZNA (Compliance)
-- =============================================
INSERT INTO job_categories (name, slug, description, icon, sort_order, is_active) VALUES
('Przeglądy i Obsługa Techniczna', 'przeglady-obsługa-techniczna', 'Przeglądy techniczne, inspekcje, serwis urządzeń', 'clipboard-check', 5, TRUE)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

DO $$
DECLARE
    przeglady_id UUID;
BEGIN
    SELECT id INTO przeglady_id FROM job_categories WHERE slug = 'przeglady-obsługa-techniczna';
    
    -- Subcategories for Przeglądy i Obsługa Techniczna
    INSERT INTO job_categories (name, slug, description, parent_id, sort_order, is_active) VALUES
    ('Obowiązkowe przeglądy techniczne', 'obowiazkowe-przeglady-techniczne', 'Przeglądy roczne i 5-letnie, certyfikaty', przeglady_id, 1, TRUE),
    ('Inspekcje kominiarskie i wentylacja', 'inspekcje-kominiarskie-wentylacja', 'Kontrola kominów, drożność wentylacji', przeglady_id, 2, TRUE),
    ('Serwis bram wjazdowych i automatyki', 'serwis-bram-automatyka', 'Naprawa i konserwacja bram, szlabanów, automatyki', przeglady_id, 3, TRUE)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      parent_id = EXCLUDED.parent_id,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;
END $$;

-- =============================================
-- 6. EKSPERTYZY I PROJEKTY (Konsulting)
-- =============================================
INSERT INTO job_categories (name, slug, description, icon, sort_order, is_active) VALUES
('Ekspertyzy i Projekty', 'ekspertyzy-projekty', 'Audyty energetyczne, projekty budowlane, nadzór inwestorski', 'file-text', 6, TRUE)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

DO $$
DECLARE
    ekspertyzy_id UUID;
BEGIN
    SELECT id INTO ekspertyzy_id FROM job_categories WHERE slug = 'ekspertyzy-projekty';
    
    -- Subcategories for Ekspertyzy i Projekty
    INSERT INTO job_categories (name, slug, description, parent_id, sort_order, is_active) VALUES
    ('Audyty energetyczne i certyfikaty ESG', 'audyty-energetyczne-esg', 'Audyty energetyczne, certyfikaty ESG, dokumentacja do dotacji', ekspertyzy_id, 1, TRUE),
    ('Projekty budowlane i inżynierskie', 'projekty-budowlane-inzynierskie', 'Projekty architektoniczne, konstrukcyjne, inżynierskie', ekspertyzy_id, 2, TRUE),
    ('Nadzór inwestorski i kosztorysowanie', 'nadzor-inwestorski-kosztorysowanie', 'Nadzór budowlany, kosztorysy, zarządzanie projektami', ekspertyzy_id, 3, TRUE)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      parent_id = EXCLUDED.parent_id,
      sort_order = EXCLUDED.sort_order,
      is_active = EXCLUDED.is_active;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_categories_parent_id ON job_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_job_categories_is_active ON job_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_job_categories_sort_order ON job_categories(sort_order);
