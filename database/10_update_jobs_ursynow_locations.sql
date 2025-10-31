-- =============================================
-- UPDATE JOBS TO URSYNÓW LOCATIONS
-- =============================================
-- This migration updates all job locations to be in Ursynów, Warsaw
-- with 6 random locations scattered across the district

-- First, delete all existing jobs and tenders to start fresh (if tables exist)
DO $$ 
BEGIN
    -- Delete from tables only if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') THEN
        DELETE FROM job_applications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tender_submissions') THEN
        DELETE FROM tender_submissions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenders') THEN
        DELETE FROM tenders;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        DELETE FROM jobs;
    END IF;
END $$;

-- Update company locations to Ursynów
UPDATE companies 
SET city = 'Warszawa', 
    address = CASE 
        WHEN name LIKE '%Panorama%' THEN 'al. Komisji Edukacji Narodowej 15, 02-797 Warszawa'
        WHEN name LIKE '%Zielone Osiedle%' THEN 'ul. Lanciego 12, 02-792 Warszawa'
        WHEN name LIKE '%Sosnowy Las%' THEN 'ul. Dereniowa 8, 02-776 Warszawa'
        ELSE address
    END
WHERE name IN ('Spółdzielnia Mieszkaniowa "Panorama"', 'Wspólnota Mieszkaniowa "Zielone Osiedle"', 'Spółdzielnia Mieszkaniowa "Sosnowy Las"');

-- Get category IDs
DO $$
DECLARE
    instalacje_cat_id UUID;
    sprzatanie_cat_id UUID;
    remonty_cat_id UUID;
    zielen_cat_id UUID;
    zarzadzanie_cat_id UUID;
    specjalistyczne_cat_id UUID;
    dummy_manager_id UUID;
    panorama_id UUID;
    zielone_id UUID;
    sosnowy_id UUID;
