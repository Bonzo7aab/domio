-- Enhanced Ratings and Reviews Data for Contractors
-- This script adds comprehensive ratings and reviews data to make contractors more realistic

-- First, let's add more diverse ratings to existing contractors
UPDATE company_ratings 
SET 
    average_rating = CASE 
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%RenoBud%' OR name LIKE '%ArtMal%'
        ) THEN 4.9
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%HydroMaster%' OR name LIKE '%ElektroProfi%' OR name LIKE '%SolarTech%'
        ) THEN 4.8
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%KrakRemont%' OR name LIKE '%GdańskRemont%' OR name LIKE '%MegaBud%'
        ) THEN 4.6
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%KrakHydro%' OR name LIKE '%PoznańHydro%' OR name LIKE '%KatowiceRemont%'
        ) THEN 4.5
        ELSE 4.4
    END,
    total_reviews = CASE 
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%RenoBud%' OR name LIKE '%MegaBud%'
        ) THEN 127 + (RANDOM() * 50)::INTEGER
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%HydroMaster%' OR name LIKE '%ElektroProfi%'
        ) THEN 73 + (RANDOM() * 30)::INTEGER
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%ArtMal%' OR name LIKE '%SolarTech%'
        ) THEN 56 + (RANDOM() * 20)::INTEGER
        ELSE 45 + (RANDOM() * 25)::INTEGER
    END,
    rating_breakdown = CASE 
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%RenoBud%' OR name LIKE '%ArtMal%'
        ) THEN '{"5": 85, "4": 12, "3": 2, "2": 0, "1": 1}'::jsonb
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%HydroMaster%' OR name LIKE '%ElektroProfi%'
        ) THEN '{"5": 75, "4": 20, "3": 4, "2": 1, "1": 0}'::jsonb
        ELSE '{"5": 60, "4": 30, "3": 8, "2": 1, "1": 1}'::jsonb
    END,
    category_ratings = CASE 
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%RenoBud%' OR name LIKE '%ArtMal%'
        ) THEN '{"quality": 4.9, "timeliness": 4.8, "communication": 4.9, "pricing": 4.7}'::jsonb
        WHEN company_id IN (
            SELECT id FROM companies WHERE name LIKE '%HydroMaster%' OR name LIKE '%ElektroProfi%'
        ) THEN '{"quality": 4.8, "timeliness": 4.7, "communication": 4.8, "pricing": 4.6}'::jsonb
        ELSE '{"quality": 4.6, "timeliness": 4.5, "communication": 4.7, "pricing": 4.4}'::jsonb
    END,
    last_review_date = NOW() - INTERVAL '1 day' * (RANDOM() * 7)
WHERE company_id IN (SELECT id FROM companies WHERE type = 'contractor');

-- Add comprehensive sample reviews for each contractor
-- First, let's get some manager IDs to use as reviewers
DO $$
DECLARE
    manager_ids UUID[];
    contractor_record RECORD;
    review_titles TEXT[] := ARRAY[
        'Profesjonalne wykonanie remontu',
        'Szybka reakcja na awarię',
        'Nowoczesne rozwiązania',
        'Niesamowita precyzja',
        'Solidne wykonanie',
        'Oszczędności energii',
        'Terminowe wykonanie',
        'Wysoka jakość materiałów',
        'Doskonała komunikacja',
        'Polecam wszystkim',
        'Wartość za pieniądze',
        'Profesjonalny zespół',
        'Szybka naprawa',
        'Nowoczesne technologie',
        'Doskonałe rezultaty'
    ];
    review_comments TEXT[] := ARRAY[
        'Profesjonalne podejście, terminowość i bardzo wysoka jakość wykonania. Polecam!',
        'Szybka reakcja na awarię, profesjonalne wykonanie naprawy. Bardzo polecamy!',
        'Fantastyczna robota! System LED oszczędza nam 70% kosztów energii. Profesjonalny zespół.',
        'Niesamowita precyzja i artystyczne podejście. Klatka wygląda jak dzieło sztuki!',
        'Solidne wykonanie, dotrzymane terminy. Oszczędności energii ponad oczekiwania!',
        'Profesjonalne wykonanie, polecamy!',
        'Doskonała komunikacja i terminowość. Zdecydowanie polecamy!',
        'Wysokiej jakości materiały i fachowe wykonanie. Wartość za pieniądze.',
        'Szybka naprawa, profesjonalny zespół. Bardzo zadowoleni z usługi.',
        'Nowoczesne technologie i doskonałe rezultaty. Polecamy wszystkim!',
        'Terminowe wykonanie, wysoka jakość. Zdecydowanie polecamy!',
        'Profesjonalny zespół, doskonała komunikacja. Bardzo zadowoleni!',
        'Szybka reakcja, fachowe wykonanie. Polecamy wszystkim!',
        'Nowoczesne rozwiązania, doskonałe rezultaty. Wartość za pieniądze.',
        'Profesjonalne podejście, terminowość. Zdecydowanie polecamy!'
    ];
    category_ratings JSONB[] := ARRAY[
        '{"quality": 4.9, "timeliness": 4.8, "communication": 4.9, "pricing": 4.7}'::jsonb,
        '{"quality": 4.8, "timeliness": 4.7, "communication": 4.8, "pricing": 4.6}'::jsonb,
        '{"quality": 4.7, "timeliness": 4.6, "communication": 4.7, "pricing": 4.5}'::jsonb,
        '{"quality": 4.6, "timeliness": 4.5, "communication": 4.6, "pricing": 4.4}'::jsonb,
        '{"quality": 4.5, "timeliness": 4.4, "communication": 4.5, "pricing": 4.3}'::jsonb
    ];
    i INTEGER;
    j INTEGER;
    random_manager_id UUID;
    random_rating INTEGER;
    random_title TEXT;
    random_comment TEXT;
    random_categories JSONB;
