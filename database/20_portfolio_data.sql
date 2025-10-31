-- =============================================
-- DOMIO PLATFORM - PORTFOLIO DATA
-- =============================================

-- =============================================
-- PORTFOLIO PROJECTS DATA
-- =============================================

-- Function to create comprehensive portfolio data for contractors
CREATE OR REPLACE FUNCTION create_portfolio_data()
RETURNS VOID AS $$
DECLARE
    contractor_company RECORD;
    remonty_category_id UUID;
    instalacje_category_id UUID;
    wykończenia_category_id UUID;
    sprzątanie_category_id UUID;
    zarządzanie_category_id UUID;
    project_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO remonty_category_id FROM job_categories WHERE slug = 'remonty-budownictwo';
    SELECT id INTO instalacje_category_id FROM job_categories WHERE slug = 'instalacje-techniczne';
    SELECT id INTO wykończenia_category_id FROM job_categories WHERE slug = 'wykończenia-dekoracje';
    SELECT id INTO sprzątanie_category_id FROM job_categories WHERE slug = 'usługi-sprzątające';
    SELECT id INTO zarządzanie_category_id FROM job_categories WHERE slug = 'zarządzanie-nieruchomościami';
    
    -- Add portfolio projects for contractor companies
    FOR contractor_company IN SELECT id, name FROM companies WHERE type = 'contractor' LOOP
        IF contractor_company.name LIKE '%Reno%' THEN
            -- RenoBud portfolio - Remonty i Budownictwo
            INSERT INTO portfolio_projects (company_id, title, description, category_id, location, project_type, budget_range, duration, completion_date, client_name, client_feedback, is_featured, sort_order) VALUES
            (contractor_company.id, 'Remont mieszkania 120m² w Mokotowie', 'Kompleksowy remont luksusowego mieszkania z najwyższej jakości materiałami. Wykonano: wymianę instalacji elektrycznej i hydraulicznej, układanie podłóg, malowanie ścian, montaż kuchni i łazienki.', remonty_category_id, 'Warszawa, Mokotów', 'residential', '150,000 - 200,000 zł', '3 miesiące', '2023-11-15', 'Właściciel mieszkania', 'Doskonała jakość wykonania, terminowość i profesjonalizm. Polecam!', true, 1),
            
            (contractor_company.id, 'Remont łazienki z jacuzzi', 'Projekt i realizacja luksusowej łazienki z jacuzzi i sauną. Wykonano: kompleksową przebudowę łazienki, montaż jacuzzi, sauny, nowoczesnych mebli łazienkowych.', remonty_category_id, 'Warszawa, Śródmieście', 'residential', '80,000 - 120,000 zł', '6 tygodni', '2023-09-20', 'Właściciel mieszkania', 'Wspaniały efekt końcowy, wszystko zgodnie z projektem.', false, 2),
            
            (contractor_company.id, 'Termomodernizacja budynku mieszkalnego', 'Kompleksowa termomodernizacja 4-kondygnacyjnego budynku mieszkalnego. Wykonano: ocieplenie ścian zewnętrznych, wymianę okien, modernizację instalacji grzewczej.', remonty_category_id, 'Warszawa, Wola', 'residential', '450,000 - 600,000 zł', '4 miesiące', '2023-08-30', 'Wspólnota mieszkaniowa', 'Znaczne oszczędności na ogrzewaniu, budynek wygląda jak nowy.', true, 3),
            
            (contractor_company.id, 'Remont kuchni w stylu nowoczesnym', 'Kompleksowy remont kuchni z projektem i realizacją. Wykonano: demontaż starej kuchni, przygotowanie instalacji, montaż nowoczesnych mebli kuchennych.', remonty_category_id, 'Warszawa, Żoliborz', 'residential', '35,000 - 50,000 zł', '3 tygodnie', '2023-07-15', 'Właściciel mieszkania', 'Kuchnia wyszła dokładnie tak jak chcieliśmy, bardzo zadowoleni.', false, 4);
            
        ELSIF contractor_company.name LIKE '%Hydro%' THEN
            -- HydroMaster portfolio - Instalacje Techniczne
            INSERT INTO portfolio_projects (company_id, title, description, category_id, location, project_type, budget_range, duration, completion_date, client_name, client_feedback, is_featured, sort_order) VALUES
            (contractor_company.id, 'Instalacja pompy ciepła', 'Kompleksowa instalacja pompy ciepła z systemem ogrzewania podłogowego. Wykonano: montaż pompy ciepła, instalację ogrzewania podłogowego, modernizację instalacji hydraulicznej.', instalacje_category_id, 'Kraków, Nowa Huta', 'residential', '45,000 - 65,000 zł', '2 tygodnie', '2023-10-10', 'Wspólnota mieszkaniowa', 'Profesjonalne wykonanie, oszczędności na ogrzewaniu widoczne od razu.', true, 1),
            
            (contractor_company.id, 'Modernizacja instalacji hydraulicznej', 'Kompleksowa modernizacja instalacji hydraulicznej w budynku mieszkalnym. Wykonano: wymianę rur, montaż nowych zaworów, modernizację kotłowni.', instalacje_category_id, 'Kraków, Stare Miasto', 'residential', '25,000 - 35,000 zł', '1 tydzień', '2023-09-05', 'Wspólnota mieszkaniowa', 'Szybka realizacja, wysokiej jakości materiały.', false, 2),
            
            (contractor_company.id, 'Instalacja systemu rekuperacji', 'Montaż systemu rekuperacji z odzyskiem ciepła. Wykonano: montaż centrali wentylacyjnej, rozprowadzenie kanałów, automatyka sterująca.', instalacje_category_id, 'Kraków, Podgórze', 'residential', '15,000 - 25,000 zł', '5 dni', '2023-08-20', 'Właściciel domu', 'Świetna jakość powietrza w domu, polecam.', true, 3);
            
        ELSIF contractor_company.name LIKE '%Elektro%' THEN
            -- ElektroProfi portfolio - Instalacje Elektryczne
            INSERT INTO portfolio_projects (company_id, title, description, category_id, location, project_type, budget_range, duration, completion_date, client_name, client_feedback, is_featured, sort_order) VALUES
            (contractor_company.id, 'System Smart Home', 'Kompleksowa automatyka domowa KNX z kontrolą oświetlenia, ogrzewania i bezpieczeństwa. Wykonano: montaż systemu KNX, sterowanie oświetleniem, kontrola ogrzewania.', instalacje_category_id, 'Gdańsk, Oliwa', 'residential', '25,000 - 35,000 zł', '1 tydzień', '2023-12-05', 'Właściciel domu', 'Nowoczesne rozwiązania, łatwa obsługa, wszystko działa bez zarzutu.', true, 1),
            
            (contractor_company.id, 'Instalacja fotowoltaiki', 'Montaż instalacji fotowoltaicznej 10kW z magazynem energii. Wykonano: montaż paneli słonecznych, instalację falownika, system monitoringu.', instalacje_category_id, 'Gdańsk, Wrzeszcz', 'residential', '55,000 - 75,000 zł', '3 dni', '2023-11-20', 'Właściciel domu', 'Znaczne oszczędności na prądzie, instalacja działa bezproblemowo.', true, 2),
            
            (contractor_company.id, 'Modernizacja instalacji elektrycznej', 'Kompleksowa modernizacja instalacji elektrycznej w budynku biurowym. Wykonano: wymianę rozdzielni, modernizację okablowania, montaż nowych gniazd.', instalacje_category_id, 'Gdańsk, Śródmieście', 'commercial', '40,000 - 60,000 zł', '2 tygodnie', '2023-10-15', 'Zarządca budynku', 'Profesjonalne wykonanie, zgodne z normami.', false, 3);
        END IF;
    END LOOP;
    
    -- Add portfolio projects for additional contractors (if they exist)
    FOR contractor_company IN SELECT id, name FROM companies WHERE type = 'contractor' AND name NOT LIKE '%Reno%' AND name NOT LIKE '%Hydro%' AND name NOT LIKE '%Elektro%' LOOP
        -- Generic portfolio projects for other contractors
        INSERT INTO portfolio_projects (company_id, title, description, category_id, location, project_type, budget_range, duration, completion_date, client_name, client_feedback, is_featured, sort_order) VALUES
        (contractor_company.id, 'Remont mieszkania', 'Kompleksowy remont mieszkania z najwyższej jakości materiałami', remonty_category_id, 'Warszawa', 'residential', '80,000 - 120,000 zł', '2 miesiące', '2023-10-01', 'Właściciel mieszkania', 'Doskonała jakość wykonania', true, 1),
        (contractor_company.id, 'Instalacja elektryczna', 'Modernizacja instalacji elektrycznej w budynku mieszkalnym', instalacje_category_id, 'Warszawa', 'residential', '15,000 - 25,000 zł', '1 tydzień', '2023-09-15', 'Wspólnota mieszkaniowa', 'Profesjonalne wykonanie', false, 2);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute portfolio data creation
