-- =============================================
-- SEED MANAGER PROFILES
-- =============================================
-- Migrate 6 mock manager profiles to companies table
-- Based on mockManagers.ts data

-- Insert manager profiles with proper JSONB structures

-- Manager 1: WSM "Osiedle Parkowe"
INSERT INTO companies (
    name,
    short_name,
    type,
    nip,
    regon,
    city,
    phone,
    email,
    website,
    address,
    description,
    founded_year,
    employee_count,
    avatar_url,
    cover_image_url,
    is_verified,
    verification_level,
    plan_type,
    last_active,
    experience_data,
    stats_data,
    manager_data
) VALUES (
    'WSM "Osiedle Parkowe"',
    'Osiedle Parkowe',
    'wspólnota',
    '1234567890',
    '123456789',
    'Warszawa',
    '+48 22 123 45 67',
    'zarząd@osiedleparkowe.pl',
    'www.osiedleparkowe.pl',
    'ul. Parkowa 15, 02-515 Warszawa',
    'Nowoczesna wspólnota mieszkaniowa na Mokotowie. Aktywny zarząd, terminowe płatności, proekologiczne podejście.',
    2018,
    '5-15',
    '/api/placeholder/150/150',
    '/api/placeholder/800/300',
    true,
    'verified',
    'basic',
    NOW(),
    '{
        "years_active": 6,
        "published_jobs": 128,
        "completed_projects": 115,
        "active_contractors": 8,
        "budget_range": {"min": 5000, "max": 150000}
    }'::jsonb,
    '{
        "average_response_time": "4 godziny",
        "payment_punctuality": 96,
        "project_completion_rate": 94,
        "contractor_retention_rate": 85,
        "average_project_duration": "2-3 tygodnie"
    }'::jsonb,
    '{
        "organization_type": "wspólnota",
        "buildings_count": 3,
        "units_count": 84,
        "total_area": 6720,
        "managed_property_types": ["Mieszkania", "Garaże", "Lokale usługowe"],
        "construction_years": {"min": 2015, "max": 2018},
        "average_unit_size": 80,
        "primary_needs": ["Utrzymanie czystości", "Ochrona", "Zieleń"],
        "frequent_services": ["Malowanie klatek", "Drobne naprawy", "Przeglądy techniczne"],
        "special_requirements": ["Praca w weekendy", "Niski hałas", "Ekologiczne środki"],
        "payment_terms": ["Przelew 14 dni", "Płatność etapowa"],
        "average_project_budget": "25,000 zł",
        "required_certificates": ["Ubezpieczenie OC", "Certyfikaty branżowe"],
        "insurance_requirements": "OC minimum 500,000 zł",
        "preferred_payment_methods": ["Przelew bankowy", "Faktura VAT"],
        "working_hours": "Pon-Pt 8:00-17:00, Sobota 9:00-15:00",
        "special_requests": ["Ciche prace po 20:00", "Informowanie mieszkańców", "Sprzątanie po robotach"],
        "preferred_contractor_size": ["Małe firmy", "Średnie firmy"],
        "work_schedule_preference": "Elastyczny harmonogram",
        "communication_style": "Regularne raporty",
        "budget_flexibility": "Umiarkowana"
    }'::jsonb
);

