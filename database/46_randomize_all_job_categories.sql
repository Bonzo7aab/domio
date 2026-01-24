-- =============================================
-- RANDOMIZE ALL JOB CATEGORIES AND SUBCATEGORIES
-- =============================================
-- This query randomly assigns main categories and subcategories to all jobs
-- Run this to redistribute jobs across all available categories
--
-- Usage: Execute this query to randomize job categories
-- Note: This will overwrite existing category assignments

DO $$
DECLARE
    updated_count INTEGER;
    main_categories_count INTEGER;
    total_jobs INTEGER;
BEGIN
    -- Count total jobs
    SELECT COUNT(*) INTO total_jobs FROM jobs;
    RAISE NOTICE 'Total jobs to randomize: %', total_jobs;
    
    -- Count available main categories
    SELECT COUNT(*) INTO main_categories_count 
    FROM job_categories 
    WHERE parent_id IS NULL AND is_active = TRUE;
    RAISE NOTICE 'Available main categories: %', main_categories_count;
    
    -- =============================================
    -- STEP 1: Randomize main categories
    -- =============================================
    -- Assign random main categories to all jobs
    -- Use a method that ensures each job gets a different random category
    
    WITH main_cat_ids AS (
        SELECT array_agg(id ORDER BY id) as cat_ids
        FROM job_categories 
        WHERE parent_id IS NULL 
        AND is_active = TRUE
    )
    UPDATE jobs j
    SET category_id = (
        SELECT cat_ids[1 + floor(random() * array_length(cat_ids, 1))::int]
        FROM main_cat_ids
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Randomized main categories for % jobs', updated_count;
    
    -- =============================================
    -- STEP 2: Randomize subcategories
    -- =============================================
    -- Assign random subcategories based on the main category
    
    WITH job_main_categories AS (
        SELECT 
            j.id as job_id,
            j.category_id as main_category_id
        FROM jobs j
        INNER JOIN job_categories c ON j.category_id = c.id
        WHERE c.parent_id IS NULL AND c.is_active = TRUE
    ),
    random_subcategories AS (
        SELECT 
            jmc.job_id,
            jmc.main_category_id,
            (
                SELECT sc.id
                FROM job_categories sc
                WHERE sc.parent_id = jmc.main_category_id
                AND sc.is_active = TRUE
                ORDER BY random()
                LIMIT 1
            ) as new_subcategory_id
        FROM job_main_categories jmc
    )
    UPDATE jobs j
    SET subcategory_id = rs.new_subcategory_id
    FROM random_subcategories rs
    WHERE j.id = rs.job_id
    AND rs.new_subcategory_id IS NOT NULL; -- Only update if subcategory exists
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Randomized subcategories for % jobs', updated_count;
    
    -- =============================================
    -- STEP 3: Handle jobs with main categories that have no subcategories
    -- =============================================
    -- Set subcategory_id to NULL for jobs where main category has no subcategories
    
    UPDATE jobs j
    SET subcategory_id = NULL
    FROM job_categories c
    WHERE j.category_id = c.id
    AND c.parent_id IS NULL
    AND c.is_active = TRUE
    AND NOT EXISTS (
        SELECT 1 
        FROM job_categories sc 
        WHERE sc.parent_id = c.id 
        AND sc.is_active = TRUE
    )
    AND j.subcategory_id IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Cleared subcategory_id for % jobs with main categories that have no subcategories', updated_count;
    END IF;
    
    -- Show distribution after randomization
    RAISE NOTICE 'Category distribution after randomization:';
    FOR rec IN 
        SELECT 
            c.name as cat_name,
            COUNT(j.id) as job_count
        FROM jobs j
        INNER JOIN job_categories c ON j.category_id = c.id
        WHERE c.parent_id IS NULL AND c.is_active = TRUE
        GROUP BY c.id, c.name, c.sort_order
        ORDER BY c.sort_order
    LOOP
        RAISE NOTICE '  %: % jobs', rec.cat_name, rec.job_count;
    END LOOP;
    
    RAISE NOTICE 'Category randomization completed successfully!';
    
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
    COUNT(DISTINCT j.subcategory_id) as unique_subcategories,
    ROUND(100.0 * COUNT(j.id) / (SELECT COUNT(*) FROM jobs), 2) as percentage
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
