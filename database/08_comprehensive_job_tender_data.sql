-- =============================================
-- COMPREHENSIVE JOB AND TENDER DATA MIGRATION
-- =============================================
-- This migration moves all mock data from the frontend to the database
-- Including: Companies, Job Categories, Jobs, and Tenders

-- =============================================
-- PART 1: COMPANIES
-- =============================================

DO $$
DECLARE
    panorama_id UUID;
    zielone_id UUID;
    sosnowy_id UUID;
    sloneczna_id UUID;
    parkowa_id UUID;
    centrum_id UUID;
    stary_id UUID;
    zlota_id UUID;
    
    -- Category IDs
    utrzymanie_cat_id UUID;
    remonty_cat_id UUID;
    instalacje_cat_id UUID;
    specjalistyczne_cat_id UUID;
    zarzadzanie_cat_id UUID;
    
    -- Dummy manager ID (will be replaced with real user when auth is set up)
    dummy_manager_id UUID;
BEGIN
    -- First, check if we need to create a dummy manager or use an existing one
    -- Try to get any existing manager user from the database
    SELECT id INTO dummy_manager_id 
    FROM user_profiles 
    WHERE user_type = 'manager' 
    LIMIT 1;
    
    -- If no manager exists, we'll need to create one
    -- For now, we'll make manager_id nullable in sample jobs
    -- Or use the first authenticated user if available
    IF dummy_manager_id IS NULL THEN
        -- Try to find any user in auth.users
        SELECT id INTO dummy_manager_id FROM auth.users LIMIT 1;
        
        -- If we found a user, create a profile for them if needed
        IF dummy_manager_id IS NOT NULL THEN
            INSERT INTO user_profiles (
                id, user_type, first_name, last_name, phone, 
                is_verified, profile_completed, onboarding_completed
            ) VALUES (
                dummy_manager_id,
                'manager',
                'Demo',
                'Manager',
                '+48 000 000 000',
                true,
                true,
                true
            )
            ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
    
    -- If still no manager found, skip job/tender creation
    IF dummy_manager_id IS NULL THEN
        RAISE NOTICE 'No users found in database. Please create a user account first, then re-run this migration.';
        RAISE NOTICE 'You can create a user by registering at /register';
        RETURN;
    END IF;

    -- Create companies for job postings (without RETURNING clause that causes issues)
    INSERT INTO companies (name, type, city, address, phone, email, description, is_verified, verification_level)
    VALUES 
    ('Spółdzielnia Mieszkaniowa "Panorama"', 'spółdzielnia', 'Gdańsk', 'ul. Morska 15, 80-001 Gdańsk', '+48 58 123 4567', 'kontakt@panorama.pl', 
     'Spółdzielnia mieszkaniowa zarządzająca budynkami w Gdańsku', true, 'verified'),
    ('Wspólnota Mieszkaniowa "Zielone Osiedle"', 'wspólnota', 'Warszawa', 'ul. Parkowa 45, 02-001 Warszawa', '+48 22 987 6543', 'biuro@zieloneosiedle.pl',
     'Wspólnota mieszkaniowa w Warszawie', true, 'verified'),
    ('Spółdzielnia Mieszkaniowa "Sosnowy Las"', 'spółdzielnia', 'Kraków', 'ul. Sosnowa 78, 31-001 Kraków', '+48 12 345 6789', 'biuro@sosnowlas.pl',
     'Spółdzielnia mieszkaniowa w Krakowie', true, 'verified'),
    ('Wspólnota Mieszkaniowa "Słoneczna"', 'wspólnota', 'Warszawa', 'ul. Słoneczna 10, 02-020 Warszawa', '+48 22 111 2222', 'kontakt@sloneczna.pl',
     'Wspólnota mieszkaniowa w Warszawie', true, 'verified'),
    ('Wspólnota Mieszkaniowa ul. Parkowa 24', 'wspólnota', 'Kraków', 'ul. Parkowa 24, 30-300 Kraków', '+48 12 222 3333', 'wspolnota@parkowa24.pl',
     'Wspólnota mieszkaniowa w Krakowie', true, 'basic'),
    ('Wspólnota Mieszkaniowa "Centrum"', 'wspólnota', 'Gdańsk', 'ul. Centralna 5, 80-050 Gdańsk', '+48 58 333 4444', 'biuro@centrum-wm.pl',
     'Wspólnota mieszkaniowa w centrum Gdańska', true, 'verified'),
    ('Wspólnota Mieszkaniowa "Stary Rynek"', 'wspólnota', 'Poznań', 'Stary Rynek 1, 61-001 Poznań', '+48 61 444 5555', 'kontakt@staryrynek.pl',
     'Wspólnota mieszkaniowa w centrum Poznania', true, 'premium'),
    ('Wspólnota "Złota"', 'wspólnota', 'Wrocław', 'ul. Złota 88, 50-001 Wrocław', '+48 71 555 6666', 'biuro@zlota.pl',
     'Wspólnota mieszkaniowa we Wrocławiu', true, 'verified')
    ON CONFLICT DO NOTHING;

    -- Get company IDs after insertion
    SELECT id INTO panorama_id FROM companies WHERE name = 'Spółdzielnia Mieszkaniowa "Panorama"' LIMIT 1;
    SELECT id INTO zielone_id FROM companies WHERE name = 'Wspólnota Mieszkaniowa "Zielone Osiedle"' LIMIT 1;
    SELECT id INTO sosnowy_id FROM companies WHERE name = 'Spółdzielnia Mieszkaniowa "Sosnowy Las"' LIMIT 1;
    SELECT id INTO sloneczna_id FROM companies WHERE name = 'Wspólnota Mieszkaniowa "Słoneczna"' LIMIT 1;
    SELECT id INTO parkowa_id FROM companies WHERE name = 'Wspólnota Mieszkaniowa ul. Parkowa 24' LIMIT 1;
    SELECT id INTO centrum_id FROM companies WHERE name = 'Wspólnota Mieszkaniowa "Centrum"' LIMIT 1;
    SELECT id INTO stary_id FROM companies WHERE name = 'Wspólnota Mieszkaniowa "Stary Rynek"' LIMIT 1;
    SELECT id INTO zlota_id FROM companies WHERE name = 'Wspólnota "Złota"' LIMIT 1;

    -- Get category IDs
    SELECT id INTO utrzymanie_cat_id FROM job_categories WHERE slug = 'usługi-sprzątające' LIMIT 1;
    SELECT id INTO remonty_cat_id FROM job_categories WHERE slug = 'remonty-budownictwo' LIMIT 1;
    SELECT id INTO instalacje_cat_id FROM job_categories WHERE slug = 'instalacje-techniczne' LIMIT 1;
    SELECT id INTO zarzadzanie_cat_id FROM job_categories WHERE slug = 'zarządzanie-nieruchomościami' LIMIT 1;
    
    -- If categories don't exist, create main ones
    IF utrzymanie_cat_id IS NULL THEN
        INSERT INTO job_categories (name, slug, description, icon, sort_order) 
        VALUES ('Usługi Sprzątające', 'usługi-sprzątające', 'Sprzątanie, mycie, utrzymanie czystości', 'broom', 4)
        RETURNING id INTO utrzymanie_cat_id;
    END IF;
    
    IF remonty_cat_id IS NULL THEN
        INSERT INTO job_categories (name, slug, description, icon, sort_order) 
        VALUES ('Remonty i Budownictwo', 'remonty-budownictwo', 'Remonty mieszkań, budynków, konstrukcje', 'hammer', 1)
        RETURNING id INTO remonty_cat_id;
    END IF;
    
    IF instalacje_cat_id IS NULL THEN
        INSERT INTO job_categories (name, slug, description, icon, sort_order) 
        VALUES ('Instalacje Techniczne', 'instalacje-techniczne', 'Elektryka, hydraulika, gaz, klimatyzacja', 'wrench', 2)
        RETURNING id INTO instalacje_cat_id;
    END IF;
    
    IF zarzadzanie_cat_id IS NULL THEN
        INSERT INTO job_categories (name, slug, description, icon, sort_order) 
        VALUES ('Zarządzanie Nieruchomościami', 'zarządzanie-nieruchomościami', 'Administracja, zarządzanie, konserwacja', 'building', 5)
        RETURNING id INTO zarzadzanie_cat_id;
    END IF;

    -- =============================================
    -- PART 2: REGULAR JOBS
    -- =============================================
    
    -- Job 1: Elevator Service (NEW)
    INSERT INTO jobs (
        id, title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        gen_random_uuid(),
        'Konserwacja i naprawa wind - 2 budynki mieszkalne',
        'Spółdzielnia Mieszkaniowa "Panorama" poszukuje certyfikowanej firmy windowej do stałej obsługi serwisowej 8 wind w dwóch nowoczesnych budynkach mieszkalnych. Zlecenie obejmuje regularne przeglądy techniczne, bieżące naprawy, 24/7 obsługę awarii oraz modernizację starszych systemów. Wymagamy najwyższej jakości usług oraz szybkiego czasu reakcji na zgłoszenia.',
        zarzadzanie_cat_id,
        'Konserwacja',
        dummy_manager_id,
        panorama_id,
        'Gdańsk',
        'ul. Morska 15-25, 80-001 Gdańsk',
        54.3520, 18.6466,
        8000, 12000, 'range', 'PLN',
        '12 miesięcy - umowa serwisowa',
        CURRENT_DATE + INTERVAL '21 days',
        'medium',
        'active',
        'premium',
        true,
        'Jan Kowalski',
        '+48 58 123 4567',
        'kowalski@panorama.pl',
        'Budynek wielorodzinny',
        ARRAY['Uprawnienia UDT do obsługi urządzeń dźwigowych', 'Minimum 7 lat doświadczenia w serwisie wind', 'System zgłoszeń awarii 24/7', 'Ubezpieczenie OC minimum 1 000 000 zł'],
        ARRAY['Miesięczne przeglądy techniczne wszystkich 8 wind', 'Natychmiastowa reakcja na awarie (maksymalnie 2h)', 'Wymiana zużytych części i komponentów'],
        ARRAY['UDT', 'serwis wind', 'konserwacja', 'awarie', 'dźwigi'],
        6, 142,
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Job 2: Pest Control (NEW)
    INSERT INTO jobs (
        id, title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        gen_random_uuid(),
        'Kompleksowa dezynsekcja i deratyzacja - osiedle 120 mieszkań',
        'Wspólnota Mieszkaniowa "Zielone Osiedle" zleca kompleksową dezynsekcję i deratyzację 4 budynków mieszkalnych (120 mieszkań + części wspólne + piwnice + garaże podziemne). Prace mają być wykonywane zgodnie z najwyższymi standardami sanitarnymi z zastosowaniem bezpiecznych dla mieszkańców preparatów.',
        zarzadzanie_cat_id,
        'Specjalistyczne usługi',
        dummy_manager_id,
        zielone_id,
        'Warszawa',
        'ul. Zielona 40, 02-001 Warszawa',
        52.1394, 21.0362,
        5400, 7800, 'range', 'PLN',
        '3 miesiące - 3 zabiegi',
        CURRENT_DATE + INTERVAL '14 days',
        'high',
        'active',
        'urgent',
        true,
        'Anna Nowak',
        '+48 22 987 6543',
        'nowak@zieloneosiedle.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Certyfikaty SANEPID', 'Ubezpieczenie OC', 'Doświadczenie minimum 3 lata'],
        ARRAY['Dezynsekcja wszystkich pomieszczeń', 'Deratyzacja piwnic i garaży', 'Dokumentacja i protokoły'],
        ARRAY['dezynsekcja', 'deratyzacja', 'DDD', 'SANEPID', 'gryzonie'],
        11, 89,
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '6 hours'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Job 3: Fence Replacement (NEW)
    INSERT INTO jobs (
        id, title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        gen_random_uuid(),
        'Wymiana ogrodzenia i bram wjazdowych - kompletne ogrodzenie osiedla',
        'Spółdzielnia Mieszkaniowa "Sosnowy Las" zleca kompleksową wymianę ogrodzenia obwodowego osiedla mieszkaniowego wraz z modernizacją 2 bram wjazdowych. Obecne ogrodzenie z siatki wymaga wymiany na nowoczesne panelowe z elementami dekoracyjnymi.',
        remonty_cat_id,
        'Konstrukcje',
        dummy_manager_id,
        sosnowy_id,
        'Kraków',
        'ul. Leśna 89, 31-001 Kraków',
        50.0775, 20.0416,
        42000, 56000, 'range', 'PLN',
        '60 dni kalendarzowych',
        CURRENT_DATE + INTERVAL '30 days',
        'medium',
        'active',
        'premium',
        true,
        'Piotr Wiśniewski',
        '+48 12 345 6789',
        'wisniewski@sosnowlas.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Doświadczenie w montażu ogrodzeń', 'Uprawnienia spawalnicze', 'Referencje z min. 3 realizacji'],
        ARRAY['Demontaż starego ogrodzenia', 'Montaż nowego ogrodzenia panelowego', 'Instalacja bram automatycznych'],
        ARRAY['ogrodzenie', 'bramy', 'spawanie', 'automatyka'],
        4, 78,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Job 4: Staircase Cleaning (OLD - ID 1)
    INSERT INTO jobs (
        id, title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000001'::UUID,
        'Sprzątanie klatek schodowych',
        'Wspólnota Mieszkaniowa "Słoneczna" poszukuje profesjonalnej firmy sprzątającej do stałej obsługi 3 budynków mieszkalnych (łącznie 120 mieszkań). Zakres prac obejmuje: codzienne sprzątanie klatek schodowych, cotygodniowe mycie okien w częściach wspólnych, miesięczne gruntowne czyszczenie wind i halli głównych.',
        utrzymanie_cat_id,
        'Sprzątanie części wspólnych',
        dummy_manager_id,
        sloneczna_id,
        'Warszawa',
        'ul. Słoneczna 10, 02-020 Warszawa',
        52.2297, 21.0122,
        2500, 3000, 'range', 'PLN',
        'Umowa stała',
        CURRENT_DATE + INTERVAL '14 days',
        'medium',
        'active',
        'regular',
        true,
        'Maria Nowak',
        '+48 22 111 2222',
        'nowak@sloneczna.pl',
        'Budynek wielorodzinny',
        ARRAY['Minimum 2 lata doświadczenia', 'Ubezpieczenie OC', 'Własny sprzęt'],
        ARRAY['Codzienne sprzątanie klatek', 'Mycie okien', 'Czyszczenie wind'],
        ARRAY['sprzątanie', 'czystość', 'mycie'],
        12, 67,
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '2 hours'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Job 5: Facade Renovation (OLD - ID 2)
    INSERT INTO jobs (
        id, title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000002'::UUID,
        'Remont elewacji budynku',
        'Wspólnota Mieszkaniowa ul. Parkowa 24 zleca kompleksowy remont elewacji 4-piętrowego budynku z lat 80. o powierzchni elewacji ok. 800 m². Zakres prac: mycie ciśnieniowe elewacji, naprawa spękań i ubytków w tynku, gruntowanie podłoża, dwukrotne malowanie farbami silikonowymi.',
        remonty_cat_id,
        'Elewacje',
        dummy_manager_id,
        parkowa_id,
        'Kraków',
        'ul. Parkowa 24, 30-300 Kraków',
        50.0647, 19.9450,
        64000, 96000, 'range', 'PLN',
        '45 dni kalendarzowych',
        CURRENT_DATE + INTERVAL '60 days',
        'high',
        'active',
        'urgent',
        true,
        'Tomasz Kowalczyk',
        '+48 12 222 3333',
        'kowalczyk@parkowa24.pl',
        'Budynek wielorodzinny z lat 80',
        ARRAY['Uprawnienia budowlane', 'Minimum 5 lat doświadczenia', 'Ubezpieczenie OC min. 500 tys. zł'],
        ARRAY['Mycie ciśnieniowe elewacji', 'Naprawa tynku', 'Malowanie silikonowe'],
        ARRAY['elewacja', 'malowanie', 'tynk', 'remont'],
        8, 134,
        NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '4 hours'
    )
    ON CONFLICT (id) DO NOTHING;

    -- =============================================
    -- PART 3: TENDERS
    -- =============================================
    
    -- Tender 1: Thermal Modernization
    INSERT INTO tenders (
        id, title, description, category_id, manager_id, company_id,
        location, address, latitude, longitude,
        estimated_value, currency, status,
        submission_deadline, evaluation_deadline, project_duration,
        is_public, requirements, evaluation_criteria, phases, current_phase,
        wadium, bids_count, views_count, published_at, created_at
    ) VALUES (
        gen_random_uuid(),
        'Kompleksowa termomodernizacja budynku wielorodzinnego - 11 kondygnacji',
        'Przetarg na wykonanie kompleksowej termomodernizacji budynku mieszkalnego przy ul. Parkowej 15-25 w Warszawie. Zakres obejmuje ocieplenie ścian zewnętrznych, wymianę okien w klatkach schodowych, modernizację dachu oraz montaż paneli fotowoltaicznych.',
        remonty_cat_id,
        dummy_manager_id,
        zielone_id,
        'Warszawa',
        'ul. Parkowa 15-25, 00-001 Warszawa',
        52.2297, 21.0122,
        850000, 'PLN',
        'active',
        CURRENT_DATE + INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '37 days',
        '90 dni kalendarzowych',
        true,
        ARRAY[
            'Minimum 5 lat doświadczenia w termomodernizacji budynków wielorodzinnych',
            'Referencje z co najmniej 3 podobnych realizacji',
            'Ubezpieczenie OC minimum 1 000 000 PLN',
            'Certyfikaty producenta dla systemów ociepleniowych',
            'Uprawnienia budowlane bez ograniczeń'
        ],
        jsonb_build_object(
            'criteria', jsonb_build_array(
                jsonb_build_object('name', 'Cena', 'weight', 60, 'description', 'Całkowita cena brutto realizacji'),
                jsonb_build_object('name', 'Termin realizacji', 'weight', 25, 'description', 'Proponowany termin ukończenia prac'),
                jsonb_build_object('name', 'Doświadczenie wykonawcy', 'weight', 15, 'description', 'Liczba i jakość podobnych realizacji')
            )
        ),
        jsonb_build_array(
            'Ogłoszenie przetargu',
            'Wizja lokalna (opcjonalna)',
            'Składanie ofert',
            'Otwarcie ofert',
            'Badanie i ocena ofert',
            'Wybór najkorzystniejszej oferty',
            'Podpisanie umowy'
        ),
        'Składanie ofert',
        8500,
        12, 234,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Tender 2: Elevator Modernization
    INSERT INTO tenders (
        id, title, description, category_id, manager_id, company_id,
        location, address, latitude, longitude,
        estimated_value, currency, status,
        submission_deadline, evaluation_deadline, project_duration,
        is_public, requirements, evaluation_criteria, phases, current_phase,
        wadium, bids_count, views_count, published_at, created_at
    ) VALUES (
        gen_random_uuid(),
        'Modernizacja 6 dźwigów osobowych',
        'Przetarg publiczny na kompleksową modernizację 6 dźwigów osobowych w 3 budynkach Spółdzielni Mieszkaniowej "Panorama" w Gdańsku. Modernizacja obejmuje wymianę wszystkich systemów sterowania, napędów, kabin oraz aktualizację do najnowszych standardów bezpieczeństwa.',
        instalacje_cat_id,
        dummy_manager_id,
        panorama_id,
        'Gdańsk',
        'ul. Morska 1-15, 80-001 Gdańsk',
        54.3700, 18.6130,
        420000, 'PLN',
        'active',
        CURRENT_DATE + INTERVAL '25 days',
        CURRENT_DATE + INTERVAL '32 days',
        '120 dni kalendarzowych',
        true,
        ARRAY[
            'Certyfikat UDT na modernizację dźwigów',
            'Minimum 7 lat doświadczenia w branży windowej',
            'Ubezpieczenie OC minimum 2 000 000 PLN',
            'Referencje z min. 5 podobnych modernizacji',
            'Autoryzacja producentów urządzeń'
        ],
        jsonb_build_object(
            'criteria', jsonb_build_array(
                jsonb_build_object('name', 'Cena', 'weight', 50, 'description', 'Całkowita cena brutto modernizacji'),
                jsonb_build_object('name', 'Jakość rozwiązań technicznych', 'weight', 30, 'description', 'Zastosowane technologie i komponenty'),
                jsonb_build_object('name', 'Okres gwarancji', 'weight', 20, 'description', 'Długość okresu gwarancji na prace i urządzenia')
            )
        ),
        jsonb_build_array(
            'Publikacja ogłoszenia',
            'Wizja lokalna obowiązkowa',
            'Termin na pytania',
            'Składanie ofert',
            'Sesja otwarcia ofert',
            'Ocena formalna i merytoryczna',
            'Negocjacje (jeśli wymagane)',
            'Wybór wykonawcy',
            'Podpisanie umowy'
        ),
        'Składanie ofert',
        8400,
        9, 187,
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Tender 3: Roof Renovation
    INSERT INTO tenders (
        id, title, description, category_id, manager_id, company_id,
        location, address, latitude, longitude,
        estimated_value, currency, status,
        submission_deadline, evaluation_deadline, project_duration,
        is_public, requirements, evaluation_criteria, current_phase,
        wadium, bids_count, views_count, published_at, created_at
    ) VALUES (
        gen_random_uuid(),
        'Remont i ocieplenie dachu budynku mieszkalnego',
        'Przetarg na kompleksowy remont dachu wraz z ociepleniem dla budynku mieszkalnego w centrum Poznania. Zakres: wymiana pokrycia dachowego, ocieplenie, wymiana rynien i obróbek blacharskich.',
        remonty_cat_id,
        dummy_manager_id,
        stary_id,
        'Poznań',
        'Stary Rynek 1, 61-001 Poznań',
        52.4064, 16.9252,
        280000, 'PLN',
        'active',
        CURRENT_DATE + INTERVAL '20 days',
        CURRENT_DATE + INTERVAL '27 days',
        '60 dni kalendarzowych',
        true,
        ARRAY[
            'Minimum 5 lat doświadczenia w remontach dachów',
            'Referencje z min. 3 podobnych realizacji',
            'Ubezpieczenie OC minimum 500 000 PLN',
            'Uprawnienia dekarskie'
        ],
        jsonb_build_object(
            'criteria', jsonb_build_array(
                jsonb_build_object('name', 'Cena', 'weight', 55, 'description', 'Całkowita cena realizacji'),
                jsonb_build_object('name', 'Termin realizacji', 'weight', 25, 'description', 'Czas ukończenia prac'),
                jsonb_build_object('name', 'Jakość materiałów', 'weight', 20, 'description', 'Proponowane materiały i technologie')
            )
        ),
        'Składanie ofert',
        5600,
        7, 156,
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '7 days'
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Successfully migrated comprehensive job and tender data to database';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error migrating data: %', SQLERRM;
        RAISE;
END $$;

