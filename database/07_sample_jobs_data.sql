-- =============================================
-- DOMIO PLATFORM - SAMPLE JOBS AND TENDERS DATA
-- =============================================

-- First, we need to create sample companies and users
-- Insert sample manager user and company

DO $$
DECLARE
    manager_company_id UUID;
    contractor_company_id UUID;
    remonty_cat_id UUID;
    instalacje_cat_id UUID;
    sprzątanie_cat_id UUID;
    zarządzanie_cat_id UUID;
BEGIN
    -- Create sample company for property managers
    INSERT INTO companies (name, type, city, address, phone, email, description, is_verified, verification_level)
    VALUES 
    ('Spółdzielnia Mieszkaniowa "Panorama"', 'spółdzielnia', 'Gdańsk', 'ul. Przykładowa 123', '+48 58 123 4567', 'kontakt@panorama.pl', 
     'Spółdzielnia mieszkaniowa zarządzająca budynkami w Gdańsku', true, 'verified'),
    ('Wspólnota Mieszkaniowa "Zielone Osiedle"', 'wspólnota', 'Warszawa', 'ul. Parkowa 45', '+48 22 987 6543', 'biuro@zieloneosiedle.pl',
     'Wspólnota mieszkaniowa w Warszawie', true, 'verified'),
    ('Spółdzielnia Mieszkaniowa "Sosnowy Las"', 'spółdzielnia', 'Kraków', 'ul. Sosnowa 78', '+48 12 345 6789', 'biuro@sosn owlas.pl',
     'Spółdzielnia mieszkaniowa w Krakowie', true, 'verified'),
    ('Firma Budowlana ProBud', 'contractor', 'Warszawa', 'ul. Budowlana 1', '+48 22 111 2222', 'kontakt@probud.pl',
     'Firma budowlana z 15-letnim doświadczeniem', true, 'premium')
    RETURNING id INTO manager_company_id;

    -- Get category IDs
    SELECT id INTO remonty_cat_id FROM job_categories WHERE slug = 'remonty-budownictwo' LIMIT 1;
    SELECT id INTO instalacje_cat_id FROM job_categories WHERE slug = 'instalacje-techniczne' LIMIT 1;
    SELECT id INTO sprzątanie_cat_id FROM job_categories WHERE slug = 'usługi-sprzątające' LIMIT 1;
    SELECT id INTO zarządzanie_cat_id FROM job_categories WHERE slug = 'zarządzanie-nieruchomościami' LIMIT 1;

    -- Insert sample jobs (regular postings)
    INSERT INTO jobs (
        title, description, category_id, subcategory, manager_id, company_id,
        location, address, latitude, longitude,
        budget_min, budget_max, budget_type, currency,
        project_duration, deadline, urgency, status, type, is_public,
        contact_person, contact_phone, contact_email,
        building_type, requirements, responsibilities, skills_required,
        applications_count, views_count, published_at, created_at
    ) VALUES
    -- Job 1: Wind service
    (
        'Konserwacja i naprawa wind - 2 budynki mieszkalne',
        'Spółdzielnia Mieszkaniowa "Panorama" poszukuje certyfikowanej firmy windowej do stałej obsługi serwisowej 8 wind w dwóch nowoczesnych budynkach mieszkalnych. Zlecenie obejmuje regularne przeglądy techniczne, bieżące naprawy, 24/7 obsługę awarii oraz modernizację starszych systemów.',
        zarządzanie_cat_id,
        'Konserwacja',
        '00000000-0000-0000-0000-000000000001'::UUID, -- Will need actual user IDs
        manager_company_id,
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
        ARRAY['Certyfikat UDT', 'Ubezpieczenie OC min. 500 000 PLN', 'Minimum 5 lat doświadczenia w serwisie wind'],
        ARRAY['Regularne przeglądy techniczne', 'Obsługa awarii 24/7', 'Modernizacja systemów'],
        ARRAY['UDT', 'serwis wind', 'konserwacja', 'awarie', 'dźwigi'],
        6, 142,
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours'
    ),
    
    -- Job 2: Pest control
    (
        'Kompleksowa dezynsekcja i deratyzacja - osiedle 120 mieszkań',
        'Wspólnota Mieszkaniowa "Zielone Osiedle" zleca kompleksową dezynsekcję i deratyzację 4 budynków mieszkalnych (120 mieszkań + części wspólne + piwnice + garaże podziemne).',
        zarządzanie_cat_id,
        'Specjalistyczne usługi',
        '00000000-0000-0000-0000-000000000001'::UUID,
        (SELECT id FROM companies WHERE name = 'Wspólnota Mieszkaniowa "Zielone Osiedle"' LIMIT 1),
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
    ),
    
    -- Job 3: Fence replacement
    (
        'Wymiana ogrodzenia i bram wjazdowych',
        'Spółdzielnia Mieszkaniowa "Sosnowy Las" zleca kompleksową wymianę ogrodzenia obwodowego osiedla mieszkaniowego wraz z modernizacją 2 bram wjazdowych.',
        remonty_cat_id,
        'Konstrukcje',
        '00000000-0000-0000-0000-000000000001'::UUID,
        (SELECT id FROM companies WHERE name = 'Spółdzielnia Mieszkaniowa "Sosnowy Las"' LIMIT 1),
        'Kraków',
        'ul. Leśna 89, 31-001 Kraków',
        50.0647, 19.9450,
        80000, 120000, 'range', 'PLN',
        '60 dni kalendarzowych',
        CURRENT_DATE + INTERVAL '30 days',
        'medium',
        'active',
        'regular',
        true,
        'Piotr Wiśniewski',
        '+48 12 345 6789',
        'wisniewski@sosnowlas.pl',
        'Osiedle mieszkaniowe',
        ARRAY['Doświadczenie w montażu ogrodzeń', 'Uprawnienia spawalnicze', 'Referencje z min. 3 realizacji'],
        ARRAY['Demontaż starego ogrodzenia', 'Montaż nowego ogrodzenia panelowego', 'Instalacja bram automatycznych'],
        ARRAY['ogrodzenie', 'bramy', 'spawanie', 'automatyka'],
        8, 156,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    );

    -- Insert sample tenders
    INSERT INTO tenders (
        title, description, category_id, manager_id, company_id,
        location, address, latitude, longitude,
        estimated_value, currency, status,
        submission_deadline, evaluation_deadline, project_duration,
        is_public, requirements, evaluation_criteria, phases, current_phase,
        wadium, bids_count, views_count, published_at, created_at
    ) VALUES
    -- Tender 1: Thermal modernization
    (
        'Kompleksowa termomodernizacja budynku wielorodzinnego - 11 kondygnacji',
        'Przetarg na wykonanie kompleksowej termomodernizacji budynku mieszkalnego przy ul. Parkowej 15-25 w Warszawie. Zakres obejmuje ocieplenie ścian zewnętrznych, wymianę okien w klatkach schodowych, modernizację dachu oraz montaż paneli fotowoltaicznych.',
        remonty_cat_id,
        '00000000-0000-0000-0000-000000000001'::UUID,
        (SELECT id FROM companies WHERE name = 'Wspólnota Mieszkaniowa "Zielone Osiedle"' LIMIT 1),
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
        5000,
        12, 234,
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
    ),
    
    -- Tender 2: Elevator modernization
    (
        'Modernizacja 6 dźwigów osobowych',
        'Przetarg publiczny na kompleksową modernizację 6 dźwigów osobowych w 3 budynkach Spółdzielni Mieszkaniowej "Panorama" w Gdańsku. Modernizacja obejmuje wymianę wszystkich systemów sterowania, napędów, kabin oraz aktualizację do najnowszych standardów bezpieczeństwa.',
        instalacje_cat_id,
        '00000000-0000-0000-0000-000000000001'::UUID,
        (SELECT id FROM companies WHERE name = 'Spółdzielnia Mieszkaniowa "Panorama"' LIMIT 1),
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
        8000,
        9, 187,
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days'
    );

    RAISE NOTICE 'Sample jobs and tenders created successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating sample data: %', SQLERRM;
        -- Don't fail if user IDs don't exist, this is just sample data
END $$;



