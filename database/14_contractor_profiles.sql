-- =============================================
-- CONTRACTOR PROFILES EXTENSION
-- =============================================
-- Extends companies table with contractor-specific profile data
-- Uses JSONB for flexible data storage while maintaining performance

-- Add contractor profile columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'premium')),
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Add JSONB columns for structured contractor data
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS insurance_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stats_data JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_plan_type ON companies(plan_type);
CREATE INDEX IF NOT EXISTS idx_companies_last_active ON companies(last_active);
CREATE INDEX IF NOT EXISTS idx_companies_profile_data ON companies USING GIN(profile_data);
CREATE INDEX IF NOT EXISTS idx_companies_experience_data ON companies USING GIN(experience_data);

-- Create contractor browse view for efficient querying
CREATE OR REPLACE VIEW contractor_browse_view AS
SELECT 
    c.id,
    c.name,
    c.short_name,
    c.city,
    c.avatar_url,
    c.plan_type,
    c.last_active,
    c.is_verified,
    c.verification_level,
    c.founded_year,
    c.employee_count,
    
    -- Extract profile data
    COALESCE(c.profile_data->>'primary_services', '[]')::jsonb as primary_services,
    COALESCE(c.profile_data->>'specializations', '[]')::jsonb as specializations,
    COALESCE(c.profile_data->>'service_area', '[]')::jsonb as service_area,
    COALESCE(c.profile_data->>'working_hours', '') as working_hours,
    COALESCE(c.profile_data->>'availability_status', 'dostępny') as availability_status,
    COALESCE(c.profile_data->>'next_available', '') as next_available,
    
    -- Extract experience data
    COALESCE((c.experience_data->>'years_in_business')::integer, 0) as years_in_business,
    COALESCE((c.experience_data->>'completed_projects')::integer, 0) as completed_projects,
    COALESCE(c.experience_data->>'certifications', '[]')::jsonb as certifications,
    
    -- Extract pricing data
    COALESCE(c.profile_data->>'hourly_rate_min', '0') as hourly_rate_min,
    COALESCE(c.profile_data->>'hourly_rate_max', '0') as hourly_rate_max,
    COALESCE(c.profile_data->>'price_range', 'Wycena indywidualna') as price_range,
    
    -- Extract insurance data
    COALESCE((c.insurance_data->>'has_oc')::boolean, false) as has_oc,
    COALESCE((c.insurance_data->>'has_ac')::boolean, false) as has_ac,
    COALESCE(c.insurance_data->>'oc_amount', '') as oc_amount,
    COALESCE(c.insurance_data->>'ac_amount', '') as ac_amount,
    
    -- Extract stats data
    COALESCE(c.stats_data->>'response_time', '') as response_time,
    COALESCE((c.stats_data->>'on_time_completion')::integer, 0) as on_time_completion,
    COALESCE((c.stats_data->>'budget_accuracy')::integer, 0) as budget_accuracy,
    COALESCE((c.stats_data->>'rehire_rate')::integer, 0) as rehire_rate,
    
    -- Rating data from company_ratings table
    COALESCE(cr.average_rating, 0) as rating,
    COALESCE(cr.total_reviews, 0) as review_count,
    
    -- Create searchable text for full-text search
    to_tsvector('simple', 
        COALESCE(c.name, '') || ' ' || 
        COALESCE(c.description, '') || ' ' ||
        COALESCE(c.profile_data->>'primary_services', '') || ' ' ||
        COALESCE(c.profile_data->>'specializations', '')
    ) as search_vector

FROM companies c
LEFT JOIN company_ratings cr ON c.id = cr.company_id
WHERE c.type = 'contractor' 
  AND c.is_verified = true;

-- Create function to get contractors for browse page
CREATE OR REPLACE FUNCTION get_contractors_for_browse(
    city_filter TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    search_query TEXT DEFAULT NULL,
    sort_by TEXT DEFAULT 'rating',
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    short_name VARCHAR(100),
    city VARCHAR(100),
    avatar_url TEXT,
    plan_type VARCHAR(20),
    last_active TIMESTAMPTZ,
    is_verified BOOLEAN,
    verification_level VARCHAR(20),
    founded_year INTEGER,
    employee_count VARCHAR(50),
    primary_services JSONB,
    specializations JSONB,
    service_area JSONB,
    working_hours TEXT,
    availability_status TEXT,
    next_available TEXT,
    years_in_business INTEGER,
    completed_projects INTEGER,
    certifications JSONB,
    hourly_rate_min TEXT,
    hourly_rate_max TEXT,
    price_range TEXT,
    has_oc BOOLEAN,
    has_ac BOOLEAN,
    oc_amount TEXT,
    ac_amount TEXT,
    response_time TEXT,
    on_time_completion INTEGER,
    budget_accuracy INTEGER,
    rehire_rate INTEGER,
    rating DECIMAL(3,2),
    review_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cbv.id,
        cbv.name,
        cbv.short_name,
        cbv.city,
        cbv.avatar_url,
        cbv.plan_type,
        cbv.last_active,
        cbv.is_verified,
        cbv.verification_level,
        cbv.founded_year,
        cbv.employee_count,
        cbv.primary_services,
        cbv.specializations,
        cbv.service_area,
        cbv.working_hours,
        cbv.availability_status,
        cbv.next_available,
        cbv.years_in_business,
        cbv.completed_projects,
        cbv.certifications,
        cbv.hourly_rate_min,
        cbv.hourly_rate_max,
        cbv.price_range,
        cbv.has_oc,
        cbv.has_ac,
        cbv.oc_amount,
        cbv.ac_amount,
        cbv.response_time,
        cbv.on_time_completion,
        cbv.budget_accuracy,
        cbv.rehire_rate,
        cbv.rating,
        cbv.review_count
    FROM contractor_browse_view cbv
    WHERE 
        (city_filter IS NULL OR cbv.city ILIKE '%' || city_filter || '%')
        AND (category_filter IS NULL OR 
             cbv.primary_services::text ILIKE '%' || category_filter || '%' OR
             cbv.specializations::text ILIKE '%' || category_filter || '%')
        AND (search_query IS NULL OR 
             cbv.search_vector @@ plainto_tsquery('simple', search_query) OR
             cbv.name ILIKE '%' || search_query || '%')
    ORDER BY 
        CASE 
            WHEN sort_by = 'rating' THEN cbv.rating
            WHEN sort_by = 'jobs' THEN cbv.completed_projects
            WHEN sort_by = 'reviews' THEN cbv.review_count
            WHEN sort_by = 'name' THEN cbv.name
            ELSE cbv.rating
        END DESC,
        cbv.name ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for the function performance
CREATE INDEX IF NOT EXISTS idx_contractor_browse_city ON companies(city) WHERE type = 'contractor';
CREATE INDEX IF NOT EXISTS idx_contractor_browse_verified ON companies(is_verified) WHERE type = 'contractor';
CREATE INDEX IF NOT EXISTS idx_contractor_browse_rating ON company_ratings(average_rating);

-- Add trigger to update last_active when company is updated
CREATE OR REPLACE FUNCTION update_contractor_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contractor_last_active_trigger
    BEFORE UPDATE ON companies
    FOR EACH ROW
    WHEN (NEW.type = 'contractor')
    EXECUTE FUNCTION update_contractor_last_active();
