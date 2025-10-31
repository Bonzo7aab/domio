-- =============================================
-- SEED CONTRACTOR PROFILES (SAFE VERSION)
-- =============================================
-- Seeds 15 diverse contractor profiles with complete data
-- This version safely handles existing data with ON CONFLICT clauses

-- First, ensure we have job categories for contractors
INSERT INTO job_categories (id, name, slug, description, icon, sort_order, is_active) VALUES
    (uuid_generate_v4(), 'Remonty mieszkań', 'remonty-mieszkan', 'Kompleksowe remonty mieszkań i lokali', 'home', 1, true),
    (uuid_generate_v4(), 'Instalacje wodno-kanalizacyjne', 'instalacje-hydrauliczne', 'Instalacje wodne, kanalizacyjne i grzewcze', 'droplet', 2, true),
    (uuid_generate_v4(), 'Instalacje elektryczne', 'instalacje-elektryczne', 'Instalacje elektryczne i automatyka', 'zap', 3, true),
    (uuid_generate_v4(), 'Malowanie i dekoracje', 'malowanie-dekoracje', 'Malowanie ścian i dekoracje artystyczne', 'palette', 4, true),
    (uuid_generate_v4(), 'Roboty budowlane', 'roboty-budowlane', 'Konstrukcje, termomodernizacja, elewacje', 'building', 5, true),
    (uuid_generate_v4(), 'Instalacje OZE', 'instalacje-oze', 'Fotowoltaika, pompy ciepła, kolektory', 'sun', 6, true),
    (uuid_generate_v4(), 'Automatyka budynkowa', 'automatyka-budynkowa', 'Smart home, systemy KNX, monitoring', 'cpu', 7, true)
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs for reference
DO $$
DECLARE
    remonty_category_id UUID;
    hydraulika_category_id UUID;
    elektryka_category_id UUID;
    malowanie_category_id UUID;
    budowlane_category_id UUID;
    oze_category_id UUID;
    automatyka_category_id UUID;