-- Manager 2: Spółdzielnia Mieszkaniowa "Nowa Huta"
INSERT INTO companies (
    name,
    short_name,
    type,
    nip,
    regon,
    krs,
    city,
    phone,
    email,
    website,
    address,
    description,
    founded_year,
    employee_count,
    avatar_url,
    cover_image_url,
    is_verified,
    verification_level,
    plan_type,
    last_active,
    experience_data,
    stats_data,
    manager_data
) VALUES (
    'Spółdzielnia Mieszkaniowa "Nowa Huta"',
    'SM Nowa Huta',
    'spółdzielnia',
    '9876543210',
    '987654321',
    '0000123456',
    'Kraków',
    '+48 12 987 65 43',
    'administracja@sm-nowahuta.pl',
    'www.sm-nowahuta.krakow.pl',
    'os. Centrum E 1, 31-932 Kraków',
    'Tradycyjna spółdzielnia mieszkaniowa z 1978 roku. Duże projekty termomodernizacyjne, doświadczenie w przetargach publicznych.',
    1978,
    '15-50',
    '/api/placeholder/150/150',
    '/api/placeholder/800/300',
    true,
    'verified',
    'basic',
    NOW(),
    '{
        "years_active": 46,
        "published_jobs": 486,
        "completed_projects": 445,
        "active_contractors": 23,
        "budget_range": {"min": 20000, "max": 2500000}
    }'::jsonb,
    '{
        "average_response_time": "2 dni",
        "payment_punctuality": 92,
        "project_completion_rate": 89,
        "contractor_retention_rate": 78,
        "average_project_duration": "3-6 miesięcy"
    }'::jsonb,
    '{
        "organization_type": "spółdzielnia",
        "buildings_count": 24,
        "units_count": 1680,
        "total_area": 105000,
        "managed_property_types": ["Mieszkania", "Lokale użytkowe", "Garaże", "Piwnice"],
        "construction_years": {"min": 1975, "max": 1985},
        "average_unit_size": 62,
        "primary_needs": ["Termomodernizacja", "Remonty dachów", "Modernizacja wind"],
        "frequent_services": ["Wymiana instalacji", "Przeglądy techniczne", "Konserwacja"],
        "special_requirements": ["Duże projekty", "Przetargi publiczne", "Zgodność z prawem zamówień"],
        "payment_terms": ["Przelew 30 dni", "Płatność etapowa", "Gwarancje bankowe"],
        "average_project_budget": "280,000 zł",
        "required_certificates": ["Wpis do rejestru", "Certyfikaty ISO", "Uprawnienia budowlane"],
        "insurance_requirements": "OC minimum 2,000,000 zł",
        "preferred_payment_methods": ["Przelew bankowy", "Faktura VAT", "Gwarancje"],
        "working_hours": "Pon-Pt 7:00-18:00",
        "special_requests": ["Procedury przetargowe", "Dokumentacja techniczna", "Nadzór techniczny"],
        "preferred_contractor_size": ["Średnie firmy", "Duże firmy"],
        "work_schedule_preference": "Ścisły harmonogram",
        "communication_style": "Formalna korespondencja",
        "budget_flexibility": "Niska - ścisły budżet"
    }'::jsonb
);

-- Manager 3: Zarząd Nieruchomości "Baltic Properties"
INSERT INTO companies (
    name,
    short_name,
    type,
    nip,
    regon,
    krs,
    city,
    phone,
    email,
    website,
    address,
    description,
    founded_year,
    employee_count,
    avatar_url,
    cover_image_url,
    is_verified,
    verification_level,
    plan_type,
    last_active,
    experience_data,
    stats_data,
    manager_data
) VALUES (
    'Zarząd Nieruchomości "Baltic Properties"',
    'Baltic Properties',
    'property_management',
    '5432167890',
    '543216789',
    '0000654321',
    'Gdańsk',
    '+48 58 555 12 34',
    'biuro@balticproperties.pl',
    'www.balticproperties.pl',
    'ul. Długa 45, 80-827 Gdańsk',
    'Premium zarządca nieruchomości z certyfikatem RICS. Facility Management, Smart Building technologies.',
    2015,
    '25-100',
    '/api/placeholder/150/150',
    '/api/placeholder/800/300',
    true,
    'premium',
    'premium',
    NOW(),
    '{
        "years_active": 9,
        "published_jobs": 267,
        "completed_projects": 251,
        "active_contractors": 15,
        "budget_range": {"min": 15000, "max": 500000}
    }'::jsonb,
    '{
        "average_response_time": "2 godziny",
        "payment_punctuality": 98,
        "project_completion_rate": 96,
        "contractor_retention_rate": 94,
        "average_project_duration": "1-2 miesiące"
    }'::jsonb,
    '{
        "organization_type": "zarządca",
        "buildings_count": 47,
        "units_count": 856,
        "total_area": 78400,
        "managed_property_types": ["Apartamenty premium", "Biura", "Lokale komercyjne", "Garaże"],
        "construction_years": {"min": 2010, "max": 2023},
        "average_unit_size": 92,
        "primary_needs": ["Facility Management", "Konserwacja premium", "Technologie Smart Building"],
        "frequent_services": ["Serwis 24/7", "Monitoring", "Concierge", "Cleaning premium"],
        "special_requirements": ["Wysokie standardy", "Certyfikowane firmy", "Dyskrecja"],
        "payment_terms": ["Przelew 7 dni", "Express 24h dla awarii"],
        "average_project_budget": "95,000 zł",
        "required_certificates": ["Certyfikaty ISO", "Licencje branżowe", "Referencje premium"],
        "insurance_requirements": "OC minimum 3,000,000 zł + AC",
        "preferred_payment_methods": ["Przelew express", "Faktoring", "Karty korporacyjne"],
        "working_hours": "24/7 dostępność dla awarii",
        "special_requests": ["Uniformy firmowe", "Background check", "NDA"],
        "preferred_contractor_size": ["Średnie firmy", "Duże firmy", "Specjaliści premium"],
        "work_schedule_preference": "Harmonogram dostosowany do mieszkańców",
        "communication_style": "Profesjonalne raportowanie",
        "budget_flexibility": "Wysoka dla jakości"
    }'::jsonb
);