BEGIN
    -- Get manager IDs
    SELECT ARRAY_AGG(id) INTO manager_ids 
    FROM user_profiles 
    WHERE user_type = 'manager' 
    LIMIT 10;
    
    -- If no managers exist, create some dummy ones for reviews
    IF manager_ids IS NULL OR array_length(manager_ids, 1) = 0 THEN
        INSERT INTO user_profiles (id, user_type, full_name, email, is_verified, created_at)
        VALUES 
            (uuid_generate_v4(), 'manager', 'Jan Kowalski', 'jan.kowalski@example.com', true, NOW()),
            (uuid_generate_v4(), 'manager', 'Anna Nowak', 'anna.nowak@example.com', true, NOW()),
            (uuid_generate_v4(), 'manager', 'Piotr Wiśniewski', 'piotr.wisniewski@example.com', true, NOW()),
            (uuid_generate_v4(), 'manager', 'Maria Dąbrowska', 'maria.dabrowska@example.com', true, NOW()),
            (uuid_generate_v4(), 'manager', 'Tomasz Lewandowski', 'tomasz.lewandowski@example.com', true, NOW())
        ON CONFLICT (email) DO NOTHING;
        
        SELECT ARRAY_AGG(id) INTO manager_ids 
        FROM user_profiles 
        WHERE user_type = 'manager' 
        LIMIT 10;
    END IF;
    
    -- Add multiple reviews for each contractor
    FOR contractor_record IN 
        SELECT id, name FROM companies 
        WHERE type = 'contractor' AND is_verified = true
    LOOP
        -- Add 3-8 reviews per contractor
        FOR i IN 1..(3 + (RANDOM() * 6)::INTEGER) LOOP
            -- Select random manager
            random_manager_id := manager_ids[1 + (RANDOM() * (array_length(manager_ids, 1) - 1))::INTEGER];
            
            -- Generate random rating (mostly 4-5 stars, some 3 stars)
            random_rating := CASE 
                WHEN RANDOM() < 0.7 THEN 5
                WHEN RANDOM() < 0.9 THEN 4
                ELSE 3
            END;
            
            -- Select random title and comment
            random_title := review_titles[1 + (RANDOM() * (array_length(review_titles, 1) - 1))::INTEGER];
            random_comment := review_comments[1 + (RANDOM() * (array_length(review_comments, 1) - 1))::INTEGER];
            random_categories := category_ratings[1 + (RANDOM() * (array_length(category_ratings, 1) - 1))::INTEGER];
            
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
                contractor_record.id,
                random_manager_id,
                random_rating,
                random_title,
                random_comment,
                random_categories,
                true,
                true,
                NOW() - INTERVAL '1 day' * (RANDOM() * 90) -- Reviews from last 3 months
            ) ON CONFLICT (company_id, reviewer_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Update company_ratings table with recalculated averages
UPDATE company_ratings 
SET 
    average_rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM company_reviews 
        WHERE company_reviews.company_id = company_ratings.company_id
        AND is_public = true
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM company_reviews 
        WHERE company_reviews.company_id = company_ratings.company_id
        AND is_public = true
    ),
    rating_breakdown = (
        SELECT jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
        )
        FROM company_reviews 
        WHERE company_reviews.company_id = company_ratings.company_id
        AND is_public = true
    ),
    category_ratings = (
        SELECT jsonb_build_object(
            'quality', ROUND(AVG((categories->>'quality')::numeric), 1),
            'timeliness', ROUND(AVG((categories->>'timeliness')::numeric), 1),
            'communication', ROUND(AVG((categories->>'communication')::numeric), 1),
            'pricing', ROUND(AVG((categories->>'pricing')::numeric), 1)
        )
        FROM company_reviews 
        WHERE company_reviews.company_id = company_ratings.company_id
        AND is_public = true
        AND categories IS NOT NULL
    ),
    last_review_date = (
        SELECT MAX(created_at)
        FROM company_reviews 
        WHERE company_reviews.company_id = company_ratings.company_id
        AND is_public = true
    )
