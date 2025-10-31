-- =============================================
-- POPULATE REVIEWS AND RATINGS DATA
-- =============================================
-- This script populates the company_reviews and company_ratings tables
-- with realistic data for contractors

-- First, let's ensure we have some manager users to use as reviewers
-- (This will only insert if they don't already exist)
INSERT INTO user_profiles (id, user_type, first_name, last_name, phone, is_verified, profile_completed, onboarding_completed)
SELECT 
    uuid_generate_v4(),
    'manager',
    first_names.first_name,
    last_names.last_name,
    '+48' || (500000000 + (random() * 99999999)::bigint)::text,
    true,
    true,
    true
FROM (
    VALUES 
        ('Jan'), ('Anna'), ('Piotr'), ('Maria'), ('Tomasz'), ('Katarzyna'),
        ('Marek'), ('Agnieszka'), ('Paweł'), ('Magdalena'), ('Łukasz'), ('Joanna'),
        ('Michał'), ('Ewa'), ('Krzysztof'), ('Barbara'), ('Andrzej'), ('Elżbieta'),
        ('Stanisław'), ('Teresa'), ('Józef'), ('Danuta'), ('Zbigniew'), ('Halina')
) AS first_names(first_name)
CROSS JOIN (
    VALUES 
        ('Kowalski'), ('Nowak'), ('Wiśniewski'), ('Dąbrowski'), ('Lewandowski'),
        ('Wójcik'), ('Kamiński'), ('Kowalczyk'), ('Zieliński'), ('Szymański'),
        ('Woźniak'), ('Kozłowski'), ('Jankowski'), ('Wojciechowski'), ('Kwiatkowski'),
        ('Kaczmarek'), ('Mazur'), ('Krawczyk'), ('Piotrowski'), ('Grabowski'),
        ('Nowakowski'), ('Pawłowski'), ('Michalski'), ('Król'), ('Wieczorek')
) AS last_names(last_name)
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_type = 'manager' 
    LIMIT 1
)
LIMIT 20;

-- Get manager IDs for reviews
WITH manager_ids AS (
    SELECT id FROM user_profiles WHERE user_type = 'manager' LIMIT 20
),
contractor_ids AS (
    SELECT id FROM companies WHERE type = 'contractor' AND is_verified = true
)

-- Insert comprehensive reviews for contractors
INSERT INTO company_reviews (company_id, reviewer_id, rating, title, comment, categories, is_public, is_verified, created_at)
SELECT 
    c.id,
    m.id,
    CASE 
        -- Most reviews are 4-5 stars (realistic distribution)
        WHEN random() < 0.7 THEN 5
        WHEN random() < 0.9 THEN 4
        WHEN random() < 0.95 THEN 3
        WHEN random() < 0.98 THEN 2
        ELSE 1
    END,
    CASE 
        WHEN random() < 0.15 THEN 'Profesjonalne wykonanie remontu'
        WHEN random() < 0.25 THEN 'Szybka reakcja na awarię'
        WHEN random() < 0.35 THEN 'Nowoczesne rozwiązania'
        WHEN random() < 0.45 THEN 'Niesamowita precyzja'
        WHEN random() < 0.55 THEN 'Solidne wykonanie'
        WHEN random() < 0.65 THEN 'Oszczędności energii'
        WHEN random() < 0.75 THEN 'Terminowe wykonanie'
        WHEN random() < 0.85 THEN 'Wysoka jakość materiałów'
        WHEN random() < 0.9 THEN 'Doskonała komunikacja'
        ELSE 'Polecam wszystkim'
    END,
    CASE 
        WHEN random() < 0.1 THEN 'Profesjonalne podejście, terminowość i bardzo wysoka jakość wykonania. Polecam!'
        WHEN random() < 0.2 THEN 'Szybka reakcja na awarię, profesjonalne wykonanie naprawy. Bardzo polecamy!'
        WHEN random() < 0.3 THEN 'Fantastyczna robota! System LED oszczędza nam 70% kosztów energii. Profesjonalny zespół.'
        WHEN random() < 0.4 THEN 'Niesamowita precyzja i artystyczne podejście. Klatka wygląda jak dzieło sztuki!'
        WHEN random() < 0.5 THEN 'Solidne wykonanie, dotrzymane terminy. Oszczędności energii ponad oczekiwania!'
        WHEN random() < 0.6 THEN 'Profesjonalne wykonanie, polecamy!'
        WHEN random() < 0.7 THEN 'Doskonała komunikacja i terminowość. Zdecydowanie polecamy!'
        WHEN random() < 0.8 THEN 'Wysokiej jakości materiały i fachowe wykonanie. Wartość za pieniądze.'
        WHEN random() < 0.9 THEN 'Szybka naprawa, profesjonalny zespół. Bardzo zadowoleni z usługi.'
        ELSE 'Nowoczesne technologie i doskonałe rezultaty. Polecamy wszystkim!'
    END,
    jsonb_build_object(
        'quality', 4.0 + (random() * 1.0),
        'timeliness', 4.0 + (random() * 1.0),
        'communication', 4.0 + (random() * 1.0),
        'pricing', 4.0 + (random() * 1.0)
    ),
    true,
    true,
    NOW() - INTERVAL '1 day' * (random() * 90) -- Reviews from last 3 months
FROM contractor_ids c
CROSS JOIN manager_ids m
WHERE random() < 0.8; -- 80% chance for each contractor-manager combination

