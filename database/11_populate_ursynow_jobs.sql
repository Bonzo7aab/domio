-- =============================================
-- POPULATE DATABASE WITH 6 URSYNÓW JOBS
-- =============================================
-- This script creates 6 jobs located in Ursynów, Warsaw
-- Run this in Supabase SQL Editor or via psql

-- =============================================
-- STEP 1: Create dummy manager and companies if they don't exist
-- =============================================

DO $$
DECLARE
    dummy_manager_id UUID;
    ursynow_sm_id UUID;
    ursynow_wm_id UUID;
    ursynow_centrum_id UUID;
    remonty_cat_id UUID;
    instalacje_cat_id UUID;
    sprzatanie_cat_id UUID;
    zielen_cat_id UUID;
    zarzadzanie_cat_id UUID;
BEGIN
    -- =============================================
    -- Get or create manager user
    -- =============================================
    SELECT id INTO dummy_manager_id 
    FROM user_profiles 
    WHERE user_type = 'manager' 
    LIMIT 1;
    
    IF dummy_manager_id IS NULL THEN
        -- Create a dummy manager user
        INSERT INTO user_profiles (
            id, user_type, full_name, email, phone, profile_completed
        ) VALUES (
            gen_random_uuid(),
            'manager',
            'Administrator Systemu',
            'admin@ursynow.domio.pl',
            '+48 22 000 0000',
            true
        ) RETURNING id INTO dummy_manager_id;
        
        RAISE NOTICE 'Created dummy manager: %', dummy_manager_id;
    ELSE
        RAISE NOTICE 'Using existing manager: %', dummy_manager_id;
    END IF;
    
    -- =============================================
    -- Get or create companies
    -- =============================================
    
    -- Company 1: Spółdzielnia Mieszkaniowa "Ursynów"
    SELECT id INTO ursynow_sm_id 
    FROM companies 
    WHERE name = 'Spółdzielnia Mieszkaniowa "Ursynów"';
    
    IF ursynow_sm_id IS NULL THEN
        INSERT INTO companies (
            name, type, city, address, phone, email, 
            description, is_verified, verification_level
        ) VALUES (
            'Spółdzielnia Mieszkaniowa "Ursynów"',
            'spółdzielnia',
            'Warszawa',
            'al. Komisji Edukacji Narodowej 61, 02-777 Warszawa',
            '+48 22 123 4567',
            'kontakt@sm-ursynow.pl',
            'Spółdzielnia mieszkaniowa zarządzająca nieruchomościami w dzielnicy Ursynów',
            true,
            'verified'
        ) RETURNING id INTO ursynow_sm_id;
    END IF;
    
    -- Company 2: Wspólnota Mieszkaniowa "Ursynów Północny"
    SELECT id INTO ursynow_wm_id 
    FROM companies 
    WHERE name LIKE '%Ursynów Północny%';
    
    IF ursynow_wm_id IS NULL THEN
        INSERT INTO companies (
            name, type, city, address, phone, email,
            description, is_verified, verification_level
        ) VALUES (
            'Wspólnota Mieszkaniowa "Ursynów Północny"',
            'wspólnota',
            'Warszawa',
            'ul. Lanciego 8, 02-792 Warszawa',
            '+48 22 987 6543',
            'biuro@wm-ursynow.pl',
            'Wspólnota mieszkaniowa na Ursynowie',
            true,
            'verified'
        ) RETURNING id INTO ursynow_wm_id;
    END IF;
    
    -- Company 3: Spółdzielnia Mieszkaniowa "Ursynów Centrum"
    SELECT id INTO ursynow_centrum_id 
    FROM companies 
    WHERE name LIKE '%Ursynów Centrum%';
    
    IF ursynow_centrum_id IS NULL THEN
        INSERT INTO companies (
            name, type, city, address, phone, email,
            description, is_verified, verification_level
        ) VALUES (
            'Spółdzielnia Mieszkaniowa "Ursynów Centrum"',
            'spółdzielnia',
            'Warszawa',
            'ul. Dereniowa 6, 02-776 Warszawa',
            '+48 22 345 6789',
            'kontakt@sm-centrum.pl',
            'Spółdzielnia mieszkaniowa w centrum Ursynowa',
            true,
            'verified'
        ) RETURNING id INTO ursynow_centrum_id;
    END IF;
    
    -- =============================================
    -- Get category IDs
    -- =============================================
    SELECT id INTO remonty_cat_id FROM job_categories WHERE slug LIKE '%remonty%' OR slug LIKE '%budownictwo%' LIMIT 1;
    SELECT id INTO instalacje_cat_id FROM job_categories WHERE slug LIKE '%instalacje%' OR slug LIKE '%techniczne%' LIMIT 1;
    SELECT id INTO sprzatanie_cat_id FROM job_categories WHERE slug LIKE '%sprzątaj%' OR slug LIKE '%clean%' LIMIT 1;
    SELECT id INTO zielen_cat_id FROM job_categories WHERE slug LIKE '%zielen%' OR slug LIKE '%czystość%' LIMIT 1;
    SELECT id INTO zarzadzanie_cat_id FROM job_categories WHERE slug LIKE '%zarządzan%' LIMIT 1;
    
    -- Use first available category as fallback
    IF remonty_cat_id IS NULL THEN
        SELECT id INTO remonty_cat_id FROM job_categories LIMIT 1;
    END IF;
    
    -- =============================================
    -- CREATE 6 JOBS IN URSYNÓW
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
        'Spółdzielnia Mieszkaniowa poszukuje certyfikowanej firmy windowej do stałej obsługi serwisowej 8 wind w dwóch nowoczesnych budynkach mieszkalnych. Zlecenie obejmuje regularne przeglądy techniczne, bieżące naprawy, 24/7 obsługę awarii oraz modernizację starszych systemów.',
        COALESCE(instalacje_cat_id, remonty_cat_id),
        'Przegląd wind',
        dummy_manager_id,
        ursynow_sm_id,
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
        'kowalski@sm-ursynow.pl',
        'Budynek wielorodzinny',
        ARRAY['Certyfikat UDT', 'Ubezpieczenie OC', 'Min. 5 lat doświadczenia'],
        ARRAY['Regularne przeglądy techniczne', 'Obsługa awarii 24/7', 'Modernizacja systemów'],
        ARRAY['UDT', 'serwis wind', 'konserwacja', 'awarie', 'dźwigi'],
        6, 142,
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours'
    );
    
    -- Job 2: Dezynsekcja i deratyzacja (Ursynów Wschód) - URGENT
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
        'Wspólnota Mieszkaniowa zleca kompleksową dezynsekcję i deratyzację 4 budynków mieszkalnych. Prace mają być wykonywane zgodnie z najwyższymi standardami sanitarnymi.',
        COALESCE(zarzadzanie_cat_id, sprzatanie_cat_id, remonty_cat_id),
        'Dezynsekcja i deratyzacja',
        dummy_manager_id,
        ursynow_wm_id,
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
        'nowak@wm-ursynow.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Certyfikaty SANEPID', 'Ubezpieczenie OC', 'Doświadczenie min. 3 lata'],
        ARRAY['Dezynsekcja pomieszczeń', 'Deratyzacja piwnic i garaży', 'Dokumentacja'],
        ARRAY['dezynsekcja', 'deratyzacja', 'DDD', 'SANEPID', 'gryzonie'],
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
        COALESCE(remonty_cat_id, instalacje_cat_id),
        'Ogrodzenia i infrastruktura',
        dummy_manager_id,
        ursynow_centrum_id,
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
        'wisniewski@sm-centrum.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Uprawnienia spawalnicze', 'Certyfikaty budowlane', 'Automatyka'],
        ARRAY['Wymiana ogrodzenia', 'Montaż bram', 'Instalacja automatyki'],
        ARRAY['ogrodzenie', 'bramy', 'panele', 'automatyka', 'spawanie'],
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
        'Wspólnota Mieszkaniowa poszukuje profesjonalnej firmy sprzątającej do stałej obsługi 3 budynków mieszkalnych (łącznie 120 mieszkań). Zakres prac obejmuje: codzienne sprzątanie klatek schodowych, mycie okien, czyszczenie wind.',
        COALESCE(sprzatanie_cat_id, zarzadzanie_cat_id, remonty_cat_id),
        'Sprzątanie części wspólnych',
        dummy_manager_id,
        ursynow_wm_id,
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
        'kowalska@wm-ursynow.pl',
        'Budynek wielorodzinny',
        ARRAY['Minimum 2 lata doświadczenia', 'Ubezpieczenie OC', 'Własny sprzęt'],
        ARRAY['Sprzątanie klatek', 'Mycie okien', 'Czyszczenie wind'],
        ARRAY['sprzątanie', 'czystość', 'mycie', 'klatki schodowe'],
        12, 67,
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '2 hours'
    );
    
    -- Job 5: Remont elewacji (Ursynów Wschód) - URGENT
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
        'Wspólnota Mieszkaniowa zleca kompleksowy remont elewacji 4-piętrowego budynku z lat 80. o powierzchni elewacji ok. 800 m². Zakres: mycie, naprawa tynku, gruntowanie, malowanie.',
        COALESCE(remonty_cat_id, instalacje_cat_id),
        'Remonty dachów i elewacji',
        dummy_manager_id,
        ursynow_wm_id,
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
        'nowak@wm-ursynow.pl',
        'Budynek wielorodzinny',
        ARRAY['Certyfikat budowlany', 'Ubezpieczenie OC min. 500k PLN', 'Min. 5 lat doświadczenia'],
        ARRAY['Mycie ciśnieniowe elewacji', 'Naprawa tynku', 'Gruntowanie i malowanie'],
        ARRAY['remont', 'elewacja', 'malowanie', 'fasada'],
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
        'Szukamy doświadczonej firmy ogrodniczej do kompleksowej pielęgnacji terenów zielonych przy budynkach mieszkalnych w Ursynowie. Zakres: koszenie trawników, pielęgnacja krzewów, dbanie o klomby.',
        COALESCE(zielen_cat_id, zarzadzanie_cat_id, remonty_cat_id),
        'Pielęgnacja terenów zielonych',
        dummy_manager_id,
        ursynow_centrum_id,
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
        'zielinska@sm-centrum.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Certyfikat ogrodniczy', 'Własny sprzęt', 'Doświadczenie min. 2 lata'],
        ARRAY['Koszenie trawników', 'Pielęgnacja krzewów i drzew', 'Dbanie o klomby'],
        ARRAY['ogród', 'zieleń', 'trawnik', 'koszenie', 'pielęgnacja'],
        31, 124,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    );
    
    RAISE NOTICE '✅ Created 6 jobs in Ursynów, Warsaw';
    
END $$;

-- =============================================
-- VERIFICATION QUERY
-- =============================================

-- Check created jobs
SELECT 
    id,
    title,
    location,
    latitude,
    longitude,
    type,
    urgency,
    status,
    applications_count
FROM jobs
WHERE status = 'active'
ORDER BY created_at DESC;
