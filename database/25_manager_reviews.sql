-- =============================================
-- MANAGER REVIEWS DATA
-- =============================================
-- Add sample reviews for managers (property managers, wspólnota, etc.)

-- First, create manager user profiles if they don't exist
DO $$
DECLARE
    contractor_user_ids UUID[];
    manager_company_record RECORD;
    review_titles TEXT[] := ARRAY[
        'Profesjonalne zarządzanie',
        'Doskonała obsługa mieszkańców',
        'Terminowe rozliczenia',
        'Nowoczesne podejście do zarządzania',
        'Szybka reakcja na problemy',
        'Przejrzyste dokumenty',
        'Efektywne zarządzanie budżetem',
        'Dobra komunikacja z mieszkańcami',
        'Wysoka jakość usług',
        'Polecam wszystkim wspólnotom',
        'Profesjonalny zespół',
        'Transparentne rozliczenia',
        'Oszczędności w budżecie',
        'Doskonała organizacja',
        'Wartościowa współpraca'
    ];
    review_comments TEXT[] := ARRAY[
        'Profesjonalne podejście do zarządzania wspólnotą. Wszystkie sprawy załatwiane terminowo i rzetelnie.',
        'Doskonała obsługa mieszkańców, szybka reakcja na zgłoszenia i przejrzyste rozliczenia.',
        'Terminowe płatności i świetna komunikacja. Wspólnota jest w dobrych rękach.',
        'Nowoczesne podejście do zarządzania, wykorzystanie technologii znacznie ułatwia komunikację.',
        'Szybka reakcja na wszystkie problemy. Serwis techniczny zawsze na czas.',
        'Przejrzyste dokumenty i regularne raporty. Wiemy dokładnie na co idą nasze pieniądze.',
        'Efektywne zarządzanie budżetem. Niższe koszty zarządzania, wyższa jakość usług.',
        'Dobra komunikacja z mieszkańcami, regularne spotkania, słuchanie naszych potrzeb.',
        'Wysoka jakość usług - porządki, remonty, administracja na najwyższym poziomie.',
        'Polecam wszystkim wspólnotom szukającym rzetelnego zarządcy.',
        'Profesjonalny zespół, który zawsze jest do dyspozycji mieszkańców.',
        'Transparentne rozliczenia, wszystko widać na bieżąco w systemie online.',
        'Znaczące oszczędności w budżecie dzięki dobremu zarządzaniu.',
        'Doskonała organizacja pracy, wszystko działa jak w zegarku.',
        'Wartościowa współpraca. Zarządca naprawdę dba o nasze wspólne dobro.'
    ];
    i INTEGER;
    random_rating INTEGER;
    random_title TEXT;
    random_comment TEXT;
    random_user_id UUID;