-- Manager 4: Administracja Osiedla "Słoneczne Wzgórze"
INSERT INTO companies (
    name,
    short_name,
    type,
    nip,
    regon,
    city,
    phone,
    email,
    website,
    address,
    description,
    founded_year,
    employee_count,
    avatar_url,
    cover_image_url,
    is_verified,
    verification_level,
    plan_type,
    last_active,
    experience_data,
    stats_data,
    manager_data
) VALUES (
    'Administracja Osiedla "Słoneczne Wzgórze"',
    'Słoneczne Wzgórze',
    'housing_association',
    '8765432109',
    '876543210',
    'Wrocław',
    '+48 71 888 99 00',
    'administracja@slonecznewzgorze.pl',
    'www.slonecznewzgorze.wroclaw.pl',
    'ul. Słoneczna 123, 53-611 Wrocław',
    'Nowe osiedle z proekologicznym podejściem. Innowacyjne rozwiązania, energia odnawialna.',
    2020,
    '5-25',
    '/api/placeholder/150/150',
    '/api/placeholder/800/300',
    true,
    'verified',
    'basic',
    NOW(),
    '{
        "years_active": 4,
        "published_jobs": 67,
        "completed_projects": 58,
        "active_contractors": 6,
        "budget_range": {"min": 8000, "max": 120000}
    }'::jsonb,
    '{
        "average_response_time": "6 godzin",
        "payment_punctuality": 88,
        "project_completion_rate": 91,
        "contractor_retention_rate": 82,
        "average_project_duration": "2-4 tygodnie"
    }'::jsonb,
    '{
        "organization_type": "spółdzielnia",
        "buildings_count": 8,
        "units_count": 256,
        "total_area": 20480,
        "managed_property_types": ["Apartamenty", "Domy szeregowe", "Garaże", "Plac zabaw"],
        "construction_years": {"min": 2020, "max": 2023},
        "average_unit_size": 80,
        "primary_needs": ["Zieleń i ogrody", "Infrastruktura rekreacyjna", "Systemy inteligentne"],
        "frequent_services": ["Konserwacja placów zabaw", "Pielęgnacja terenów zielonych", "Oświetlenie LED"],
        "special_requirements": ["Ekologiczne materiały", "Energia odnawialna", "Przyjazne dzieciom"],
        "payment_terms": ["Przelew 21 dni", "Płatność po odbiorze"],
        "average_project_budget": "35,000 zł",
        "required_certificates": ["Certyfikaty ekologiczne", "Ubezpieczenie OC"],
        "insurance_requirements": "OC minimum 1,000,000 zł",
        "preferred_payment_methods": ["Przelew bankowy", "Faktura VAT"],
        "working_hours": "Pon-Pt 8:00-16:00, dostosowanie do mieszkańców",
        "special_requests": ["Materiały ekologiczne", "Niski wpływ na środowisko", "Cicha praca"],
        "preferred_contractor_size": ["Małe firmy", "Lokalni specjaliści"],
        "work_schedule_preference": "Elastyczny z uwzględnieniem mieszkańców",
        "communication_style": "Bezpośrednia komunikacja",
        "budget_flexibility": "Umiarkowana"
    }'::jsonb
);