-- Add some recent reviews (last 7 days) to make it more dynamic
INSERT INTO company_reviews (company_id, reviewer_id, rating, title, comment, categories, is_public, is_verified, created_at)
SELECT 
    c.id,
    (SELECT id FROM user_profiles WHERE user_type = 'manager' ORDER BY random() LIMIT 1),
    CASE 
        WHEN random() < 0.8 THEN 5
        WHEN random() < 0.95 THEN 4
        ELSE 3
    END,
    CASE 
        WHEN random() < 0.2 THEN 'Świetna robota!'
        WHEN random() < 0.4 THEN 'Profesjonalne wykonanie'
        WHEN random() < 0.6 THEN 'Polecam wszystkim'
        WHEN random() < 0.8 THEN 'Doskonała jakość'
        ELSE 'Wartość za pieniądze'
    END,
    CASE 
        WHEN random() < 0.2 THEN 'Bardzo zadowolony z usługi. Profesjonalne podejście i terminowość.'
        WHEN random() < 0.4 THEN 'Doskonała komunikacja i wysokiej jakości wykonanie. Polecamy!'
        WHEN random() < 0.6 THEN 'Szybka reakcja na problem i fachowe rozwiązanie. Dziękujemy!'
        WHEN random() < 0.8 THEN 'Nowoczesne rozwiązania i doskonałe rezultaty. Wartość za pieniądze.'
        ELSE 'Profesjonalny zespół, terminowe wykonanie. Zdecydowanie polecamy!'
    END,
    jsonb_build_object(
        'quality', 4.0 + (random() * 1.0),
        'timeliness', 4.0 + (random() * 1.0),
        'communication', 4.0 + (random() * 1.0),
        'pricing', 4.0 + (random() * 1.0)
    ),
    true,
    true,
    NOW() - INTERVAL '1 day' * (random() * 7)
FROM companies c
WHERE c.type = 'contractor' AND c.is_verified = true
AND random() < 0.3; -- 30% chance for each contractor to get a recent review

-- Update company_ratings table with calculated averages
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
    ),
    updated_at = NOW()
WHERE company_id IN (SELECT id FROM companies WHERE type = 'contractor');

-- Insert company_ratings for contractors that don't have them yet
INSERT INTO company_ratings (company_id, average_rating, total_reviews, rating_breakdown, category_ratings, last_review_date, updated_at)
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
    ), '{"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}'::jsonb),
    COALESCE((
        SELECT jsonb_build_object(
            'quality', ROUND(AVG((categories->>'quality')::numeric), 1),
            'timeliness', ROUND(AVG((categories->>'timeliness')::numeric), 1),
            'communication', ROUND(AVG((categories->>'communication')::numeric), 1),
            'pricing', ROUND(AVG((categories->>'pricing')::numeric), 1)
        )
        FROM company_reviews 
        WHERE company_reviews.company_id = c.id
        AND is_public = true
        AND categories IS NOT NULL
    ), '{"quality": 0, "timeliness": 0, "communication": 0, "pricing": 0}'::jsonb),
    (
        SELECT MAX(created_at)
        FROM company_reviews 
        WHERE company_reviews.company_id = c.id
        AND is_public = true
    ),
    NOW()
FROM companies c
WHERE c.type = 'contractor' 
AND c.is_verified = true
AND NOT EXISTS (
    SELECT 1 FROM company_ratings 
    WHERE company_ratings.company_id = c.id
);

-- Add some job references for reviews (optional)
UPDATE company_reviews 
SET job_id = (
    SELECT j.id 
    FROM jobs j 
    WHERE j.company_id = company_reviews.company_id 
    ORDER BY random() 
    LIMIT 1
)
WHERE job_id IS NULL 
AND random() < 0.3; -- 30% of reviews get a job reference

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_reviews_company_public ON company_reviews(company_id, is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_reviews_rating ON company_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_company_ratings_average_rating ON company_ratings(average_rating DESC);

-- Create a function to update company ratings when reviews change
CREATE OR REPLACE FUNCTION update_company_ratings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert company_ratings record
    INSERT INTO company_ratings (
        company_id, 
        average_rating, 
        total_reviews, 
        rating_breakdown, 
        category_ratings, 
        last_review_date,
        updated_at
    )
    SELECT 
        NEW.company_id,
        ROUND(AVG(rating)::numeric, 2),
        COUNT(*),
        jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
        ),
        jsonb_build_object(
            'quality', ROUND(AVG((categories->>'quality')::numeric), 1),
            'timeliness', ROUND(AVG((categories->>'timeliness')::numeric), 1),
            'communication', ROUND(AVG((categories->>'communication')::numeric), 1),
            'pricing', ROUND(AVG((categories->>'pricing')::numeric), 1)
        ),
        MAX(created_at),
        NOW()
    FROM company_reviews 
    WHERE company_id = NEW.company_id
    AND is_public = true
    ON CONFLICT (company_id) 
    DO UPDATE SET
        average_rating = EXCLUDED.average_rating,
        total_reviews = EXCLUDED.total_reviews,
        rating_breakdown = EXCLUDED.rating_breakdown,
        category_ratings = EXCLUDED.category_ratings,
        last_review_date = EXCLUDED.last_review_date,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update ratings when reviews change
DROP TRIGGER IF EXISTS trigger_update_company_ratings ON company_reviews;
CREATE TRIGGER trigger_update_company_ratings
    AFTER INSERT OR UPDATE OR DELETE ON company_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_company_ratings();

COMMIT;
