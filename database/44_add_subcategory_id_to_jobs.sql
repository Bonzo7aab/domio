-- =============================================
-- ADD SUBCATEGORY_ID TO JOBS TABLE AND REMOVE SUBCATEGORY TEXT FIELD
-- =============================================
-- This migration adds a subcategory_id field to the jobs table,
-- populates it based on the current category_id relationship,
-- and removes the unused subcategory text field

DO $$
BEGIN
    -- Check if subcategory_id column exists, if not create it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'subcategory_id'
    ) THEN
        -- Add subcategory_id column
        ALTER TABLE jobs 
        ADD COLUMN subcategory_id UUID REFERENCES job_categories(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added subcategory_id column to jobs table';
    ELSE
        RAISE NOTICE 'subcategory_id column already exists in jobs table';
    END IF;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_jobs_subcategory_id ON jobs(subcategory_id);
    
    RAISE NOTICE 'Created index on subcategory_id';
END $$;

-- =============================================
-- POPULATE SUBCATEGORY_ID FIELD
-- =============================================
-- Update jobs where category_id points to a subcategory
-- (i.e., the category has a parent_id)
-- Note: We migrate data from subcategory text field before dropping it

DO $$
DECLARE
    updated_count INTEGER;
    jobs_with_subcategory INTEGER;
    jobs_with_main_category INTEGER;
BEGIN
    -- Count jobs that need updating
    SELECT COUNT(*) INTO jobs_with_subcategory
    FROM jobs j
    INNER JOIN job_categories c ON j.category_id = c.id
    WHERE c.parent_id IS NOT NULL;
    
    SELECT COUNT(*) INTO jobs_with_main_category
    FROM jobs j
    INNER JOIN job_categories c ON j.category_id = c.id
    WHERE c.parent_id IS NULL;
    
    RAISE NOTICE 'Found % jobs with subcategory as category_id', jobs_with_subcategory;
    RAISE NOTICE 'Found % jobs with main category as category_id', jobs_with_main_category;
    
    -- Update jobs where category_id is already a subcategory
    -- Set subcategory_id to the same value
    UPDATE jobs j
    SET subcategory_id = j.category_id
    FROM job_categories c
    WHERE j.category_id = c.id
    AND c.parent_id IS NOT NULL
    AND j.subcategory_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % jobs where category_id was a subcategory', updated_count;
    
    -- For jobs where category_id points to a main category,
    -- try to find a matching subcategory based on the existing subcategory text field
    -- This helps populate subcategory_id for jobs that have subcategory text but not subcategory_id
    -- Only do this if the subcategory column still exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'subcategory'
    ) THEN
        UPDATE jobs j
        SET subcategory_id = sc.id
        FROM job_categories mc
        INNER JOIN job_categories sc ON sc.parent_id = mc.id
        WHERE j.category_id = mc.id
        AND mc.parent_id IS NULL
        AND j.subcategory_id IS NULL
        AND j.subcategory IS NOT NULL
        AND (
            -- Match by subcategory name (case-insensitive)
            LOWER(TRIM(j.subcategory)) = LOWER(TRIM(sc.name))
            OR
            -- Match by partial name (if subcategory text contains category name)
            LOWER(TRIM(j.subcategory)) LIKE '%' || LOWER(TRIM(sc.name)) || '%'
            OR
            -- Match by slug (if subcategory text matches slug)
            LOWER(TRIM(j.subcategory)) = LOWER(TRIM(sc.slug))
        );
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        IF updated_count > 0 THEN
            RAISE NOTICE 'Updated % jobs by matching subcategory text to subcategory records', updated_count;
        END IF;
    END IF;
    
    RAISE NOTICE 'Subcategory migration completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating subcategories: %', SQLERRM;
END $$;

-- =============================================
-- REMOVE SUBCATEGORY TEXT COLUMN
-- =============================================
-- Drop the unused subcategory text field after migration is complete

DO $$
BEGIN
    -- Check if subcategory column exists, if yes remove it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'subcategory'
    ) THEN
        -- Drop the subcategory column
        ALTER TABLE jobs 
        DROP COLUMN subcategory;
        
        RAISE NOTICE 'Removed subcategory text column from jobs table';
    ELSE
        RAISE NOTICE 'subcategory column does not exist in jobs table (already removed)';
    END IF;
END $$;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Show summary of subcategory distribution

SELECT 
    CASE 
        WHEN j.subcategory_id IS NOT NULL THEN 'Has subcategory_id'
        WHEN c.parent_id IS NOT NULL THEN 'category_id is subcategory (no subcategory_id set)'
        ELSE 'Main category only'
    END as subcategory_status,
    COUNT(*) as job_count,
    COUNT(DISTINCT j.subcategory_id) as unique_subcategories
FROM jobs j
LEFT JOIN job_categories c ON j.category_id = c.id
GROUP BY 
    CASE 
        WHEN j.subcategory_id IS NOT NULL THEN 'Has subcategory_id'
        WHEN c.parent_id IS NOT NULL THEN 'category_id is subcategory (no subcategory_id set)'
        ELSE 'Main category only'
    END
ORDER BY job_count DESC;

-- Show jobs with subcategory details
SELECT 
    j.id,
    j.title,
    mc.name as main_category,
    sc.name as subcategory_name,
    CASE 
        WHEN j.subcategory_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as has_subcategory_id
FROM jobs j
INNER JOIN job_categories c ON j.category_id = c.id
LEFT JOIN job_categories mc ON c.parent_id = mc.id OR (c.parent_id IS NULL AND mc.id = c.id)
LEFT JOIN job_categories sc ON j.subcategory_id = sc.id
WHERE j.subcategory_id IS NOT NULL OR c.parent_id IS NOT NULL
ORDER BY mc.name, sc.name
LIMIT 20;