BEGIN
    -- Get contractor user IDs to use as reviewers for managers
    SELECT ARRAY_AGG(id) INTO contractor_user_ids 
    FROM user_profiles 
    WHERE user_type = 'contractor' 
    LIMIT 20;
    
    -- If no contractor users exist, create some dummy ones for reviews
    IF contractor_user_ids IS NULL OR array_length(contractor_user_ids, 1) = 0 THEN
        INSERT INTO user_profiles (id, user_type, first_name, last_name, phone, is_verified, profile_completed, onboarding_completed)
        VALUES 
            (uuid_generate_v4(), 'contractor', 'Jan', 'Kowalski', '+48123456789', true, true, true),
            (uuid_generate_v4(), 'contractor', 'Anna', 'Nowak', '+48123456790', true, true, true),
            (uuid_generate_v4(), 'contractor', 'Piotr', 'Wiśniewski', '+48123456791', true, true, true),
            (uuid_generate_v4(), 'contractor', 'Maria', 'Dąbrowska', '+48123456792', true, true, true),
            (uuid_generate_v4(), 'contractor', 'Tomasz', 'Lewandowski', '+48123456793', true, true, true)
        ON CONFLICT DO NOTHING;
        
        SELECT ARRAY_AGG(id) INTO contractor_user_ids 
        FROM user_profiles 
        WHERE user_type = 'contractor';
    END IF;
    
    -- Add reviews for each manager company
    FOR manager_company_record IN 
        SELECT id, name FROM companies 
        WHERE type IN ('property_management', 'housing_association', 'cooperative', 
                      'condo_management', 'spółdzielnia', 'wspólnota')
        AND is_verified = true
    LOOP
        -- Add 3-8 reviews per manager
        FOR i IN 1..(3 + (RANDOM() * 6)::INTEGER) LOOP
            -- Select random reviewer
            random_user_id := contractor_user_ids[1 + (RANDOM() * GREATEST(0, array_length(contractor_user_ids, 1) - 1))::INTEGER];
            
            -- Generate random rating (mostly 4-5 stars)
            random_rating := CASE 
                WHEN RANDOM() < 0.75 THEN 5
                WHEN RANDOM() < 0.95 THEN 4
                ELSE 3
            END;
            
            -- Select random title and comment
            random_title := review_titles[1 + (RANDOM() * (array_length(review_titles, 1) - 1))::INTEGER];
            random_comment := review_comments[1 + (RANDOM() * (array_length(review_comments, 1) - 1))::INTEGER];
            
            -- Insert review
            INSERT INTO company_reviews (
                company_id, 
                reviewer_id, 
                rating, 
                title, 
                comment, 
                categories, 
                is_public, 
                is_verified,
                created_at
            ) VALUES (
                manager_company_record.id,
                random_user_id,
                random_rating,
                random_title,
                random_comment,
                jsonb_build_object(
                    'payment_timeliness', 4.0 + (RANDOM() * 1.0),
                    'communication', 4.0 + (RANDOM() * 1.0),
                    'project_clarity', 4.0 + (RANDOM() * 1.0),
                    'professionalism', 4.0 + (RANDOM() * 1.0)
                ),
                true,
                true,
                NOW() - INTERVAL '1 day' * (RANDOM() * 90) -- Reviews from last 3 months
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Update company_ratings for managers with recalculated averages
UPDATE company_ratings cr
SET 
    average_rating = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM company_reviews 
        WHERE company_reviews.company_id = cr.company_id
        AND is_public = true
    ), 0),
    total_reviews = COALESCE((
        SELECT COUNT(*)
        FROM company_reviews 
        WHERE company_reviews.company_id = cr.company_id
        AND is_public = true
    ), 0),
    rating_breakdown = COALESCE((
        SELECT jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
        )
        FROM company_reviews 
        WHERE company_reviews.company_id = cr.company_id
        AND is_public = true
    ), '{}'::jsonb),
    category_ratings = COALESCE((
        SELECT jsonb_build_object(
            'payment_timeliness', ROUND(AVG((categories->>'payment_timeliness')::numeric), 1),
            'communication', ROUND(AVG((categories->>'communication')::numeric), 1),
            'project_clarity', ROUND(AVG((categories->>'project_clarity')::numeric), 1),
            'professionalism', ROUND(AVG((categories->>'professionalism')::numeric), 1)
        )
        FROM company_reviews 
        WHERE company_reviews.company_id = cr.company_id
        AND is_public = true
        AND categories IS NOT NULL
    ), '{}'::jsonb)
WHERE cr.company_id IN (
    SELECT id FROM companies 
    WHERE type IN ('property_management', 'housing_association', 'cooperative', 
                  'condo_management', 'spółdzielnia', 'wspólnota')
);

-- Create or update company_ratings records for managers without ratings
INSERT INTO company_ratings (company_id, average_rating, total_reviews, rating_breakdown, category_ratings)
SELECT 
    c.id,
    COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM company_reviews 
        WHERE company_reviews.company_id = c.id
        AND is_public = true
    ), 0),
    COALESCE((
        SELECT COUNT(*)
        FROM company_reviews 
        WHERE company_reviews.company_id = c.id
        AND is_public = true
    ), 0),
    COALESCE((
        SELECT jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
        )
        FROM company_reviews 
        WHERE company_reviews.company_id = c.id
        AND is_public = true
    ), '{}'::jsonb),
    COALESCE((
        SELECT jsonb_build_object(
            'payment_timeliness', ROUND(AVG((categories->>'payment_timeliness')::numeric), 1),
            'communication', ROUND(AVG((categories->>'communication')::numeric), 1),
            'project_clarity', ROUND(AVG((categories->>'project_clarity')::numeric), 1),
            'professionalism', ROUND(AVG((categories->>'professionalism')::numeric), 1)
        )
        FROM company_reviews 
        WHERE company_reviews.company_id = c.id
        AND is_public = true
        AND categories IS NOT NULL
    ), '{}'::jsonb)
FROM companies c
WHERE c.type IN ('property_management', 'housing_association', 'cooperative', 
                'condo_management', 'spółdzielnia', 'wspólnota')
AND NOT EXISTS (SELECT 1 FROM company_ratings WHERE company_id = c.id)
ON CONFLICT (company_id) DO NOTHING;

-- Verify the reviews were created
SELECT 
    c.name as manager_name,
    COUNT(cr.id) as review_count,
    COALESCE(AVG(cr.rating), 0) as average_rating
FROM companies c
LEFT JOIN company_reviews cr ON c.id = cr.company_id AND cr.is_public = true
WHERE c.type IN ('property_management', 'housing_association', 'cooperative', 
                'condo_management', 'spółdzielnia', 'wspólnota')
GROUP BY c.id, c.name
ORDER BY review_count DESC;

