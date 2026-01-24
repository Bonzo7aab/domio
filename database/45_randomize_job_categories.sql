-- =============================================
-- RANDOMIZE JOB CATEGORIES AND SUBCATEGORIES
-- =============================================
-- This migration randomly assigns main categories and subcategories to all jobs
-- and fixes jobs that have incorrect categories (Elektryka, Sprzątanie as main categories)

DO $$
DECLARE
    updated_count INTEGER;
    fixed_count INTEGER;
    main_categories_count INTEGER;
    total_jobs INTEGER;
BEGIN
    -- Count total jobs
    SELECT COUNT(*) INTO total_jobs FROM jobs;
    RAISE NOTICE 'Total jobs to update: %', total_jobs;
    
    -- Count available main categories
    SELECT COUNT(*) INTO main_categories_count 
    FROM job_categories 
    WHERE parent_id IS NULL AND is_active = TRUE;
    RAISE NOTICE 'Available main categories: %', main_categories_count;
    
    -- =============================================
    -- STEP 1: Fix jobs with incorrect categories
    -- =============================================
    -- Fix jobs that have "Elektryka" or "Sprzątanie" as category
    -- These should be subcategories, not main categories
    
    -- Fix "Elektryka" - should be "Instalacje elektryczne i oświetlenie" subcategory
    UPDATE jobs j
    SET 
        category_id = (
            SELECT id FROM job_categories 
            WHERE slug = 'instalacje-elektryczne-oswietlenie' 
            AND is_active = TRUE 
            LIMIT 1
        ),
        subcategory_id = (
            SELECT id FROM job_categories 
            WHERE slug = 'instalacje-elektryczne-oswietlenie' 
            AND is_active = TRUE 
            LIMIT 1
        )
    FROM job_categories c
    WHERE j.category_id = c.id
    AND (
        LOWER(c.name) LIKE '%elektryka%'
        OR LOWER(c.slug) LIKE '%elektryka%'
        OR LOWER(c.name) = 'elektryka'
    )
    AND c.parent_id IS NULL; -- Only fix if it's incorrectly set as main category
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    IF fixed_count > 0 THEN
        RAISE NOTICE 'Fixed % jobs with "Elektryka" as incorrect main category', fixed_count;
    END IF;
    
    -- Fix "Sprzątanie" - should be under "Sprzątanie i Utrzymanie Czystości" main category
    -- Assign a random subcategory from that main category
    UPDATE jobs j
    SET 
        category_id = (
            SELECT id FROM job_categories 
            WHERE slug = 'sprzatanie-utrzymanie-czystosci' 
            AND is_active = TRUE 
            LIMIT 1
        ),
        subcategory_id = (
            SELECT sc.id 
            FROM job_categories mc
            INNER JOIN job_categories sc ON sc.parent_id = mc.id
            WHERE mc.slug = 'sprzatanie-utrzymanie-czystosci'
            AND mc.is_active = TRUE
            AND sc.is_active = TRUE
            ORDER BY random()
            LIMIT 1
        )
    FROM job_categories c
    WHERE j.category_id = c.id
    AND (
        (LOWER(c.name) LIKE '%sprzątanie%' OR LOWER(c.name) LIKE '%sprzatanie%')
        AND c.name != 'Sprzątanie i Utrzymanie Czystości' -- Don't fix the correct main category
    )
    AND c.parent_id IS NULL; -- Only fix if it's incorrectly set as main category
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Fixed % jobs with "Sprzątanie" as incorrect main category', updated_count;
        fixed_count := fixed_count + updated_count;
    END IF;
    
    RAISE NOTICE 'Total fixed jobs: %', fixed_count;
    
    RAISE NOTICE 'Category fixes completed. Use 46_randomize_all_job_categories.sql to randomize all jobs.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error randomizing categories: %', SQLERRM;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Show distribution of jobs by main category
SELECT 
    c.name as main_category,
    COUNT(j.id) as job_count,
    COUNT(j.subcategory_id) as jobs_with_subcategory,
    COUNT(DISTINCT j.subcategory_id) as unique_subcategories
FROM jobs j
INNER JOIN job_categories c ON j.category_id = c.id
WHERE c.parent_id IS NULL AND c.is_active = TRUE
GROUP BY c.id, c.name, c.sort_order
ORDER BY c.sort_order;

-- Show distribution of jobs by subcategory
SELECT 
    mc.name as main_category,
    sc.name as subcategory,
    COUNT(j.id) as job_count
FROM jobs j
INNER JOIN job_categories sc ON j.subcategory_id = sc.id
INNER JOIN job_categories mc ON sc.parent_id = mc.id
WHERE sc.is_active = TRUE
GROUP BY mc.id, mc.name, sc.id, sc.name, sc.sort_order
ORDER BY mc.sort_order, sc.sort_order;

-- Check for any remaining incorrect categories
SELECT 
    j.id,
    j.title,
    c.name as current_category,
    c.slug as current_slug,
    CASE 
        WHEN c.parent_id IS NULL THEN 'Main Category'
        ELSE 'Subcategory'
    END as category_type,
    CASE 
        WHEN LOWER(c.name) LIKE '%elektryka%' AND c.parent_id IS NULL THEN 'INCORRECT - Should be subcategory'
        WHEN (LOWER(c.name) LIKE '%sprzątanie%' OR LOWER(c.name) LIKE '%sprzatanie%') 
             AND c.name != 'Sprzątanie i Utrzymanie Czystości' 
             AND c.parent_id IS NULL THEN 'INCORRECT - Should be subcategory'
        ELSE 'OK'
    END as status
FROM jobs j
INNER JOIN job_categories c ON j.category_id = c.id
WHERE (
    (LOWER(c.name) LIKE '%elektryka%' AND c.parent_id IS NULL)
    OR 
    ((LOWER(c.name) LIKE '%sprzątanie%' OR LOWER(c.name) LIKE '%sprzatanie%') 
     AND c.name != 'Sprzątanie i Utrzymanie Czystości' 
     AND c.parent_id IS NULL)
)
LIMIT 10;
