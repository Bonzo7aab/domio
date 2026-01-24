-- =============================================
-- DISTRIBUTE JOBS EVENLY ACROSS CATEGORIES AND SUBCATEGORIES
-- =============================================
-- This query distributes jobs evenly across all main categories
-- and their subcategories using a round-robin approach
-- Ensures no single category has all jobs
--
-- Usage: Execute this query to redistribute jobs evenly
-- Note: This will overwrite existing category assignments

DO $$
DECLARE
    updated_count INTEGER;
    total_jobs INTEGER;
    main_categories_count INTEGER;
    main_category_ids UUID[];
    category_index INTEGER;
    jobs_per_category INTEGER;
    remaining_jobs INTEGER;
    rec RECORD;
    subcategory_ids UUID[];
    subcategory_index INTEGER;
    jobs_per_subcategory INTEGER;
    remaining_subcategory_jobs INTEGER;
BEGIN
    -- Count total jobs
    SELECT COUNT(*) INTO total_jobs FROM jobs;
    RAISE NOTICE 'Total jobs to distribute: %', total_jobs;
    
    IF total_jobs = 0 THEN
        RAISE NOTICE 'No jobs to distribute. Exiting.';
        RETURN;
    END IF;
    
    -- Get all active main category IDs ordered by sort_order
    SELECT array_agg(id ORDER BY sort_order) INTO main_category_ids
    FROM job_categories 
    WHERE parent_id IS NULL AND is_active = TRUE;
    
    -- Count available main categories
    main_categories_count := array_length(main_category_ids, 1);
    RAISE NOTICE 'Available main categories: %', main_categories_count;
    
    IF main_categories_count IS NULL OR main_categories_count = 0 THEN
        RAISE EXCEPTION 'No active main categories found';
    END IF;
    
    -- Calculate distribution
    jobs_per_category := total_jobs / main_categories_count;
    remaining_jobs := total_jobs % main_categories_count;
    
    RAISE NOTICE 'Jobs per category: % (with % extra jobs to distribute)', jobs_per_category, remaining_jobs;
    
    -- =============================================
    -- STEP 1: Distribute jobs across main categories
    -- =============================================
    -- Use row_number() with modulo to distribute evenly
    
    WITH numbered_jobs AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY created_at, id) - 1 as row_num
        FROM jobs
    ),
    category_assignments AS (
        SELECT 
            nj.id as job_id,
            main_category_ids[1 + (nj.row_num % main_categories_count)] as assigned_category_id
        FROM numbered_jobs nj
    )
    UPDATE jobs j
    SET category_id = ca.assigned_category_id
    FROM category_assignments ca
    WHERE j.id = ca.job_id;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Assigned main categories to % jobs', updated_count;
    
    -- =============================================
    -- STEP 2: Distribute jobs across subcategories within each main category
    -- =============================================
    
    -- Loop through each main category
    FOR category_index IN 1..main_categories_count LOOP
        DECLARE
            current_main_category_id UUID;
            current_main_category_name VARCHAR;
            jobs_in_category INTEGER;
            subcategory_count INTEGER;
        BEGIN
            current_main_category_id := main_category_ids[category_index];
            
            -- Get category name for logging
            SELECT name INTO current_main_category_name
            FROM job_categories
            WHERE id = current_main_category_id;
            
            -- Get all subcategories for this main category
            SELECT array_agg(id ORDER BY sort_order) INTO subcategory_ids
            FROM job_categories
            WHERE parent_id = current_main_category_id
            AND is_active = TRUE;
            
            -- Count jobs in this category
            SELECT COUNT(*) INTO jobs_in_category
            FROM jobs
            WHERE category_id = current_main_category_id;
            
            -- Count subcategories
            subcategory_count := COALESCE(array_length(subcategory_ids, 1), 0);
            
            RAISE NOTICE 'Processing category: % (% jobs, % subcategories)', 
                current_main_category_name, jobs_in_category, subcategory_count;
            
            -- If no subcategories, set subcategory_id to NULL
            IF subcategory_count = 0 OR subcategory_ids IS NULL THEN
                UPDATE jobs
                SET subcategory_id = NULL
                WHERE category_id = current_main_category_id;
                
                RAISE NOTICE '  No subcategories - set subcategory_id to NULL for % jobs', jobs_in_category;
            ELSE
                -- Calculate distribution within subcategories
                jobs_per_subcategory := jobs_in_category / subcategory_count;
                remaining_subcategory_jobs := jobs_in_category % subcategory_count;
                
                RAISE NOTICE '  Distributing % jobs across % subcategories (% per subcategory, % extra)', 
                    jobs_in_category, subcategory_count, jobs_per_subcategory, remaining_subcategory_jobs;
                
                -- Distribute jobs across subcategories using round-robin
                WITH numbered_jobs_in_category AS (
                    SELECT 
                        id,
                        ROW_NUMBER() OVER (ORDER BY created_at, id) - 1 as row_num
                    FROM jobs
                    WHERE category_id = current_main_category_id
                ),
                subcategory_assignments AS (
                    SELECT 
                        nj.id as job_id,
                        subcategory_ids[1 + (nj.row_num % subcategory_count)] as assigned_subcategory_id
                    FROM numbered_jobs_in_category nj
                )
                UPDATE jobs j
                SET subcategory_id = sa.assigned_subcategory_id
                FROM subcategory_assignments sa
                WHERE j.id = sa.job_id;
                
                GET DIAGNOSTICS updated_count = ROW_COUNT;
                RAISE NOTICE '  Assigned subcategories to % jobs', updated_count;
            END IF;
        END;
    END LOOP;
    
    -- =============================================
    -- STEP 3: Show final distribution
    -- =============================================
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL DISTRIBUTION ===';
    RAISE NOTICE '';
    
    -- Show distribution by main category
    RAISE NOTICE 'Distribution by main category:';
    FOR rec IN 
        SELECT 
            c.name as cat_name,
            COUNT(j.id) as job_count,
            COUNT(j.subcategory_id) as jobs_with_subcategory,
            COUNT(DISTINCT j.subcategory_id) as unique_subcategories,
            ROUND(100.0 * COUNT(j.id) / total_jobs, 2) as percentage
        FROM jobs j
        INNER JOIN job_categories c ON j.category_id = c.id
        WHERE c.parent_id IS NULL AND c.is_active = TRUE
        GROUP BY c.id, c.name, c.sort_order
        ORDER BY c.sort_order
    LOOP
        RAISE NOTICE '  %: % jobs (% percent), % with subcategories, % unique subcategories', 
            rec.cat_name, rec.job_count, rec.percentage, rec.jobs_with_subcategory, rec.unique_subcategories;
    END LOOP;
    
    -- Show distribution by subcategory
    RAISE NOTICE '';
    RAISE NOTICE 'Distribution by subcategory:';
    FOR rec IN 
        SELECT 
            mc.name as main_category,
            sc.name as subcategory,
            COUNT(j.id) as job_count
        FROM jobs j
        INNER JOIN job_categories sc ON j.subcategory_id = sc.id
        INNER JOIN job_categories mc ON sc.parent_id = mc.id
        WHERE sc.is_active = TRUE
        GROUP BY mc.id, mc.name, mc.sort_order, sc.id, sc.name, sc.sort_order
        ORDER BY mc.sort_order, sc.sort_order
    LOOP
        RAISE NOTICE '  % > %: % jobs', rec.main_category, rec.subcategory, rec.job_count;
    END LOOP;
    
    -- Show jobs without subcategories (if any)
    SELECT COUNT(*) INTO updated_count
    FROM jobs j
    INNER JOIN job_categories c ON j.category_id = c.id
    WHERE c.parent_id IS NULL 
    AND c.is_active = TRUE
    AND j.subcategory_id IS NULL
    AND EXISTS (
        SELECT 1 
        FROM job_categories sc 
        WHERE sc.parent_id = c.id 
        AND sc.is_active = TRUE
    );
    
    IF updated_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'WARNING: % jobs have main categories with subcategories but no subcategory_id assigned', updated_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Job distribution completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error distributing jobs: %', SQLERRM;
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
    COUNT(j.id) as job_count,
    ROUND(100.0 * COUNT(j.id) / (SELECT COUNT(*) FROM jobs), 2) as percentage
FROM jobs j
INNER JOIN job_categories sc ON j.subcategory_id = sc.id
INNER JOIN job_categories mc ON sc.parent_id = mc.id
WHERE sc.is_active = TRUE
GROUP BY mc.id, mc.name, mc.sort_order, sc.id, sc.name, sc.sort_order
ORDER BY mc.sort_order, sc.sort_order;

-- Check for any jobs with main categories that have subcategories but no subcategory_id
SELECT 
    c.name as main_category,
    COUNT(j.id) as jobs_without_subcategory,
    COUNT(DISTINCT sc.id) as available_subcategories
FROM jobs j
INNER JOIN job_categories c ON j.category_id = c.id
LEFT JOIN job_categories sc ON sc.parent_id = c.id AND sc.is_active = TRUE
WHERE c.parent_id IS NULL 
AND c.is_active = TRUE
AND j.subcategory_id IS NULL
AND EXISTS (
    SELECT 1 
    FROM job_categories sc2 
    WHERE sc2.parent_id = c.id 
    AND sc2.is_active = TRUE
)
GROUP BY c.id, c.name
ORDER BY c.name;