-- Manager 5: Echo Investment - Zarządzanie Osiedlami
INSERT INTO companies (
    name,
    short_name,
    type,
    nip,
    regon,
    krs,
    city,
    phone,
    email,
    website,
    address,
    description,
    founded_year,
    employee_count,
    avatar_url,
    cover_image_url,
    is_verified,
    verification_level,
    plan_type,
    last_active,
    experience_data,
    stats_data,
    manager_data
) VALUES (
    'Echo Investment - Zarządzanie Osiedlami',
    'Echo Investment',
    'property_management',
    '7654321098',
    '765432109',
    '0000987654',
    'Poznań',
    '+48 61 777 88 99',
    'zarzadzanie@echo.com.pl',
    'www.echo-investment.pl',
    'ul. Grunwaldzka 186, 60-166 Poznań',
    'Deweloper premium notowany na GPW. Facility Management, standardy międzynarodowe, BREEAM/LEED.',
    1996,
    '50-200',
    '/api/placeholder/150/150',
    '/api/placeholder/800/300',
    true,
    'premium',
    'premium',
    NOW(),
    '{
        "years_active": 28,
        "published_jobs": 1247,
        "completed_projects": 1156,
        "active_contractors": 45,
        "budget_range": {"min": 50000, "max": 5000000}
    }'::jsonb,
    '{
        "average_response_time": "24 godziny",
        "payment_punctuality": 94,
        "project_completion_rate": 92,
        "contractor_retention_rate": 89,
        "average_project_duration": "6-18 miesięcy"
    }'::jsonb,
    '{
        "organization_type": "deweloper",
        "buildings_count": 156,
        "units_count": 4680,
        "total_area": 390000,
        "managed_property_types": ["Mieszkania premium", "Biura", "Galerie handlowe", "Hotele"],
        "construction_years": {"min": 2010, "max": 2024},
        "average_unit_size": 83,
        "primary_needs": ["Facility Management", "Property Management", "Inwestycje deweloperskie"],
        "frequent_services": ["Zarządzanie techniczne", "Obsługa najemców", "Modernizacje"],
        "special_requirements": ["Standardy międzynarodowe", "BREEAM/LEED", "ESG compliance"],
        "payment_terms": ["Przelew 14 dni", "Faktoring", "Gwarancje bankowe"],
        "average_project_budget": "450,000 zł",
        "required_certificates": ["ISO 9001", "ISO 14001", "Referencje międzynarodowe"],
        "insurance_requirements": "OC minimum 5,000,000 zł + CAR",
        "preferred_payment_methods": ["Przelew SEPA", "Faktoring odwrotny", "L/C"],
        "working_hours": "24/7 - międzynarodowe standardy",
        "special_requests": ["Due diligence", "Compliance ESG", "Raportowanie korporacyjne"],
        "preferred_contractor_size": ["Duże firmy", "Konsorcja", "Generalni wykonawcy"],
        "work_schedule_preference": "Harmonogram deweloperski",
        "communication_style": "Korporacyjne standardy",
        "budget_flexibility": "Wysoka dla innowacji"
    }'::jsonb
);

-- Manager 6: TBS "Społeczne Mieszkania Lublin"
INSERT INTO companies (
    name,
    short_name,
    type,
    nip,
    regon,
    krs,
    city,
    phone,
    email,
    website,
    address,
    description,
    founded_year,
    employee_count,
    avatar_url,
    cover_image_url,
    is_verified,
    verification_level,
    plan_type,
    last_active,
    experience_data,
    stats_data,
    manager_data
) VALUES (
    'TBS "Społeczne Mieszkania Lublin"',
    'TBS Lublin',
    'cooperative',
    '6543210987',
    '654321098',
    '0000456789',
    'Lublin',
    '+48 81 444 55 66',
    'administracja@tbs-lublin.pl',
    'www.tbs-lublin.pl',
    'ul. Społeczna 45, 20-614 Lublin',
    'TBS certyfikowany, budownictwo społeczne, dotacje publiczne. Najniższa cena przy zachowaniu jakości.',
    2005,
    '5-25',
    '/api/placeholder/150/150',
    '/api/placeholder/800/300',
    true,
    'verified',
    'basic',
    NOW(),
    '{
        "years_active": 19,
        "published_jobs": 156,
        "completed_projects": 142,
        "active_contractors": 8,
        "budget_range": {"min": 5000, "max": 180000}
    }'::jsonb,
    '{
        "average_response_time": "5 dni",
        "payment_punctuality": 85,
        "project_completion_rate": 87,
        "contractor_retention_rate": 72,
        "average_project_duration": "4-8 tygodni"
    }'::jsonb,
    '{
        "organization_type": "tbs",
        "buildings_count": 12,
        "units_count": 384,
        "total_area": 23040,
        "managed_property_types": ["Mieszkania społeczne", "Mieszkania chronione", "Lokale usługowe"],
        "construction_years": {"min": 2006, "max": 2020},
        "average_unit_size": 60,
        "primary_needs": ["Remonty podstawowe", "Utrzymanie niedrogie", "Energia odnawialna"],
        "frequent_services": ["Malowanie", "Drobne naprawy", "Przeglądy okresowe"],
        "special_requirements": ["Niskie koszty", "Trwałe rozwiązania", "Procedury publiczne"],
        "payment_terms": ["Przelew 30 dni", "Procedury publiczne"],
        "average_project_budget": "45,000 zł",
        "required_certificates": ["Certyfikaty energetyczne", "Zgodność z prawem zamówień"],
        "insurance_requirements": "OC minimum 1,000,000 zł",
        "preferred_payment_methods": ["Przelew bankowy", "Procedury urzędowe"],
        "working_hours": "Pon-Pt 8:00-16:00",
        "special_requests": ["Procedury przetargowe", "Dokumentacja szczegółowa", "Gwarancje rozszerzone"],
        "preferred_contractor_size": ["Małe firmy", "Lokalni wykonawcy"],
        "work_schedule_preference": "Standardowe godziny pracy",
        "communication_style": "Formalne procedury",
        "budget_flexibility": "Bardzo niska - ograniczony budżet"
    }'::jsonb
);