WHERE company_id IN (SELECT id FROM companies WHERE type = 'contractor');

-- Add some recent reviews (last 7 days) to make it more dynamic
INSERT INTO company_reviews (company_id, reviewer_id, rating, title, comment, categories, is_public, is_verified, created_at)
SELECT 
    c.id,
    (SELECT id FROM user_profiles WHERE user_type = 'manager' ORDER BY RANDOM() LIMIT 1),
    CASE 
        WHEN RANDOM() < 0.8 THEN 5
        WHEN RANDOM() < 0.95 THEN 4
        ELSE 3
    END,
    CASE 
        WHEN RANDOM() < 0.2 THEN 'Świetna robota!'
        WHEN RANDOM() < 0.4 THEN 'Profesjonalne wykonanie'
        WHEN RANDOM() < 0.6 THEN 'Polecam wszystkim'
        WHEN RANDOM() < 0.8 THEN 'Doskonała jakość'
        ELSE 'Wartość za pieniądze'
    END,
    CASE 
        WHEN RANDOM() < 0.2 THEN 'Bardzo zadowolony z usługi. Profesjonalne podejście i terminowość.'
        WHEN RANDOM() < 0.4 THEN 'Doskonała komunikacja i wysokiej jakości wykonanie. Polecamy!'
        WHEN RANDOM() < 0.6 THEN 'Szybka reakcja na problem i fachowe rozwiązanie. Dziękujemy!'
        WHEN RANDOM() < 0.8 THEN 'Nowoczesne rozwiązania i doskonałe rezultaty. Wartość za pieniądze.'
        ELSE 'Profesjonalny zespół, terminowe wykonanie. Zdecydowanie polecamy!'
    END,
    jsonb_build_object(
        'quality', 4.0 + (RANDOM() * 1.0),
        'timeliness', 4.0 + (RANDOM() * 1.0),
        'communication', 4.0 + (RANDOM() * 1.0),
        'pricing', 4.0 + (RANDOM() * 1.0)
    ),
    true,
    true,
    NOW() - INTERVAL '1 day' * (RANDOM() * 7)
FROM companies c
WHERE c.type = 'contractor' AND c.is_verified = true
AND RANDOM() < 0.3; -- 30% chance for each contractor to get a recent review

-- Create a function to get contractor reviews with pagination
CREATE OR REPLACE FUNCTION get_contractor_reviews(
    contractor_id_param UUID,
    limit_count INTEGER DEFAULT 10,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    reviewer_name TEXT,
    reviewer_type TEXT,
    rating INTEGER,
    title TEXT,
    comment TEXT,
    categories JSONB,
    created_at TIMESTAMPTZ,
    helpful_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        COALESCE(up.full_name, 'Anonimowy użytkownik') as reviewer_name,
        up.user_type as reviewer_type,
        cr.rating,
        cr.title,
        cr.comment,
        cr.categories,
        cr.created_at,
        0 as helpful_count -- Placeholder for helpful votes
    FROM company_reviews cr
    LEFT JOIN user_profiles up ON cr.reviewer_id = up.id
    WHERE cr.company_id = contractor_id_param
    AND cr.is_public = true
    ORDER BY cr.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get contractor rating summary
CREATE OR REPLACE FUNCTION get_contractor_rating_summary(contractor_id_param UUID)
RETURNS TABLE (
    average_rating DECIMAL(3,2),
    total_reviews INTEGER,
    rating_breakdown JSONB,
    category_ratings JSONB,
    last_review_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(cr.average_rating, 0) as average_rating,
        COALESCE(cr.total_reviews, 0) as total_reviews,
        COALESCE(cr.rating_breakdown, '{}'::jsonb) as rating_breakdown,
        COALESCE(cr.category_ratings, '{}'::jsonb) as category_ratings,
        cr.last_review_date
    FROM company_ratings cr
    WHERE cr.company_id = contractor_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_reviews_company_public ON company_reviews(company_id, is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_reviews_rating ON company_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_company_ratings_average_rating ON company_ratings(average_rating DESC);

-- Add some sample job references for reviews (optional)
UPDATE company_reviews 
SET job_id = (
    SELECT j.id 
    FROM jobs j 
    WHERE j.company_id = company_reviews.company_id 
    ORDER BY RANDOM() 
    LIMIT 1
)
WHERE job_id IS NULL 
AND RANDOM() < 0.3; -- 30% of reviews get a job reference

COMMIT;
