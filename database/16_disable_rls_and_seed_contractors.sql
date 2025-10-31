-- =============================================
-- DISABLE RLS AND SEED CONTRACTORS
-- =============================================
-- This script disables RLS policies temporarily and seeds contractor data
-- Run this in the Supabase SQL Editor

-- Step 1: Disable RLS policies temporarily
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects DISABLE ROW LEVEL SECURITY;

-- Step 2: Ensure we have job categories
INSERT INTO job_categories (id, name, slug, description, icon, sort_order, is_active) VALUES
    (uuid_generate_v4(), 'Remonty mieszkań', 'remonty-mieszkan', 'Kompleksowe remonty mieszkań i lokali', 'home', 1, true),
    (uuid_generate_v4(), 'Instalacje wodno-kanalizacyjne', 'instalacje-hydrauliczne', 'Instalacje wodne, kanalizacyjne i grzewcze', 'droplet', 2, true),
    (uuid_generate_v4(), 'Instalacje elektryczne', 'instalacje-elektryczne', 'Instalacje elektryczne i automatyka', 'zap', 3, true),
    (uuid_generate_v4(), 'Malowanie i dekoracje', 'malowanie-dekoracje', 'Malowanie ścian i dekoracje artystyczne', 'palette', 4, true),
    (uuid_generate_v4(), 'Roboty budowlane', 'roboty-budowlane', 'Konstrukcje, termomodernizacja, elewacje', 'building', 5, true),
    (uuid_generate_v4(), 'Instalacje OZE', 'instalacje-oze', 'Fotowoltaika, pompy ciepła, kolektory', 'sun', 6, true),
    (uuid_generate_v4(), 'Automatyka budynkowa', 'automatyka-budynkowa', 'Smart home, systemy KNX, monitoring', 'cpu', 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Insert contractor companies
INSERT INTO companies (
    id, name, short_name, type, nip, regon, krs, address, city, postal_code, 
    phone, email, website, description, logo_url, founded_year, employee_count, 
    is_verified, verification_level, avatar_url, cover_image_url, plan_type,
    profile_data, experience_data, insurance_data, stats_data
) VALUES 
-- 1. Warszawa - Remonty (Pro)
(uuid_generate_v4(), 'RenoBud - Kompleksowe Remonty', 'RenoBud', 'contractor', '1234567890', '123456789', '0000123456', 
 'ul. Puławska 123, 02-595 Warszawa', 'Warszawa', '02-595', '+48 123 456 789', 'm.kowalski@renobud.com', 'www.renobud.com',
 'Kompleksowe remonty mieszkań premium z najwyższej jakości materiałami. Specjalizujemy się w mieszkaniach zabytkowych i luksusowych.',
 '/api/placeholder/150/150', 2015, '11-20', true, 'verified', '/api/placeholder/150/150', '/api/placeholder/800/300', 'pro',
 '{"primary_services": ["Remonty mieszkań", "Remonty łazienek", "Remonty kuchni"], "specializations": ["Mieszkania zabytkowe", "Remonty premium", "Aranżacja wnętrz"], "service_area": ["Warszawa", "Piaseczno", "Konstancin-Jeziorna"], "working_hours": "Pon-Pt 8:00-17:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "120", "hourly_rate_max": "180", "price_range": "120-180 zł/h"}',
 '{"years_in_business": 9, "completed_projects": 342, "project_types": {"Remonty mieszkań": 156, "Remonty łazienek": 89, "Remonty kuchni": 67, "Malowanie": 30}, "certifications": ["Certyfikat budowlany", "Kwalifikacje elektryczne", "Kurs BHP"]}',
 '{"has_oc": true, "has_ac": true, "oc_amount": "1,000,000 zł", "ac_amount": "500,000 zł", "valid_until": "2024-12-31"}',
 '{"response_time": "2 godziny", "on_time_completion": 96, "budget_accuracy": 94, "rehire_rate": 89}'),

-- 2. Warszawa - Instalacje (Basic)
(uuid_generate_v4(), 'HydroMaster Instalacje', 'HydroMaster', 'contractor', '2345678901', '234567890', '0000234567',
 'ul. Andersa 45, 31-983 Warszawa', 'Warszawa', '31-983', '+48 987 654 321', 'kontakt@hydromaster.pl', 'www.hydromaster-warszawa.pl',
 'Specjalistyczne instalacje hydrauliczne i gazowe. Szybka reakcja na awarie, profesjonalne wykonanie.',
 '/api/placeholder/150/150', 2018, '5-10', true, 'verified', '/api/placeholder/150/150', null, 'basic',
 '{"primary_services": ["Instalacje wodno-kanalizacyjne", "Instalacje grzewcze", "Instalacje gazowe"], "specializations": ["Instalacje podłogowe", "Pompy ciepła", "Kolektory słoneczne"], "service_area": ["Warszawa", "Pruszków", "Piaseczno"], "working_hours": "Pon-Sob 7:00-19:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "80", "hourly_rate_max": "120", "price_range": "80-120 zł/h"}',
 '{"years_in_business": 6, "completed_projects": 198, "project_types": {"Instalacje wodno-kanalizacyjne": 89, "Instalacje grzewcze": 67, "Awarie hydrauliczne": 42}, "certifications": ["Uprawnienia gazowe G1", "Certyfikat spawacza", "Kurs instalacji solarnych"]}',
 '{"has_oc": true, "has_ac": false, "oc_amount": "500,000 zł", "ac_amount": "", "valid_until": "2024-08-15"}',
 '{"response_time": "1 godzina", "on_time_completion": 92, "budget_accuracy": 96, "rehire_rate": 85}'),

-- 3. Warszawa - Elektryka (Pro)
(uuid_generate_v4(), 'ElektroProfi Warszawa', 'ElektroProfi', 'contractor', '3456789012', '345678901', '0000345678',
 'ul. Elektryczna 3, 00-001 Warszawa', 'Warszawa', '00-001', '+48 555 123 789', 'biuro@elektroprofi-warszawa.com', 'www.elektroprofi-warszawa.com',
 'Nowoczesne instalacje elektryczne i automatyka budynkowa. Partner Schneider Electric.',
 '/api/placeholder/150/150', 2012, '15-25', true, 'verified', '/api/placeholder/150/150', '/api/placeholder/800/300', 'pro',
 '{"primary_services": ["Instalacje elektryczne", "Automatyka budynkowa", "Systemy alarmowe"], "specializations": ["Smart Home", "Systemy KNX", "Instalacje przemysłowe"], "service_area": ["Warszawa", "Otwock", "Legionowo"], "working_hours": "Pon-Pt 8:00-16:00", "availability_status": "ograniczona_dostępność", "next_available": "2024-03-01", "hourly_rate_min": "100", "hourly_rate_max": "150", "price_range": "100-150 zł/h"}',
 '{"years_in_business": 12, "completed_projects": 267, "project_types": {"Instalacje elektryczne": 134, "Automatyka budynkowa": 78, "Systemy alarmowe": 55}, "certifications": ["Uprawnienia elektryczne do 1kV", "Certyfikat SEP", "Kurs KNX", "Szkolenie Schneider"]}',
 '{"has_oc": true, "has_ac": true, "oc_amount": "2,000,000 zł", "ac_amount": "1,000,000 zł", "valid_until": "2024-10-30"}',
 '{"response_time": "4 godziny", "on_time_completion": 94, "budget_accuracy": 91, "rehire_rate": 92}'),

-- 4. Warszawa - Malowanie (Basic)
(uuid_generate_v4(), 'ArtMal Warszawa', 'ArtMal', 'contractor', '4567890123', '456789012', null,
 'ul. Oławska 23, 00-123 Warszawa', 'Warszawa', '00-123', '+48 666 789 123', 'agnieszka@artmal-warszawa.pl', 'www.artmal-warszawa.pl',
 'Malowanie artystyczne i dekoracje ścienne. Specjalizujemy się w freskach i technikach dekoracyjnych.',
 '/api/placeholder/150/150', 2020, '1-3', true, 'verified', '/api/placeholder/150/150', null, 'basic',
 '{"primary_services": ["Malowanie ścian", "Dekoracje ścienne", "Tynki ozdobne"], "specializations": ["Freski", "Techniki dekoracyjne", "Malatura zabytkowa"], "service_area": ["Warszawa", "Okolice Warszawy (30km)"], "working_hours": "Elastyczne godziny pracy", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "60", "hourly_rate_max": "120", "price_range": "60-120 zł/h"}',
 '{"years_in_business": 4, "completed_projects": 89, "project_types": {"Malowanie mieszkań": 34, "Dekoracje ścienne": 28, "Malowidła artystyczne": 27}, "certifications": ["Dyplom ASP Warszawa", "Kurs tynków dekoracyjnych", "Certyfikat eco-farb"]}',
 '{"has_oc": true, "has_ac": false, "oc_amount": "300,000 zł", "ac_amount": "", "valid_until": "2024-06-20"}',
 '{"response_time": "6 godzin", "on_time_completion": 98, "budget_accuracy": 95, "rehire_rate": 87}'),

-- 5. Kraków - Remonty (Pro)
(uuid_generate_v4(), 'KrakRemont Sp. z o.o.', 'KrakRemont', 'contractor', '5678901234', '567890123', '0000567890',
 'ul. Długa 12, 31-001 Kraków', 'Kraków', '31-001', '+48 12 345 67 89', 'kontakt@krakremont.pl', 'www.krakremont.pl',
 'Kompleksowe remonty mieszkań w Krakowie. Wysokiej jakości materiały i profesjonalne wykonanie.',
 '/api/placeholder/150/150', 2015, '10-20', true, 'verified', '/api/placeholder/150/150', '/api/placeholder/800/300', 'pro',
 '{"primary_services": ["Remonty mieszkań", "Remonty łazienek", "Remonty kuchni"], "specializations": ["Mieszkania zabytkowe", "Remonty premium", "Aranżacja wnętrz"], "service_area": ["Kraków", "Wieliczka", "Skawina"], "working_hours": "Pon-Pt 8:00-17:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "100", "hourly_rate_max": "160", "price_range": "100-160 zł/h"}',
 '{"years_in_business": 9, "completed_projects": 298, "project_types": {"Remonty mieszkań": 145, "Remonty łazienek": 78, "Remonty kuchni": 55, "Malowanie": 20}, "certifications": ["Certyfikat budowlany", "Kwalifikacje elektryczne", "Kurs BHP"]}',
 '{"has_oc": true, "has_ac": true, "oc_amount": "1,500,000 zł", "ac_amount": "750,000 zł", "valid_until": "2024-11-30"}',
 '{"response_time": "3 godziny", "on_time_completion": 94, "budget_accuracy": 92, "rehire_rate": 88}')
ON CONFLICT (nip) DO NOTHING;

-- Step 4: Insert company ratings for contractors
INSERT INTO company_ratings (company_id, average_rating, total_reviews, rating_breakdown, category_ratings, last_review_date)
SELECT 
    c.id,
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN 4.9
        WHEN c.name LIKE '%HydroMaster%' THEN 4.7
        WHEN c.name LIKE '%ElektroProfi%' THEN 4.8
        WHEN c.name LIKE '%ArtMal%' THEN 4.9
        WHEN c.name LIKE '%KrakRemont%' THEN 4.6
        ELSE 4.6
    END,
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN 127
        WHEN c.name LIKE '%HydroMaster%' THEN 73
        WHEN c.name LIKE '%ElektroProfi%' THEN 94
        WHEN c.name LIKE '%ArtMal%' THEN 56
        WHEN c.name LIKE '%KrakRemont%' THEN 89
        ELSE 50
    END,
    '{"5": 60, "4": 30, "3": 8, "2": 1, "1": 1}'::jsonb,
    '{"quality": 4.7, "timeliness": 4.6, "communication": 4.8, "pricing": 4.5}'::jsonb,
    NOW() - INTERVAL '1 day' * (RANDOM() * 30)
FROM companies c
WHERE c.type = 'contractor' AND c.is_verified = true
ON CONFLICT (company_id) DO NOTHING;

-- Step 5: Insert sample reviews for contractors
INSERT INTO company_reviews (company_id, reviewer_id, rating, title, comment, categories, is_public, is_verified)
SELECT 
    c.id,
    (SELECT id FROM user_profiles WHERE user_type = 'manager' LIMIT 1),
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN 5
        WHEN c.name LIKE '%HydroMaster%' THEN 5
        WHEN c.name LIKE '%ElektroProfi%' THEN 5
        WHEN c.name LIKE '%ArtMal%' THEN 5
        WHEN c.name LIKE '%KrakRemont%' THEN 4
        ELSE 4
    END,
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN 'Profesjonalne wykonanie remontu'
        WHEN c.name LIKE '%HydroMaster%' THEN 'Szybka reakcja na awarię'
        WHEN c.name LIKE '%ElektroProfi%' THEN 'Nowoczesne rozwiązania elektryczne'
        WHEN c.name LIKE '%ArtMal%' THEN 'Niesamowita precyzja artystyczna'
        WHEN c.name LIKE '%KrakRemont%' THEN 'Solidne wykonanie remontu'
        ELSE 'Profesjonalne wykonanie'
    END,
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN 'Profesjonalne podejście, terminowość i bardzo wysoka jakość wykonania. Polecam!'
        WHEN c.name LIKE '%HydroMaster%' THEN 'Szybka reakcja na awarię, profesjonalne wykonanie naprawy. Bardzo polecamy!'
        WHEN c.name LIKE '%ElektroProfi%' THEN 'Fantastyczna robota! System LED oszczędza nam 70% kosztów energii. Profesjonalny zespół.'
        WHEN c.name LIKE '%ArtMal%' THEN 'Niesamowita precyzja i artystyczne podejście. Klatka wygląda jak dzieło sztuki!'
        WHEN c.name LIKE '%KrakRemont%' THEN 'Solidne wykonanie, dotrzymane terminy. Oszczędności energii ponad oczekiwania!'
        ELSE 'Profesjonalne wykonanie, polecamy!'
    END,
    '{"quality": 4.8, "timeliness": 4.7, "communication": 4.9, "pricing": 4.6}'::jsonb,
    true,
    true
FROM companies c
WHERE c.type = 'contractor' AND c.is_verified = true
ON CONFLICT (company_id, reviewer_id) DO NOTHING;

-- Step 6: Insert certificates for contractors
INSERT INTO certificates (company_id, name, type, number, issuer, issue_date, expiry_date, description, is_verified)
SELECT 
    c.id,
    CASE 
        WHEN c.name LIKE '%RenoBud%' OR c.name LIKE '%KrakRemont%' THEN 'Certyfikat budowlany'
        WHEN c.name LIKE '%HydroMaster%' THEN 'Uprawnienia gazowe G1'
        WHEN c.name LIKE '%ElektroProfi%' THEN 'Uprawnienia elektryczne do 1kV'
        WHEN c.name LIKE '%ArtMal%' THEN 'Dyplom ASP'
        ELSE 'Certyfikat zawodowy'
    END,
    'certification',
    'CERT-' || LPAD((RANDOM() * 9999)::integer::text, 4, '0'),
    CASE 
        WHEN c.name LIKE '%RenoBud%' OR c.name LIKE '%KrakRemont%' THEN 'Urząd Budowlany'
        WHEN c.name LIKE '%HydroMaster%' THEN 'Urząd Dozoru Technicznego'
        WHEN c.name LIKE '%ElektroProfi%' THEN 'Stowarzyszenie Elektryków Polskich'
        WHEN c.name LIKE '%ArtMal%' THEN 'Akademia Sztuk Pięknych'
        ELSE 'Instytucja Certyfikująca'
    END,
    CURRENT_DATE - INTERVAL '1 year' * (RANDOM() * 3),
    CURRENT_DATE + INTERVAL '1 year' * (RANDOM() * 2),
    'Certyfikat potwierdzający kwalifikacje zawodowe',
    true
FROM companies c
WHERE c.type = 'contractor' AND c.is_verified = true
ON CONFLICT (company_id, name) DO NOTHING;

-- Step 7: Insert portfolio projects for contractors
INSERT INTO portfolio_projects (company_id, title, description, category_id, location, project_type, budget_range, duration, completion_date, client_name, client_feedback, is_featured)
SELECT 
    c.id,
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN 'Kompleksowy remont mieszkania 85m²'
        WHEN c.name LIKE '%HydroMaster%' THEN 'Instalacja c.o. w budynku 4-piętrowym'
        WHEN c.name LIKE '%ElektroProfi%' THEN 'System Smart Home w rezydencji'
        WHEN c.name LIKE '%ArtMal%' THEN 'Fresk w restauracji "Pod Gryfem"'
        WHEN c.name LIKE '%KrakRemont%' THEN 'Remont mieszkania 120m² w Krakowie'
        ELSE 'Projekt referencyjny'
    END,
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN 'Pełny remont mieszkania w kamienicy z lat 20-tych, zachowanie zabytkowego charakteru'
        WHEN c.name LIKE '%HydroMaster%' THEN 'Kompleksowa wymiana instalacji grzewczej wraz z montażem pompy ciepła'
        WHEN c.name LIKE '%ElektroProfi%' THEN 'Kompleksowa automatyka budynkowa KNX z integracją oświetlenia, klimatyzacji i bezpieczeństwa'
        WHEN c.name LIKE '%ArtMal%' THEN 'Malowanie artystyczne ścian w stylu śródziemnomorskim'
        WHEN c.name LIKE '%KrakRemont%' THEN 'Kompleksowy remont luksusowego mieszkania z najwyższej jakości materiałami'
        ELSE 'Projekt referencyjny wykonany przez naszą firmę'
    END,
    (SELECT id FROM job_categories WHERE slug = 'remonty-mieszkan' LIMIT 1),
    c.city,
    'residential',
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN '150,000 - 200,000 zł'
        WHEN c.name LIKE '%HydroMaster%' THEN '85,000 - 120,000 zł'
        WHEN c.name LIKE '%ElektroProfi%' THEN '120,000 - 180,000 zł'
        WHEN c.name LIKE '%ArtMal%' THEN '25,000 - 35,000 zł'
        WHEN c.name LIKE '%KrakRemont%' THEN '180,000 - 220,000 zł'
        ELSE 'Wycena indywidualna'
    END,
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN '3 miesiące'
        WHEN c.name LIKE '%HydroMaster%' THEN '2 miesiące'
        WHEN c.name LIKE '%ElektroProfi%' THEN '4 miesiące'
        WHEN c.name LIKE '%ArtMal%' THEN '3 tygodnie'
        WHEN c.name LIKE '%KrakRemont%' THEN '3 miesiące'
        ELSE '2 miesiące'
    END,
    CURRENT_DATE - INTERVAL '1 month' * (RANDOM() * 12),
    CASE 
        WHEN c.name LIKE '%RenoBud%' THEN 'Właściciel mieszkania'
        WHEN c.name LIKE '%HydroMaster%' THEN 'Wspólnota mieszkaniowa'
        WHEN c.name LIKE '%ElektroProfi%' THEN 'Właściciel domu'
        WHEN c.name LIKE '%ArtMal%' THEN 'Właściciel restauracji'
        WHEN c.name LIKE '%KrakRemont%' THEN 'Właściciel mieszkania'
        ELSE 'Klient'
    END,
    'Doskonała jakość wykonania, terminowość i profesjonalizm. Polecam!',
    true
FROM companies c
WHERE c.type = 'contractor' AND c.is_verified = true
ON CONFLICT (company_id, title) DO NOTHING;

-- Step 8: Re-enable RLS policies (optional - you can skip this if you want to keep RLS disabled)
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_ratings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Step 9: Verify the data
SELECT 
    c.name,
    c.city,
    c.is_verified,
    cr.average_rating,
    cr.total_reviews
FROM companies c
LEFT JOIN company_ratings cr ON c.id = cr.company_id
WHERE c.type = 'contractor'
ORDER BY c.name;