SELECT create_portfolio_data();

-- Drop helper function after use
DROP FUNCTION IF EXISTS create_portfolio_data();

-- =============================================
-- PORTFOLIO PROJECT IMAGES DATA
-- =============================================

-- Function to create sample portfolio project images
CREATE OR REPLACE FUNCTION create_portfolio_images()
RETURNS VOID AS $$
DECLARE
    project_record RECORD;
    company_record RECORD;
    image_urls TEXT[] := ARRAY[
        'https://images.unsplash.com/photo-1697992350283-e865ae4d5bac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWlsZGluZyUyMHJlbm92YXRpb24lMjBmYWNhZGV8ZW58MXx8fHwxNzU3NDIxMjkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1602497485099-e41a116a272c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBvZmZpY2UlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTc0MjEyOTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1581626216082-f8497d54e0a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBjb21wYW55JTIwbG9nb3xlbnwxfHx8fDE3NTc0MjA1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1684497404598-6e844dff9cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB0ZWFtJTIwd29ya2Vyc3xlbnwxfHx8fDE3NTc0MjEyODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwd29ya2Vyc3xlbnwxfHx8fDE3NTc0MjEyODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ];
    i INTEGER;
    file_id UUID;
    system_user_id UUID;
BEGIN
    -- Create a system user for portfolio images (or use existing system user)
    -- First, try to find an existing system user
    SELECT id INTO system_user_id FROM user_profiles WHERE user_type = 'contractor' LIMIT 1;
    
    -- If no user exists, create a system user for portfolio images
    IF system_user_id IS NULL THEN
        system_user_id := uuid_generate_v4();
        INSERT INTO user_profiles (id, user_type, first_name, last_name, phone, is_verified, profile_completed, onboarding_completed) VALUES
        (system_user_id, 'contractor', 'System', 'User', '+48123456789', true, true, true);
    END IF;
    
    -- Add sample images for each portfolio project
    FOR project_record IN SELECT id, title FROM portfolio_projects LOOP
        -- Create file upload records for images
        FOR i IN 1..3 LOOP
            -- Generate a UUID for file_id
            file_id := uuid_generate_v4();
            
            -- Insert file upload record with system user_id
            INSERT INTO file_uploads (id, user_id, file_name, original_name, file_path, file_size, mime_type, file_type, entity_type, entity_id, description, alt_text, is_public) VALUES
            (file_id, system_user_id, 'portfolio_' || substring(project_record.id::text, 1, 8) || '_' || i || '.jpg', 
             'portfolio_' || substring(project_record.id::text, 1, 8) || '_' || i || '.jpg',
             image_urls[((i-1) % array_length(image_urls, 1)) + 1], 
             1024000, 'image/jpeg', 'portfolio', 'portfolio_project', project_record.id,
             'Zdjęcie projektu: ' || project_record.title,
             'Zdjęcie pokazujące realizację projektu ' || project_record.title,
             true);
            
            -- Insert portfolio project image record
            INSERT INTO portfolio_project_images (project_id, file_id, title, description, alt_text, image_type, sort_order) VALUES
            (project_record.id, file_id, 
             CASE 
                 WHEN i = 1 THEN 'Zdjęcie główne projektu'
                 WHEN i = 2 THEN 'Szczegóły realizacji'
                 ELSE 'Efekt końcowy'
             END,
             CASE 
                 WHEN i = 1 THEN 'Główne zdjęcie pokazujące projekt'
                 WHEN i = 2 THEN 'Szczegóły wykonania prac'
                 ELSE 'Efekt końcowy projektu'
             END,
             'Zdjęcie projektu ' || project_record.title,
             CASE 
                 WHEN i = 1 THEN 'general'
                 WHEN i = 2 THEN 'during'
                 ELSE 'after'
             END,
             i);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute portfolio images creation
SELECT create_portfolio_images();

-- Drop helper function after use
DROP FUNCTION IF EXISTS create_portfolio_images();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify portfolio data was created
SELECT 
    c.name as company_name,
    COUNT(pp.id) as project_count,
    COUNT(ppi.id) as image_count
FROM companies c
LEFT JOIN portfolio_projects pp ON c.id = pp.company_id
LEFT JOIN portfolio_project_images ppi ON pp.id = ppi.project_id
WHERE c.type = 'contractor'
GROUP BY c.id, c.name
ORDER BY project_count DESC;

-- Show sample portfolio projects
SELECT 
    c.name as company_name,
    pp.title,
    pp.description,
    pp.location,
    pp.budget_range,
    pp.completion_date,
    pp.is_featured
FROM companies c
JOIN portfolio_projects pp ON c.id = pp.company_id
WHERE c.type = 'contractor'
ORDER BY c.name, pp.sort_order;