BEGIN
    -- Get or create category IDs
    SELECT id INTO instalacje_cat_id FROM job_categories WHERE slug = 'instalacje-techniczne' LIMIT 1;
    SELECT id INTO sprzatanie_cat_id FROM job_categories WHERE slug = 'usługi-sprzątające' LIMIT 1;
    SELECT id INTO remonty_cat_id FROM job_categories WHERE slug = 'remonty-budownictwo' LIMIT 1;
    SELECT id INTO zielen_cat_id FROM job_categories WHERE slug = 'utrzymanie-czystości-zieleni' LIMIT 1;
    SELECT id INTO zarzadzanie_cat_id FROM job_categories WHERE slug = 'zarządzanie-nieruchomościami' LIMIT 1;
    
    -- Create fallback category if needed
    IF zarzadzanie_cat_id IS NULL THEN
        INSERT INTO job_categories (name, slug, description, icon, sort_order)
        VALUES ('Zarządzanie Nieruchomościami', 'zarządzanie-nieruchomościami', 'Administracja i zarządzanie', 'building', 5)
        RETURNING id INTO zarzadzanie_cat_id;
    END IF;
    
    IF sprzatanie_cat_id IS NULL THEN
        INSERT INTO job_categories (name, slug, description, icon, sort_order)
        VALUES ('Usługi Sprzątające', 'usługi-sprzątające', 'Sprzątanie i czystość', 'sparkles', 2)
        RETURNING id INTO sprzatanie_cat_id;
    END IF;
    
    IF remonty_cat_id IS NULL THEN
        INSERT INTO job_categories (name, slug, description, icon, sort_order)
        VALUES ('Remonty i Budownictwo', 'remonty-budownictwo', 'Roboty remontowe i budowlane', 'hammer', 1)
        RETURNING id INTO remonty_cat_id;
    END IF;
    
    IF zielen_cat_id IS NULL THEN
        INSERT INTO job_categories (name, slug, description, icon, sort_order)
        VALUES ('Utrzymanie Czystości i Zieleni', 'utrzymanie-czystości-zieleni', 'Tereny zielone i ogrodnictwo', 'tree', 3)
        RETURNING id INTO zielen_cat_id;
    END IF;
    
    -- Get company IDs
    SELECT id INTO panorama_id FROM companies WHERE name = 'Spółdzielnia Mieszkaniowa "Panorama"' LIMIT 1;
    SELECT id INTO zielone_id FROM companies WHERE name = 'Wspólnota Mieszkaniowa "Zielone Osiedle"' LIMIT 1;
    SELECT id INTO sosnowy_id FROM companies WHERE name = 'Spółdzielnia Mieszkaniowa "Sosnowy Las"' LIMIT 1;
    
    -- Get dummy manager ID
    SELECT id INTO dummy_manager_id FROM user_profiles WHERE user_type = 'manager' LIMIT 1;
    
    -- Create dummy manager if none exists
    IF dummy_manager_id IS NULL THEN
        INSERT INTO user_profiles (id, user_type, full_name, email)
        VALUES (gen_random_uuid(), 'manager', 'Administrator', 'admin@domio.pl')
        RETURNING id INTO dummy_manager_id;
    END IF;
    
    -- =============================================
    -- INSERT 6 JOBS IN URSYNÓW
    -- =============================================
    
    -- Job 1: Konserwacja wind (Ursynów Północ)
    INSERT INTO jobs (
        title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        'Konserwacja i naprawa wind - 2 budynki mieszkalne',
        'Spółdzielnia Mieszkaniowa poszukuje certyfikowanej firmy windowej do stałej obsługi serwisowej 8 wind w dwóch nowoczesnych budynkach mieszkalnych.',
        COALESCE(instalacje_cat_id, zarzadzanie_cat_id),
        'Przegląd wind',
        dummy_manager_id,
        COALESCE(panorama_id, zielone_id),
        'Ursynów, Warszawa',
        'al. Komisji Edukacji Narodowej 61, 02-777 Warszawa',
        52.1456, 21.0512,
        8000, 12000, 'range', 'PLN',
        '12 miesięcy - umowa serwisowa',
        CURRENT_DATE + INTERVAL '21 days',
        'medium',
        'active',
        'premium',
        true,
        'Jan Kowalski',
        '+48 22 123 4567',
        'kowalski@ursynow.pl',
        'Budynek wielorodzinny',
        ARRAY['Certyfikat UDT', 'Ubezpieczenie OC', 'Min. 5 lat doświadczenia'],
        ARRAY['Regularne przeglądy techniczne', 'Obsługa awarii 24/7'],
        ARRAY['UDT', 'serwis wind', 'konserwacja'],
        6, 142,
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours'
    );
    
    -- Job 2: Dezynsekcja (Ursynów Wschód)  
    INSERT INTO jobs (
        title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        'Kompleksowa dezynsekcja i deratyzacja - osiedle 120 mieszkań',
        'Wspólnota Mieszkaniowa zleca kompleksową dezynsekcję i deratyzację 4 budynków mieszkalnych.',
        COALESCE(zarzadzanie_cat_id, sprzatanie_cat_id),
        'Dezynsekcja i deratyzacja',
        dummy_manager_id,
        COALESCE(zielone_id, panorama_id),
        'Ursynów, Warszawa',
        'ul. Lanciego 8, 02-792 Warszawa',
        52.1328, 21.0495,
        5400, 7800, 'range', 'PLN',
        '3 miesiące - 3 zabiegi',
        CURRENT_DATE + INTERVAL '14 days',
        'high',
        'active',
        'urgent',
        true,
        'Anna Nowak',
        '+48 22 987 6543',
        'nowak@ursynow.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Certyfikaty SANEPID', 'Ubezpieczenie OC'],
        ARRAY['Dezynsekcja pomieszczeń', 'Deratyzacja piwnic'],
        ARRAY['dezynsekcja', 'deratyzacja', 'DDD'],
        11, 89,
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '6 hours'
    );
    
    -- Job 3: Wymiana ogrodzenia (Ursynów Zachód)
    INSERT INTO jobs (
        title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        'Wymiana ogrodzenia i bram wjazdowych',
        'Spółdzielnia Mieszkaniowa zleca wymianę ogrodzenia obwodowego osiedla mieszkaniowego wraz z modernizacją 2 bram wjazdowych.',
        COALESCE(remonty_cat_id, zarzadzanie_cat_id),
        'Ogrodzenia i infrastruktura',
        dummy_manager_id,
        COALESCE(sosnowy_id, panorama_id),
        'Ursynów, Warszawa',
        'ul. Dereniowa 6, 02-776 Warszawa',
        52.1501, 21.0389,
        42000, 56000, 'range', 'PLN',
        '2 miesiące',
        CURRENT_DATE + INTERVAL '60 days',
        'medium',
        'active',
        'premium',
        true,
        'Piotr Wiśniewski',
        '+48 22 345 6789',
        'wisniewski@ursynow.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Uprawnienia spawalnicze', 'Certyfikaty budowlane'],
        ARRAY['Wymiana ogrodzenia', 'Montaż bram', 'Automatyka'],
        ARRAY['ogrodzenie', 'bramy', 'spawanie'],
        4, 67,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    );
    
    -- Job 4: Sprzątanie klatek (Ursynów Południowy)
    INSERT INTO jobs (
        title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        'Sprzątanie klatek schodowych',
        'Wspólnota Mieszkaniowa poszukuje firmy sprzątającej do stałej obsługi 3 budynków mieszkalnych.',
        COALESCE(sprzatanie_cat_id, zarzadzanie_cat_id),
        'Sprzątanie części wspólnych',
        dummy_manager_id,
        COALESCE(zielone_id, panorama_id),
        'Ursynów, Warszawa',
        'ul. Puszczyka 22, 02-785 Warszawa',
        52.1275, 21.0542,
        2500, 3000, 'range', 'PLN',
        'Umowa stała',
        CURRENT_DATE + INTERVAL '14 days',
        'medium',
        'active',
        'regular',
        true,
        'Maria Kowalska',
        '+48 22 111 2222',
        'kowalska@ursynow.pl',
        'Budynek wielorodzinny',
        ARRAY['Minimum 2 lata doświadczenia', 'Ubezpieczenie OC'],
        ARRAY['Sprzątanie klatek', 'Mycie okien'],
        ARRAY['sprzątanie', 'czystość', 'mycie'],
        12, 67,
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '2 hours'
    );
    
    -- Job 5: Remont elewacji (Ursynów Wschód)
    INSERT INTO jobs (
        title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        'Remont elewacji budynku',
        'Wspólnota Mieszkaniowa zleca kompleksowy remont elewacji 4-piętrowego budynku z lat 80.',
        COALESCE(remonty_cat_id, zarzadzanie_cat_id),
        'Remonty dachów i elewacji',
        dummy_manager_id,
        COALESCE(zielone_id, panorama_id),
        'Ursynów, Warszawa',
        'ul. Filipiny Płaskowickiej 5, 02-778 Warszawa',
        52.1389, 21.0625,
        64000, 96000, 'range', 'PLN',
        '3 miesiące',
        CURRENT_DATE + INTERVAL '90 days',
        'high',
        'active',
        'urgent',
        true,
        'Adam Nowak',
        '+48 22 222 3333',
        'nowak@ursynow.pl',
        'Budynek wielorodzinny',
        ARRAY['Certyfikat budowlany', 'Ubezpieczenie OC min. 500k'],
        ARRAY['Mycie elewacji', 'Naprawa tynku', 'Malowanie'],
        ARRAY['remont', 'elewacja', 'malowanie'],
        8, 95,
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '4 hours'
    );
    
    -- Job 6: Tereny zielone (Ursynów Zachód)
    INSERT INTO jobs (
        title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        'Konserwacja terenów zielonych',
        'Szukamy doświadczonej firmy ogrodniczej do kompleksowej pielęgnacji terenów zielonych przy budynkach mieszkalnych w Ursynowie.',
        COALESCE(zielen_cat_id, zarzadzanie_cat_id),
        'Pielęgnacja terenów zielonych',
        dummy_manager_id,
        COALESCE(sosnowy_id, panorama_id),
        'Ursynów, Warszawa',
        'ul. Wąwozowa 28, 02-796 Warszawa',
        52.1425, 21.0311,
        3500, 5000, 'range', 'PLN',
        'Sezonowo - kwiecień do październik',
        CURRENT_DATE + INTERVAL '30 days',
        'medium',
        'active',
        'regular',
        true,
        'Ewa Zielińska',
        '+48 22 444 5555',
        'zielinska@ursynow.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Certyfikat ogrodniczy', 'Własny sprzęt'],
        ARRAY['Koszenie trawników', 'Pielęgnacja krzewów', 'Dbanie o klomby'],
        ARRAY['ogród', 'zieleń', 'trawnik'],
        31, 124,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    );
    
END $$;