-- Create ratings for managers
-- Note: These will link to company_ratings table after seeding
-- For now, insert placeholder ratings (use INSERT ... ON CONFLICT to handle duplicates)
INSERT INTO company_ratings (company_id, average_rating, total_reviews, rating_breakdown, category_ratings, last_review_date)
SELECT 
    id,
    4.7, -- average
    0, -- will be populated with real review count
    '{"5": 35, "4": 8, "3": 2, "2": 0, "1": 0}'::jsonb,
    '{"payment_timeliness": 4.8, "communication": 4.7, "project_clarity": 4.7, "professionalism": 4.7}'::jsonb,
    NOW()
FROM companies
WHERE name LIKE 'WSM%' OR name LIKE 'Spółdzielnia%' OR name LIKE 'Zarząd%' 
     OR name LIKE 'Administracja%' OR name LIKE 'Echo%' OR name LIKE 'TBS%'
     OR name LIKE 'GLN%' OR name LIKE 'Invest-Wilno%' OR name LIKE 'Warsaw%'
     OR name LIKE 'Green%' OR name LIKE 'Sky%' OR name LIKE 'Alpha%'
ON CONFLICT (company_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    rating_breakdown = EXCLUDED.rating_breakdown,
    category_ratings = EXCLUDED.category_ratings,
    last_review_date = EXCLUDED.last_review_date;

-- Additional Manager 7: GLN Nieruchomości Sp. z o.o.
INSERT INTO companies (
    name, short_name, type, nip, regon, city, phone, email, website, address, description,
    founded_year, employee_count, avatar_url, cover_image_url, is_verified, verification_level,
    plan_type, last_active, experience_data, stats_data, manager_data
) VALUES (
    'GLN Nieruchomości Sp. z o.o.', 'GLN Nieruchomości', 'spółdzielnia', '1122334455', '112233445', 'Łódź',
    '+48 42 555 66 77', 'kontakt@gln-nieruchomosci.pl', 'www.gln-nieruchomosci.pl', 'ul. Piotrkowska 152, 90-368 Łódź',
    'Profesjonalne zarządzanie nieruchomościami mieszkalnymi i komercyjnymi. Wykwalifikowany zespół, nowoczesne narzędzia, kompleksowa obsługa.',
    2012, '25-100', '/api/placeholder/150/150', '/api/placeholder/800/300', true, 'verified', 'pro', NOW(),
    '{ "years_active": 12, "published_jobs": 378, "completed_projects": 345, "active_contractors": 23, "budget_range": {"min": 15000, "max": 350000} }'::jsonb,
    '{ "average_response_time": "48 godzin", "payment_punctuality": 92, "project_completion_rate": 89, "contractor_retention_rate": 78, "average_project_duration": "3-5 tygodni" }'::jsonb,
    '{ "organization_type": "zarządca", "buildings_count": 28, "units_count": 1247, "total_area": 99800, "managed_property_types": ["Apartamenty", "Biura", "Lokale usługowe"], "construction_years": {"min": 1990, "max": 2020}, "average_unit_size": 80, "primary_needs": ["Zarządzanie finansami", "Księgowość", "Nadzór techniczny"], "frequent_services": ["Remonty elewacji", "Modernizacja instalacji", "Zarządzanie odpadami"], "special_requirements": ["Dokumentacja techniczna", "Harmonogram prac", "Raportowanie tygodniowe"], "payment_terms": ["Przelew 30 dni", "Faktura miesięczna"], "average_project_budget": "85,000 zł", "required_certificates": ["Ubezpieczenie OC", "Wpis do rejestru"], "insurance_requirements": "OC minimum 1,000,000 zł", "preferred_payment_methods": ["Przelew", "Faktura VAT"], "working_hours": "Pon-Pt 8:00-18:00", "special_requests": ["Szczegółowa dokumentacja", "Regularne raporty postępu"], "preferred_contractor_size": ["Średnie firmy", "Duże firmy"], "work_schedule_preference": "Ustalone terminy", "communication_style": "Formalna komunikacja pisemna", "budget_flexibility": "Ograniczona" }'::jsonb
);

-- Additional Manager 8: Invest-Wilno Development S.A.
INSERT INTO companies (
    name, short_name, type, nip, regon, krs, city, phone, email, website, address, description,
    founded_year, employee_count, avatar_url, cover_image_url, is_verified, verification_level,
    plan_type, last_active, experience_data, stats_data, manager_data
) VALUES (
    'Invest-Wilno Development S.A.', 'Invest-Wilno', 'spółdzielnia', '9988776655', '998877665', '0000456789', 'Katowice',
    '+48 32 888 99 00', 'info@invest-wilno.pl', 'www.invest-wilno.pl', 'ul. Armii Krajowej 45, 40-156 Katowice',
    'Deweloper i zarządca z 15-letnim doświadczeniem. Specjalizacja w kompleksach mieszkaniowych premium. Certyfikaty LEED, ENERGY STAR.',
    2008, '100-500', '/api/placeholder/150/150', '/api/placeholder/800/300', true, 'premium', 'premium', NOW(),
    '{ "years_active": 16, "published_jobs": 892, "completed_projects": 856, "active_contractors": 67, "budget_range": {"min": 100000, "max": 10000000} }'::jsonb,
    '{ "average_response_time": "12 godzin", "payment_punctuality": 95, "project_completion_rate": 93, "contractor_retention_rate": 88, "average_project_duration": "4-8 tygodni" }'::jsonb,
    '{ "organization_type": "deweloper", "buildings_count": 47, "units_count": 2847, "total_area": 227760, "managed_property_types": ["Apartamenty premium", "Penthousy", "Garaże podziemne", "Powierzchnie komercyjne"], "construction_years": {"min": 2010, "max": 2024}, "average_unit_size": 85, "primary_needs": ["Nowoczesne rozwiązania", "Czyścioch sprzątanie", "Smart home", "Ochrona 24/7"], "frequent_services": ["Przeglądy HVAC", "Czyszczenie elewacji", "Konserwacja zieleni", "Modernizacja techniczna"], "special_requirements": ["Certyfikaty ekologiczne", "Wysokie standardy jakości", "Zgodność z normami międzynarodowymi"], "payment_terms": ["Przelew 14 dni", "Płatność terminowa"], "average_project_budget": "150,000 zł", "required_certificates": ["ISO 9001", "Ubezpieczenie OC min 5M"], "insurance_requirements": "OC minimum 5,000,000 zł", "preferred_payment_methods": ["Przelew SEPA", "Faktura VAT EU"], "working_hours": "24/7 monitoring", "special_requests": ["Wysokie standardy wykonawcze", "Zero defektów", "Certyfikacja zgodności"], "preferred_contractor_size": ["Duże firmy", "Firmy międzynarodowe"], "work_schedule_preference": "Harmonogram zaawansowany", "communication_style": "Raportowanie codzienne", "budget_flexibility": "Duża" }'::jsonb
);

-- Additional Manager 9: Warsaw Property Management
INSERT INTO companies (
    name, short_name, type, nip, regon, city, phone, email, website, address, description,
    founded_year, employee_count, avatar_url, cover_image_url, is_verified, verification_level,
    plan_type, last_active, experience_data, stats_data, manager_data
) VALUES (
    'Warsaw Property Management Ltd.', 'WPM Ltd.', 'wspólnota', '6677889900', '667788990', 'Warszawa',
    '+48 22 444 55 66', 'office@wpm.pl', 'www.wpm.pl', 'ul. Marszałkowska 126/134, 00-008 Warszawa',
    'Brytyjsko-polska firma zarządzająca nieruchomościami. Międzynarodowe standardy, profesjonalizm, długoterminowe relacje z klientami.',
    2015, '15-50', '/api/placeholder/150/150', '/api/placeholder/800/300', true, 'verified', 'basic', NOW(),
    '{ "years_active": 9, "published_jobs": 234, "completed_projects": 221, "active_contractors": 14, "budget_range": {"min": 20000, "max": 400000} }'::jsonb,
    '{ "average_response_time": "6 godzin", "payment_punctuality": 90, "project_completion_rate": 87, "contractor_retention_rate": 80, "average_project_duration": "2-4 tygodnie" }'::jsonb,
    '{ "organization_type": "zarządca", "buildings_count": 15, "units_count": 672, "total_area": 53760, "managed_property_types": ["Mieszkania", "Apartamenty", "Kwatery"], "construction_years": {"min": 1950, "max": 2018}, "average_unit_size": 80, "primary_needs": ["Remonty ogólne", "Ocieplenia", "Wymiana okien", "Modernizacja"], "frequent_services": ["Remonty klatek", "Termomodernizacja", "Wymiana instalacji"], "special_requirements": ["Standardy brytyjskie", "Szczegółowa dokumentacja", "Język angielski mile widziany"], "payment_terms": ["Przelew 21 dni", "Faktura EUR/PLN"], "average_project_budget": "65,000 zł", "required_certificates": ["Ubezpieczenie OC", "Polisy brytyjskie akceptowane"], "insurance_requirements": "OC minimum 1,000,000 zł", "preferred_payment_methods": ["Przelew międzynarodowy", "Faktura VAT"], "working_hours": "Pon-Pt 9:00-17:00 GMT", "special_requests": ["Komunikacja w j. angielskim", "Szczegółowe raporty", "Zgodność ze standardami UK"], "preferred_contractor_size": ["Średnie firmy"], "work_schedule_preference": "Biznesowy", "communication_style": "Professional written reports", "budget_flexibility": "Standardowa" }'::jsonb
);

-- Additional Manager 10: Green Management Sp. z o.o.
INSERT INTO companies (
    name, short_name, type, nip, regon, city, phone, email, website, address, description,
    founded_year, employee_count, avatar_url, cover_image_url, is_verified, verification_level,
    plan_type, last_active, experience_data, stats_data, manager_data
) VALUES (
    'Green Management Sp. z o.o.', 'Green Management', 'spółdzielnia', '5566778899', '556677889', 'Kraków',
    '+48 12 333 44 55', 'biuro@green-management.pl', 'www.green-management.pl', 'ul. Floriańska 28, 31-019 Kraków',
    'Ekologiczne zarządzanie nieruchomościami. Certyfikaty LEED, BREEAM. Panele słoneczne, pompy ciepła, zrównoważony rozwój.',
    2017, '10-30', '/api/placeholder/150/150', '/api/placeholder/800/300', true, 'verified', 'basic', NOW(),
    '{ "years_active": 7, "published_jobs": 156, "completed_projects": 142, "active_contractors": 11, "budget_range": {"min": 25000, "max": 250000} }'::jsonb,
    '{ "average_response_time": "8 godzin", "payment_punctuality": 91, "project_completion_rate": 88, "contractor_retention_rate": 83, "average_project_duration": "3-6 tygodni" }'::jsonb,
    '{ "organization_type": "spółdzielnia", "buildings_count": 12, "units_count": 432, "total_area": 34560, "managed_property_types": ["Mieszkania", "Garaże", "Miejsca parkingowe"], "construction_years": {"min": 2015, "max": 2020}, "average_unit_size": 80, "primary_needs": ["Energia odnawialna", "Retencja wody", "Zieleń miejską", "Recycling"], "frequent_services": ["Instalacja paneli PV", "Montaż pomp ciepła", "Zielone dachy", "Systemy rekuperacji"], "special_requirements": ["Materiały ekologiczne", "Certyfikaty energetyczne", "Zero waste", "Fair trade"], "payment_terms": ["Przelew 14 dni", "Zielone finanse"], "average_project_budget": "55,000 zł", "required_certificates": ["Certyfikaty ekologiczne", "LEED/BREEAM"], "insurance_requirements": "OC minimum 750,000 zł", "preferred_payment_methods": ["Przelew bankowy", "Green bonds"], "working_hours": "Pon-Pt 8:00-16:00", "special_requests": ["100% ekologiczne materiały", "Monitoring wpływu CO2", "Raportowanie ESG"], "preferred_contractor_size": ["Małe firmy", "Lokalni eko-specjaliści"], "work_schedule_preference": "Ekologiczny kalendarz", "communication_style": "Transparentna komunikacja ESG", "budget_flexibility": "Umiarkowana" }'::jsonb
);

-- Additional Manager 11: Sky Towers Management
INSERT INTO companies (
    name, short_name, type, nip, regon, krs, city, phone, email, website, address, description,
    founded_year, employee_count, avatar_url, cover_image_url, is_verified, verification_level,
    plan_type, last_active, experience_data, stats_data, manager_data
) VALUES (
    'Sky Towers Management Sp. z o.o.', 'Sky Towers', 'spółdzielnia', '4455667788', '445566778', '0000321564', 'Szczecin',
    '+48 91 222 33 44', 'info@skytowers.pl', 'www.skytowers.pl', 'ul. Wały Chrobrego 18, 70-502 Szczecin',
    'Zarządzanie wieżowcami i kompleksami biurowymi. Concierge service, smart building, facility management na najwyższym poziomie.',
    2010, '35-150', '/api/placeholder/150/150', '/api/placeholder/800/300', true, 'verified', 'pro', NOW(),
    '{ "years_active": 14, "published_jobs": 567, "completed_projects": 534, "active_contractors": 38, "budget_range": {"min": 50000, "max": 2000000} }'::jsonb,
    '{ "average_response_time": "2 godziny", "payment_punctuality": 97, "project_completion_rate": 95, "contractor_retention_rate": 90, "average_project_duration": "4-10 tygodni" }'::jsonb,
    '{ "organization_type": "zarządca", "buildings_count": 8, "units_count": 1247, "total_area": 99760, "managed_property_types": ["Biura", "Przestrzenie coworking", "Sale konferencyjne", "Pokoje hotelowe"], "construction_years": {"min": 2012, "max": 2023}, "average_unit_size": 80, "primary_needs": ["Smart building", "Maintenance predykcyjny", "Comfort Class", "Hotel services"], "frequent_services": ["Systemy BMS", "Automatyzacja", "Climate control", "Security 24/7"], "special_requirements": ["Certyfikaty LEED Platinum", "Dostępność dla niepełnosprawnych", "Well Building"], "payment_terms": ["Przelew 7 dni", "Płatność gwarantowana"], "average_project_budget": "185,000 zł", "required_certificates": ["ISO 41001", "OC min 10M"], "insurance_requirements": "OC minimum 10,000,000 zł", "preferred_payment_methods": ["Przelew natychmiastowy", "Bank guarantee"], "working_hours": "24/7", "special_requests": ["Zero downtime", "Proactive maintenance", "IoT sensors"], "preferred_contractor_size": ["Duże firmy", "International FM"], "work_schedule_preference": "Planned maintenance calendar", "communication_style": "Real-time monitoring", "budget_flexibility": "Wysoka" }'::jsonb
);

-- Additional Manager 12: Alpha Real Estate Group
INSERT INTO companies (
    name, short_name, type, nip, regon, city, phone, email, website, address, description,
    founded_year, employee_count, avatar_url, cover_image_url, is_verified, verification_level,
    plan_type, last_active, experience_data, stats_data, manager_data
) VALUES (
    'Alpha Real Estate Group', 'Alpha REG', 'spółdzielnia', '3344556677', '334455667', 'Gdańsk',
    '+48 58 111 22 33', 'kontakt@alpha-reg.pl', 'www.alpha-reg.pl', 'ul. Długi Targ 32, 80-828 Gdańsk',
    'Pełny zakres zarządzania nieruchomościami mieszkalnymi i komercyjnymi na Pomorzu. Doświadczenie, rzetelność, indywidualne podejście.',
    2005, '20-75', '/api/placeholder/150/150', '/api/placeholder/800/300', true, 'verified', 'pro', NOW(),
    '{ "years_active": 19, "published_jobs": 734, "completed_projects": 698, "active_contractors": 52, "budget_range": {"min": 30000, "max": 800000} }'::jsonb,
    '{ "average_response_time": "5 godzin", "payment_punctuality": 93, "project_completion_rate": 90, "contractor_retention_rate": 86, "average_project_duration": "3-7 tygodni" }'::jsonb,
    '{ "organization_type": "zarządca", "buildings_count": 34, "units_count": 1823, "total_area": 145840, "managed_property_types": ["Mieszkania", "Apartamenty", "Biura", "Lokale handlowe"], "construction_years": {"min": 1970, "max": 2022}, "average_unit_size": 80, "primary_needs": ["Kompleksowa obsługa", "Finanse wspólnot", "Nadzór techniczny", "Serwis BHP"], "frequent_services": ["Remonty generalne", "Termomodernizacja", "Zarządzanie odpadami", "Ochrona"], "special_requirements": ["Doświadczenie lokalne", "Referencje z pomorza", "Dostępność awaryjna"], "payment_terms": ["Przelew 28 dni", "Faktura kwartalna"], "average_project_budget": "95,000 zł", "required_certificates": ["Ubezpieczenie OC", "Wpis do rejestru"], "insurance_requirements": "OC minimum 2,000,000 zł", "preferred_payment_methods": ["Przelew bankowy", "Faktura VAT"], "working_hours": "Pon-Pt 8:00-17:00, dyżury 24/7", "special_requests": ["Szybka reakcja awaryjna", "Lokalne kontakty", "Komunikacja w j. kaszubskim mile widziana"], "preferred_contractor_size": ["Średnie firmy", "Duże firmy lokalne"], "work_schedule_preference": "Elastyczny regionalny", "communication_style": "Bezpośrednia lokalna", "budget_flexibility": "Standardowa" }'::jsonb
);