BEGIN
    SELECT id INTO remonty_category_id FROM job_categories WHERE slug = 'remonty-mieszkan';
    SELECT id INTO hydraulika_category_id FROM job_categories WHERE slug = 'instalacje-hydrauliczne';
    SELECT id INTO elektryka_category_id FROM job_categories WHERE slug = 'instalacje-elektryczne';
    SELECT id INTO malowanie_category_id FROM job_categories WHERE slug = 'malowanie-dekoracje';
    SELECT id INTO budowlane_category_id FROM job_categories WHERE slug = 'roboty-budowlane';
    SELECT id INTO oze_category_id FROM job_categories WHERE slug = 'instalacje-oze';
    SELECT id INTO automatyka_category_id FROM job_categories WHERE slug = 'automatyka-budynkowa';

    -- Insert 15 contractor companies (with conflict handling)
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
     '{"response_time": "3 godziny", "on_time_completion": 94, "budget_accuracy": 92, "rehire_rate": 88}'),

    -- 6. Kraków - Instalacje (Basic)
    (uuid_generate_v4(), 'KrakHydro Instalacje', 'KrakHydro', 'contractor', '6789012345', '678901234', null,
     'ul. Techniczna 5, 31-001 Kraków', 'Kraków', '31-001', '+48 12 567 89 01', 'biuro@krakhydro.pl', 'www.krakhydro.pl',
     'Instalacje hydrauliczne i grzewcze w Krakowie. Szybka reakcja na awarie.',
     '/api/placeholder/150/150', 2018, '3-8', true, 'verified', '/api/placeholder/150/150', null, 'basic',
     '{"primary_services": ["Instalacje wodno-kanalizacyjne", "Instalacje grzewcze", "Awarie hydrauliczne"], "specializations": ["Instalacje podłogowe", "Pompy ciepła", "Kolektory słoneczne"], "service_area": ["Kraków", "Wieliczka", "Skawina", "Niepołomice"], "working_hours": "Pon-Sob 7:00-19:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "70", "hourly_rate_max": "110", "price_range": "70-110 zł/h"}',
     '{"years_in_business": 6, "completed_projects": 156, "project_types": {"Instalacje wodno-kanalizacyjne": 78, "Instalacje grzewcze": 45, "Awarie hydrauliczne": 33}, "certifications": ["Uprawnienia gazowe G1", "Certyfikat spawacza", "Kurs instalacji solarnych"]}',
     '{"has_oc": true, "has_ac": false, "oc_amount": "400,000 zł", "ac_amount": "", "valid_until": "2024-07-20"}',
     '{"response_time": "2 godziny", "on_time_completion": 90, "budget_accuracy": 94, "rehire_rate": 82}'),

    -- 7. Kraków - Elektryka (Pro)
    (uuid_generate_v4(), 'KrakElektro Sp. z o.o.', 'KrakElektro', 'contractor', '7890123456', '789012345', '0000789012',
     'ul. Elektryczna 3, 31-001 Kraków', 'Kraków', '31-001', '+48 12 678 90 12', 'info@krakelektro.pl', 'www.krakelektro.pl',
     'Instalacje elektryczne i automatyka budynkowa w Krakowie. Nowoczesne rozwiązania Smart Home.',
     '/api/placeholder/150/150', 2010, '12-18', true, 'verified', '/api/placeholder/150/150', '/api/placeholder/800/300', 'pro',
     '{"primary_services": ["Instalacje elektryczne", "Automatyka budynkowa", "Systemy alarmowe"], "specializations": ["Smart Home", "Systemy KNX", "Instalacje przemysłowe"], "service_area": ["Kraków", "Skała", "Miechów"], "working_hours": "Pon-Pt 8:00-16:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "90", "hourly_rate_max": "140", "price_range": "90-140 zł/h"}',
     '{"years_in_business": 14, "completed_projects": 234, "project_types": {"Instalacje elektryczne": 120, "Automatyka budynkowa": 68, "Systemy alarmowe": 46}, "certifications": ["Uprawnienia elektryczne do 1kV", "Certyfikat SEP", "Kurs KNX", "Szkolenie Schneider"]}',
     '{"has_oc": true, "has_ac": true, "oc_amount": "1,800,000 zł", "ac_amount": "900,000 zł", "valid_until": "2024-09-15"}',
     '{"response_time": "5 godzin", "on_time_completion": 93, "budget_accuracy": 89, "rehire_rate": 90}'),

    -- 8. Gdańsk - Remonty (Basic)
    (uuid_generate_v4(), 'GdańskRemont', 'GdańskRemont', 'contractor', '8901234567', '890123456', null,
     'ul. Długa 12, 80-827 Gdańsk', 'Gdańsk', '80-827', '+48 58 123 45 67', 'kontakt@gdanskremont.pl', 'www.gdanskremont.pl',
     'Remonty mieszkań w Gdańsku. Jakość i terminowość to nasze priorytety.',
     '/api/placeholder/150/150', 2017, '5-12', true, 'verified', '/api/placeholder/150/150', null, 'basic',
     '{"primary_services": ["Remonty mieszkań", "Remonty łazienek", "Malowanie"], "specializations": ["Mieszkania zabytkowe", "Remonty premium", "Aranżacja wnętrz"], "service_area": ["Gdańsk", "Sopot", "Gdynia"], "working_hours": "Pon-Pt 8:00-17:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "85", "hourly_rate_max": "135", "price_range": "85-135 zł/h"}',
     '{"years_in_business": 7, "completed_projects": 187, "project_types": {"Remonty mieszkań": 89, "Remonty łazienek": 56, "Malowanie": 42}, "certifications": ["Certyfikat budowlany", "Kwalifikacje elektryczne", "Kurs BHP"]}',
     '{"has_oc": true, "has_ac": false, "oc_amount": "600,000 zł", "ac_amount": "", "valid_until": "2024-05-10"}',
     '{"response_time": "4 godziny", "on_time_completion": 91, "budget_accuracy": 93, "rehire_rate": 84}'),

    -- 9. Gdańsk - OZE (Pro)
    (uuid_generate_v4(), 'SolarTech Gdańsk', 'SolarTech', 'contractor', '9012345678', '901234567', '0000901234',
     'ul. Nadbystrzycka 67, 80-618 Gdańsk', 'Gdańsk', '80-618', '+48 58 234 56 78', 'l.witkowski@solartech-gdansk.pl', 'www.solartech-gdansk.pl',
     'Instalacje fotowoltaiczne i pompy ciepła w Gdańsku. Partner Fronius.',
     '/api/placeholder/150/150', 2019, '6-12', true, 'verified', '/api/placeholder/150/150', '/api/placeholder/800/300', 'pro',
     '{"primary_services": ["Instalacje fotowoltaiczne", "Pompy ciepła", "Magazyny energii"], "specializations": ["Mikroinstalacje PV", "Systemy hybrydowe", "Farmy słoneczne"], "service_area": ["Gdańsk", "Sopot", "Gdynia", "Pruszcz Gdański"], "working_hours": "Pon-Pt 8:00-17:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "0", "hourly_rate_max": "0", "price_range": "Wycena indywidualna"}',
     '{"years_in_business": 5, "completed_projects": 127, "project_types": {"Instalacje fotowoltaiczne": 89, "Pompy ciepła": 23, "Kolektory słoneczne": 15}, "certifications": ["Certyfikat instalatora PV", "Szkolenie Fronius", "Kurs pomp ciepła"]}',
     '{"has_oc": true, "has_ac": true, "oc_amount": "1,500,000 zł", "ac_amount": "500,000 zł", "valid_until": "2024-09-15"}',
     '{"response_time": "8 godzin", "on_time_completion": 95, "budget_accuracy": 93, "rehire_rate": 91}'),

    -- 10. Wrocław - Malowanie (Basic)
    (uuid_generate_v4(), 'ArtMal Wrocław', 'ArtMal Wrocław', 'contractor', '0123456789', '012345678', null,
     'ul. Oławska 23, 50-123 Wrocław', 'Wrocław', '50-123', '+48 71 123 45 67', 'agnieszka@artmal-wroclaw.pl', 'www.artmal-wroclaw.pl',
     'Malowanie artystyczne i dekoracje ścienne we Wrocławiu. Specjalizujemy się w freskach.',
     '/api/placeholder/150/150', 2020, '1-3', true, 'verified', '/api/placeholder/150/150', null, 'basic',
     '{"primary_services": ["Malowanie ścian", "Dekoracje ścienne", "Tynki ozdobne"], "specializations": ["Freski", "Techniki dekoracyjne", "Malatura zabytkowa"], "service_area": ["Wrocław", "Okolice Wrocławia (30km)"], "working_hours": "Elastyczne godziny pracy", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "60", "hourly_rate_max": "120", "price_range": "60-120 zł/h"}',
     '{"years_in_business": 4, "completed_projects": 89, "project_types": {"Malowanie mieszkań": 34, "Dekoracje ścienne": 28, "Malowidła artystyczne": 27}, "certifications": ["Dyplom ASP Wrocław", "Kurs tynków dekoracyjnych", "Certyfikat eco-farb"]}',
     '{"has_oc": true, "has_ac": false, "oc_amount": "300,000 zł", "ac_amount": "", "valid_until": "2024-06-20"}',
     '{"response_time": "6 godzin", "on_time_completion": 98, "budget_accuracy": 95, "rehire_rate": 87}'),

    -- 11. Wrocław - Budowlane (Pro)
    (uuid_generate_v4(), 'MegaBud Wrocław Sp. z o.o.', 'MegaBud Wrocław', 'contractor', '1234509876', '123450987', '0000123450',
     'ul. Grunwaldzka 189, 50-322 Wrocław', 'Wrocław', '50-322', '+48 71 234 56 78', 'kontakt@megabud-wroclaw.com', 'www.megabud-wroclaw.com',
     'Roboty budowlane i termomodernizacja we Wrocławiu. Duża firma z certyfikatami ISO.',
     '/api/placeholder/150/150', 2010, '21-50', true, 'verified', '/api/placeholder/150/150', '/api/placeholder/800/300', 'pro',
     '{"primary_services": ["Roboty budowlane", "Konstrukcje żelbetowe", "Termomodernizacja"], "specializations": ["Budynki przemysłowe", "Obiekty użyteczności publicznej", "Domy pasywne"], "service_area": ["Wrocław", "Dolny Śląsk", "Cała Polska (duże projekty)"], "working_hours": "Pon-Pt 7:00-17:00", "availability_status": "dostępny", "next_available": "2024-02-15", "hourly_rate_min": "0", "hourly_rate_max": "0", "price_range": "Wycena indywidualna"}',
     '{"years_in_business": 14, "completed_projects": 423, "project_types": {"Termomodernizacja": 156, "Remonty dachów": 134, "Konstrukcje żelbetowe": 89, "Elewacje": 44}, "certifications": ["Uprawnienia budowlane bez ograniczeń", "ISO 9001", "ISO 14001", "Certyfikat GOLD"]}',
     '{"has_oc": true, "has_ac": true, "oc_amount": "5,000,000 zł", "ac_amount": "2,000,000 zł", "valid_until": "2024-12-31"}',
     '{"response_time": "12 godzin", "on_time_completion": 88, "budget_accuracy": 92, "rehire_rate": 76}'),

    -- 12. Poznań - Instalacje (Basic)
    (uuid_generate_v4(), 'PoznańHydro Instalacje', 'PoznańHydro', 'contractor', '2345678901', '234567890', null,
     'ul. Techniczna 5, 60-001 Poznań', 'Poznań', '60-001', '+48 61 123 45 67', 'biuro@poznanhydro.pl', 'www.poznanhydro.pl',
     'Instalacje hydrauliczne i grzewcze w Poznaniu. Szybka reakcja na awarie.',
     '/api/placeholder/150/150', 2018, '4-8', true, 'verified', '/api/placeholder/150/150', null, 'basic',
     '{"primary_services": ["Instalacje wodno-kanalizacyjne", "Instalacje grzewcze", "Awarie hydrauliczne"], "specializations": ["Instalacje podłogowe", "Pompy ciepła", "Kolektory słoneczne"], "service_area": ["Poznań", "Swarzędz", "Kórnik"], "working_hours": "Pon-Sob 7:00-19:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "75", "hourly_rate_max": "115", "price_range": "75-115 zł/h"}',
     '{"years_in_business": 6, "completed_projects": 142, "project_types": {"Instalacje wodno-kanalizacyjne": 67, "Instalacje grzewcze": 45, "Awarie hydrauliczne": 30}, "certifications": ["Uprawnienia gazowe G1", "Certyfikat spawacza", "Kurs instalacji solarnych"]}',
     '{"has_oc": true, "has_ac": false, "oc_amount": "450,000 zł", "ac_amount": "", "valid_until": "2024-08-25"}',
     '{"response_time": "2 godziny", "on_time_completion": 89, "budget_accuracy": 95, "rehire_rate": 83}'),

    -- 13. Poznań - Elektryka (Pro)
    (uuid_generate_v4(), 'PoznańElektro Sp. z o.o.', 'PoznańElektro', 'contractor', '3456789012', '345678901', '0000345678',
     'ul. Elektryczna 3, 60-001 Poznań', 'Poznań', '60-001', '+48 61 234 56 78', 'info@poznanelektro.pl', 'www.poznanelektro.pl',
     'Instalacje elektryczne i automatyka budynkowa w Poznaniu. Nowoczesne rozwiązania Smart Home.',
     '/api/placeholder/150/150', 2011, '10-20', true, 'verified', '/api/placeholder/150/150', '/api/placeholder/800/300', 'pro',
     '{"primary_services": ["Instalacje elektryczne", "Automatyka budynkowa", "Systemy alarmowe"], "specializations": ["Smart Home", "Systemy KNX", "Instalacje przemysłowe"], "service_area": ["Poznań", "Swarzędz", "Kórnik"], "working_hours": "Pon-Pt 8:00-16:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "95", "hourly_rate_max": "145", "price_range": "95-145 zł/h"}',
     '{"years_in_business": 13, "completed_projects": 201, "project_types": {"Instalacje elektryczne": 105, "Automatyka budynkowa": 58, "Systemy alarmowe": 38}, "certifications": ["Uprawnienia elektryczne do 1kV", "Certyfikat SEP", "Kurs KNX", "Szkolenie Schneider"]}',
     '{"has_oc": true, "has_ac": true, "oc_amount": "1,700,000 zł", "ac_amount": "850,000 zł", "valid_until": "2024-10-20"}',
     '{"response_time": "6 godzin", "on_time_completion": 92, "budget_accuracy": 88, "rehire_rate": 89}'),

    -- 14. Katowice - Remonty (Basic)
    (uuid_generate_v4(), 'KatowiceRemont', 'KatowiceRemont', 'contractor', '4567890123', '456789012', null,
     'ul. Długa 12, 40-001 Katowice', 'Katowice', '40-001', '+48 32 123 45 67', 'kontakt@katowiceremont.pl', 'www.katowiceremont.pl',
     'Remonty mieszkań w Katowicach. Jakość i terminowość to nasze priorytety.',
     '/api/placeholder/150/150', 2016, '6-15', true, 'verified', '/api/placeholder/150/150', null, 'basic',
     '{"primary_services": ["Remonty mieszkań", "Remonty łazienek", "Malowanie"], "specializations": ["Mieszkania zabytkowe", "Remonty premium", "Aranżacja wnętrz"], "service_area": ["Katowice", "Sosnowiec", "Gliwice"], "working_hours": "Pon-Pt 8:00-17:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "80", "hourly_rate_max": "130", "price_range": "80-130 zł/h"}',
     '{"years_in_business": 8, "completed_projects": 156, "project_types": {"Remonty mieszkań": 78, "Remonty łazienek": 45, "Malowanie": 33}, "certifications": ["Certyfikat budowlany", "Kwalifikacje elektryczne", "Kurs BHP"]}',
     '{"has_oc": true, "has_ac": false, "oc_amount": "700,000 zł", "ac_amount": "", "valid_until": "2024-04-15"}',
     '{"response_time": "5 godzin", "on_time_completion": 90, "budget_accuracy": 91, "rehire_rate": 81}'),

    -- 15. Lublin - OZE (Basic)
    (uuid_generate_v4(), 'SolarTech Lublin', 'SolarTech Lublin', 'contractor', '5678901234', '567890123', null,
     'ul. Nadbystrzycka 67, 20-618 Lublin', 'Lublin', '20-618', '+48 81 123 45 67', 'l.witkowski@solartech-lublin.pl', 'www.solartech-lublin.pl',
     'Instalacje fotowoltaiczne i pompy ciepła w Lublinie. Partner Fronius.',
     '/api/placeholder/150/150', 2019, '4-6', true, 'verified', '/api/placeholder/150/150', null, 'basic',
     '{"primary_services": ["Instalacje fotowoltaiczne", "Pompy ciepła", "Magazyny energii"], "specializations": ["Mikroinstalacje PV", "Systemy hybrydowe", "Farmy słoneczne"], "service_area": ["Lublin", "Lubelskie", "Podlaskie"], "working_hours": "Pon-Pt 8:00-17:00", "availability_status": "dostępny", "next_available": "", "hourly_rate_min": "0", "hourly_rate_max": "0", "price_range": "Wycena indywidualna"}',
     '{"years_in_business": 5, "completed_projects": 127, "project_types": {"Instalacje fotowoltaiczne": 89, "Pompy ciepła": 23, "Kolektory słoneczne": 15}, "certifications": ["Certyfikat instalatora PV", "Szkolenie Fronius", "Kurs pomp ciepła"]}',
     '{"has_oc": true, "has_ac": true, "oc_amount": "1,500,000 zł", "ac_amount": "500,000 zł", "valid_until": "2024-09-15"}',
     '{"response_time": "8 godzin", "on_time_completion": 95, "budget_accuracy": 93, "rehire_rate": 91}')
    ON CONFLICT (nip) DO NOTHING;

    -- Insert company ratings for contractors (with conflict handling)
    INSERT INTO company_ratings (company_id, average_rating, total_reviews, rating_breakdown, category_ratings, last_review_date)
    SELECT 
        c.id,
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN 4.9
            WHEN c.name LIKE '%HydroMaster%' THEN 4.7
            WHEN c.name LIKE '%ElektroProfi%' THEN 4.8
            WHEN c.name LIKE '%ArtMal%' THEN 4.9
            WHEN c.name LIKE '%KrakRemont%' THEN 4.6
            WHEN c.name LIKE '%KrakHydro%' THEN 4.5
            WHEN c.name LIKE '%KrakElektro%' THEN 4.7
            WHEN c.name LIKE '%GdańskRemont%' THEN 4.6
            WHEN c.name LIKE '%SolarTech%' THEN 4.8
            WHEN c.name LIKE '%MegaBud%' THEN 4.6
            WHEN c.name LIKE '%PoznańHydro%' THEN 4.5
            WHEN c.name LIKE '%PoznańElektro%' THEN 4.7
            WHEN c.name LIKE '%KatowiceRemont%' THEN 4.5
            ELSE 4.6
        END,
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN 127
            WHEN c.name LIKE '%HydroMaster%' THEN 73
            WHEN c.name LIKE '%ElektroProfi%' THEN 94
            WHEN c.name LIKE '%ArtMal%' THEN 56
            WHEN c.name LIKE '%KrakRemont%' THEN 89
            WHEN c.name LIKE '%KrakHydro%' THEN 45
            WHEN c.name LIKE '%KrakElektro%' THEN 67
            WHEN c.name LIKE '%GdańskRemont%' THEN 52
            WHEN c.name LIKE '%SolarTech%' THEN 41
            WHEN c.name LIKE '%MegaBud%' THEN 201
            WHEN c.name LIKE '%PoznańHydro%' THEN 38
            WHEN c.name LIKE '%PoznańElektro%' THEN 59
            WHEN c.name LIKE '%KatowiceRemont%' THEN 43
            ELSE 50
        END,
        '{"5": 60, "4": 30, "3": 8, "2": 1, "1": 1}'::jsonb,
        '{"quality": 4.7, "timeliness": 4.6, "communication": 4.8, "pricing": 4.5}'::jsonb,
        NOW() - INTERVAL '1 day' * (RANDOM() * 30)
    FROM companies c
    WHERE c.type = 'contractor' AND c.is_verified = true
    ON CONFLICT (company_id) DO NOTHING;

    -- Insert sample reviews for contractors (with conflict handling)
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
            WHEN c.name LIKE '%KrakHydro%' THEN 5
            WHEN c.name LIKE '%KrakElektro%' THEN 5
            WHEN c.name LIKE '%GdańskRemont%' THEN 4
            WHEN c.name LIKE '%SolarTech%' THEN 5
            WHEN c.name LIKE '%MegaBud%' THEN 5
            WHEN c.name LIKE '%PoznańHydro%' THEN 4
            WHEN c.name LIKE '%PoznańElektro%' THEN 5
            WHEN c.name LIKE '%KatowiceRemont%' THEN 4
            ELSE 4
        END,
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN 'Profesjonalne wykonanie remontu'
            WHEN c.name LIKE '%HydroMaster%' THEN 'Szybka reakcja na awarię'
            WHEN c.name LIKE '%ElektroProfi%' THEN 'Nowoczesne rozwiązania elektryczne'
            WHEN c.name LIKE '%ArtMal%' THEN 'Niesamowita precyzja artystyczna'
            WHEN c.name LIKE '%KrakRemont%' THEN 'Solidne wykonanie remontu'
            WHEN c.name LIKE '%KrakHydro%' THEN 'Profesjonalne instalacje'
            WHEN c.name LIKE '%KrakElektro%' THEN 'Doskonała automatyka budynkowa'
            WHEN c.name LIKE '%GdańskRemont%' THEN 'Jakość i terminowość'
            WHEN c.name LIKE '%SolarTech%' THEN 'Świetne instalacje fotowoltaiczne'
            WHEN c.name LIKE '%MegaBud%' THEN 'Profesjonalna termomodernizacja'
            WHEN c.name LIKE '%PoznańHydro%' THEN 'Szybka naprawa instalacji'
            WHEN c.name LIKE '%PoznańElektro%' THEN 'Nowoczesne rozwiązania Smart Home'
            WHEN c.name LIKE '%KatowiceRemont%' THEN 'Solidny remont mieszkania'
            ELSE 'Profesjonalne wykonanie'
        END,
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN 'Profesjonalne podejście, terminowość i bardzo wysoka jakość wykonania. Polecam!'
            WHEN c.name LIKE '%HydroMaster%' THEN 'Szybka reakcja na awarię, profesjonalne wykonanie naprawy. Bardzo polecamy!'
            WHEN c.name LIKE '%ElektroProfi%' THEN 'Fantastyczna robota! System LED oszczędza nam 70% kosztów energii. Profesjonalny zespół.'
            WHEN c.name LIKE '%ArtMal%' THEN 'Niesamowita precyzja i artystyczne podejście. Klatka wygląda jak dzieło sztuki!'
            WHEN c.name LIKE '%KrakRemont%' THEN 'Solidne wykonanie, dotrzymane terminy. Oszczędności energii ponad oczekiwania!'
            WHEN c.name LIKE '%KrakHydro%' THEN 'Szybka naprawa instalacji, profesjonalne podejście. Polecamy!'
            WHEN c.name LIKE '%KrakElektro%' THEN 'Doskonała automatyka budynkowa, wszystko działa bez zarzutu.'
            WHEN c.name LIKE '%GdańskRemont%' THEN 'Jakość i terminowość to nasze priorytety. Zadowoleni z wykonania.'
            WHEN c.name LIKE '%SolarTech%' THEN 'Świetne doradztwo, profesjonalny montaż. Instalacja pracuje bez problemów!'
            WHEN c.name LIKE '%MegaBud%' THEN 'Profesjonalne wykonanie, dotrzymane terminy. Oszczędności energii ponad oczekiwania!'
            WHEN c.name LIKE '%PoznańHydro%' THEN 'Szybka naprawa instalacji, profesjonalne podejście. Polecamy!'
            WHEN c.name LIKE '%PoznańElektro%' THEN 'Nowoczesne rozwiązania Smart Home, łatwa obsługa, wszystko działa bez zarzutu.'
            WHEN c.name LIKE '%KatowiceRemont%' THEN 'Solidny remont mieszkania, terminowość i jakość na wysokim poziomie.'
            ELSE 'Profesjonalne wykonanie, polecamy!'
        END,
        '{"quality": 4.8, "timeliness": 4.7, "communication": 4.9, "pricing": 4.6}'::jsonb,
        true,
        true
    FROM companies c
    WHERE c.type = 'contractor' AND c.is_verified = true
    ON CONFLICT (company_id, reviewer_id) DO NOTHING;

    -- Insert certificates for contractors (with conflict handling)
    INSERT INTO certificates (company_id, name, type, number, issuer, issue_date, expiry_date, description, is_verified)
    SELECT 
        c.id,
        CASE 
            WHEN c.name LIKE '%RenoBud%' OR c.name LIKE '%KrakRemont%' OR c.name LIKE '%GdańskRemont%' OR c.name LIKE '%KatowiceRemont%' THEN 'Certyfikat budowlany'
            WHEN c.name LIKE '%HydroMaster%' OR c.name LIKE '%KrakHydro%' OR c.name LIKE '%PoznańHydro%' THEN 'Uprawnienia gazowe G1'
            WHEN c.name LIKE '%ElektroProfi%' OR c.name LIKE '%KrakElektro%' OR c.name LIKE '%PoznańElektro%' THEN 'Uprawnienia elektryczne do 1kV'
            WHEN c.name LIKE '%ArtMal%' THEN 'Dyplom ASP'
            WHEN c.name LIKE '%SolarTech%' THEN 'Certyfikat instalatora PV'
            WHEN c.name LIKE '%MegaBud%' THEN 'Uprawnienia budowlane bez ograniczeń'
            ELSE 'Certyfikat zawodowy'
        END,
        'certification',
        'CERT-' || LPAD((RANDOM() * 9999)::integer::text, 4, '0'),
        CASE 
            WHEN c.name LIKE '%RenoBud%' OR c.name LIKE '%KrakRemont%' OR c.name LIKE '%GdańskRemont%' OR c.name LIKE '%KatowiceRemont%' THEN 'Urząd Budowlany'
            WHEN c.name LIKE '%HydroMaster%' OR c.name LIKE '%KrakHydro%' OR c.name LIKE '%PoznańHydro%' THEN 'Urząd Dozoru Technicznego'
            WHEN c.name LIKE '%ElektroProfi%' OR c.name LIKE '%KrakElektro%' OR c.name LIKE '%PoznańElektro%' THEN 'Stowarzyszenie Elektryków Polskich'
            WHEN c.name LIKE '%ArtMal%' THEN 'Akademia Sztuk Pięknych'
            WHEN c.name LIKE '%SolarTech%' THEN 'Stowarzyszenie Branży Fotowoltaicznej'
            WHEN c.name LIKE '%MegaBud%' THEN 'Urząd Budowlany'
            ELSE 'Instytucja Certyfikująca'
        END,
        CURRENT_DATE - INTERVAL '1 year' * (RANDOM() * 3),
        CURRENT_DATE + INTERVAL '1 year' * (RANDOM() * 2),
        'Certyfikat potwierdzający kwalifikacje zawodowe',
        true
    FROM companies c
    WHERE c.type = 'contractor' AND c.is_verified = true
    ON CONFLICT (company_id, name) DO NOTHING;

    -- Insert portfolio projects for contractors (with conflict handling)
    INSERT INTO portfolio_projects (company_id, title, description, category_id, location, project_type, budget_range, duration, completion_date, client_name, client_feedback, is_featured)
    SELECT 
        c.id,
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN 'Kompleksowy remont mieszkania 85m²'
            WHEN c.name LIKE '%HydroMaster%' THEN 'Instalacja c.o. w budynku 4-piętrowym'
            WHEN c.name LIKE '%ElektroProfi%' THEN 'System Smart Home w rezydencji'
            WHEN c.name LIKE '%ArtMal%' THEN 'Fresk w restauracji "Pod Gryfem"'
            WHEN c.name LIKE '%KrakRemont%' THEN 'Remont mieszkania 120m² w Krakowie'
            WHEN c.name LIKE '%KrakHydro%' THEN 'Instalacja pompy ciepła'
            WHEN c.name LIKE '%KrakElektro%' THEN 'System automatyki budynkowej KNX'
            WHEN c.name LIKE '%GdańskRemont%' THEN 'Remont mieszkania 95m² w Gdańsku'
            WHEN c.name LIKE '%SolarTech%' THEN 'Farma fotowoltaiczna 100kW'
            WHEN c.name LIKE '%MegaBud%' THEN 'Termomodernizacja osiedla "Słoneczne"'
            WHEN c.name LIKE '%PoznańHydro%' THEN 'Instalacja hydrauliczna w budynku biurowym'
            WHEN c.name LIKE '%PoznańElektro%' THEN 'System oświetlenia LED w centrum handlowym'
            WHEN c.name LIKE '%KatowiceRemont%' THEN 'Remont mieszkania 110m² w Katowicach'
            ELSE 'Projekt referencyjny'
        END,
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN 'Pełny remont mieszkania w kamienicy z lat 20-tych, zachowanie zabytkowego charakteru'
            WHEN c.name LIKE '%HydroMaster%' THEN 'Kompleksowa wymiana instalacji grzewczej wraz z montażem pompy ciepła'
            WHEN c.name LIKE '%ElektroProfi%' THEN 'Kompleksowa automatyka budynkowa KNX z integracją oświetlenia, klimatyzacji i bezpieczeństwa'
            WHEN c.name LIKE '%ArtMal%' THEN 'Malowanie artystyczne ścian w stylu śródziemnomorskim'
            WHEN c.name LIKE '%KrakRemont%' THEN 'Kompleksowy remont luksusowego mieszkania z najwyższej jakości materiałami'
            WHEN c.name LIKE '%KrakHydro%' THEN 'Instalacja pompy ciepła z systemem ogrzewania podłogowego'
            WHEN c.name LIKE '%KrakElektro%' THEN 'System automatyki budynkowej KNX z kontrolą oświetlenia i ogrzewania'
            WHEN c.name LIKE '%GdańskRemont%' THEN 'Remont mieszkania w nowoczesnym budynku z wykorzystaniem ekologicznych materiałów'
            WHEN c.name LIKE '%SolarTech%' THEN 'Instalacja paneli na dachu zakładu produkcyjnego z systemem monitoringu'
            WHEN c.name LIKE '%MegaBud%' THEN 'Ocieplenie 12 budynków wielorodzinnych systemem ETICS'
            WHEN c.name LIKE '%PoznańHydro%' THEN 'Kompleksowa instalacja wodno-kanalizacyjna w nowym budynku biurowym'
            WHEN c.name LIKE '%PoznańElektro%' THEN 'Modernizacja oświetlenia LED w centrum handlowym z systemem sterowania'
            WHEN c.name LIKE '%KatowiceRemont%' THEN 'Remont mieszkania w budynku z lat 70-tych z modernizacją instalacji'
            ELSE 'Projekt referencyjny wykonany przez naszą firmę'
        END,
        CASE 
            WHEN c.name LIKE '%RenoBud%' OR c.name LIKE '%KrakRemont%' OR c.name LIKE '%GdańskRemont%' OR c.name LIKE '%KatowiceRemont%' THEN remonty_category_id
            WHEN c.name LIKE '%HydroMaster%' OR c.name LIKE '%KrakHydro%' OR c.name LIKE '%PoznańHydro%' THEN hydraulika_category_id
            WHEN c.name LIKE '%ElektroProfi%' OR c.name LIKE '%KrakElektro%' OR c.name LIKE '%PoznańElektro%' THEN elektryka_category_id
            WHEN c.name LIKE '%ArtMal%' THEN malowanie_category_id
            WHEN c.name LIKE '%SolarTech%' THEN oze_category_id
            WHEN c.name LIKE '%MegaBud%' THEN budowlane_category_id
            ELSE remonty_category_id
        END,
        c.city,
        'residential',
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN '150,000 - 200,000 zł'
            WHEN c.name LIKE '%HydroMaster%' THEN '85,000 - 120,000 zł'
            WHEN c.name LIKE '%ElektroProfi%' THEN '120,000 - 180,000 zł'
            WHEN c.name LIKE '%ArtMal%' THEN '25,000 - 35,000 zł'
            WHEN c.name LIKE '%KrakRemont%' THEN '180,000 - 220,000 zł'
            WHEN c.name LIKE '%KrakHydro%' THEN '45,000 - 65,000 zł'
            WHEN c.name LIKE '%KrakElektro%' THEN '100,000 - 150,000 zł'
            WHEN c.name LIKE '%GdańskRemont%' THEN '160,000 - 190,000 zł'
            WHEN c.name LIKE '%SolarTech%' THEN '320,000 - 400,000 zł'
            WHEN c.name LIKE '%MegaBud%' THEN '2,400,000 - 3,000,000 zł'
            WHEN c.name LIKE '%PoznańHydro%' THEN '60,000 - 90,000 zł'
            WHEN c.name LIKE '%PoznańElektro%' THEN '80,000 - 120,000 zł'
            WHEN c.name LIKE '%KatowiceRemont%' THEN '170,000 - 200,000 zł'
            ELSE 'Wycena indywidualna'
        END,
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN '3 miesiące'
            WHEN c.name LIKE '%HydroMaster%' THEN '2 miesiące'
            WHEN c.name LIKE '%ElektroProfi%' THEN '4 miesiące'
            WHEN c.name LIKE '%ArtMal%' THEN '3 tygodnie'
            WHEN c.name LIKE '%KrakRemont%' THEN '3 miesiące'
            WHEN c.name LIKE '%KrakHydro%' THEN '2 tygodnie'
            WHEN c.name LIKE '%KrakElektro%' THEN '3 miesiące'
            WHEN c.name LIKE '%GdańskRemont%' THEN '2.5 miesiąca'
            WHEN c.name LIKE '%SolarTech%' THEN '6 tygodni'
            WHEN c.name LIKE '%MegaBud%' THEN '8 miesięcy'
            WHEN c.name LIKE '%PoznańHydro%' THEN '3 tygodnie'
            WHEN c.name LIKE '%PoznańElektro%' THEN '2 miesiące'
            WHEN c.name LIKE '%KatowiceRemont%' THEN '2.5 miesiąca'
            ELSE '2 miesiące'
        END,
        CURRENT_DATE - INTERVAL '1 month' * (RANDOM() * 12),
        CASE 
            WHEN c.name LIKE '%RenoBud%' THEN 'Właściciel mieszkania'
            WHEN c.name LIKE '%HydroMaster%' THEN 'Wspólnota mieszkaniowa'
            WHEN c.name LIKE '%ElektroProfi%' THEN 'Właściciel domu'
            WHEN c.name LIKE '%ArtMal%' THEN 'Właściciel restauracji'
            WHEN c.name LIKE '%KrakRemont%' THEN 'Właściciel mieszkania'
            WHEN c.name LIKE '%KrakHydro%' THEN 'Wspólnota mieszkaniowa'
            WHEN c.name LIKE '%KrakElektro%' THEN 'Właściciel domu'
            WHEN c.name LIKE '%GdańskRemont%' THEN 'Właściciel mieszkania'
            WHEN c.name LIKE '%SolarTech%' THEN 'Właściciel zakładu'
            WHEN c.name LIKE '%MegaBud%' THEN 'Zarząd osiedla'
            WHEN c.name LIKE '%PoznańHydro%' THEN 'Właściciel budynku'
            WHEN c.name LIKE '%PoznańElektro%' THEN 'Zarząd centrum handlowego'
            WHEN c.name LIKE '%KatowiceRemont%' THEN 'Właściciel mieszkania'
            ELSE 'Klient'
        END,
        'Doskonała jakość wykonania, terminowość i profesjonalizm. Polecam!',
        true
    FROM companies c
    WHERE c.type = 'contractor' AND c.is_verified = true
    ON CONFLICT (company_id, title) DO NOTHING;

END $$;
