-- =============================================
-- MANAGER PROFILES EXTENSION
-- =============================================
-- Extends companies table with manager-specific profile data
-- Uses JSONB for flexible data storage while maintaining performance

-- Note: columns like avatar_url, cover_image_url, plan_type, last_active, profile_data, 
-- experience_data, insurance_data, stats_data already exist from contractor_profiles migration
-- If this migration runs before 14_contractor_profiles.sql, add them here

-- Drop existing objects if they exist (for idempotency - allows re-running this migration)
DROP TRIGGER IF EXISTS update_manager_last_active_trigger ON companies;
DROP FUNCTION IF EXISTS update_manager_last_active();
DROP FUNCTION IF EXISTS get_managers_for_browse(text, text, text, text, integer, integer);
DROP VIEW IF EXISTS manager_browse_view;

-- Add manager-specific JSONB columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS manager_data JSONB DEFAULT '{}';
-- Note: stats_data, experience_data already exist from 14_contractor_profiles.sql

-- Add indexes for performance (if not already exist)
CREATE INDEX IF NOT EXISTS idx_companies_plan_type ON companies(plan_type);
CREATE INDEX IF NOT EXISTS idx_companies_last_active ON companies(last_active);
CREATE INDEX IF NOT EXISTS idx_companies_manager_data ON companies USING GIN(manager_data);
CREATE INDEX IF NOT EXISTS idx_companies_stats_data ON companies USING GIN(stats_data);
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type) WHERE type IN (
    'property_management', 'housing_association', 'cooperative', 'condo_management', 
    'spółdzielnia', 'wspólnota'
);

-- Create manager browse view for efficient querying
CREATE OR REPLACE VIEW manager_browse_view AS
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
    
    -- Extract manager-specific profile data
    COALESCE((c.manager_data->>'buildings_count')::integer, 0) as buildings_count,
    COALESCE((c.manager_data->>'units_count')::integer, 0) as units_count,
    COALESCE((c.manager_data->>'total_area')::integer, 0) as total_area,
    COALESCE(c.manager_data->>'organization_type', c.type) as organization_type,
    COALESCE(c.manager_data->>'primary_needs', '[]')::jsonb as primary_needs,
    COALESCE(c.manager_data->>'frequent_services', '[]')::jsonb as frequent_services,
    COALESCE(c.manager_data->>'managed_property_types', '[]')::jsonb as managed_property_types,
    
    -- Extract experience data
    COALESCE((c.experience_data->>'years_active')::integer, 0) as years_active,
    COALESCE((c.experience_data->>'published_jobs')::integer, 0) as published_jobs,
    COALESCE((c.experience_data->>'completed_projects')::integer, 0) as completed_projects,
    COALESCE((c.experience_data->>'active_contractors')::integer, 0) as active_contractors,
    
    -- Extract stats data
    COALESCE(c.stats_data->>'average_response_time', '') as average_response_time,
    COALESCE((c.stats_data->>'payment_punctuality')::integer, 0) as payment_punctuality,
    COALESCE((c.stats_data->>'project_completion_rate')::integer, 0) as project_completion_rate,
    COALESCE((c.stats_data->>'contractor_retention_rate')::integer, 0) as contractor_retention_rate,
    
    -- Rating data from company_ratings table (manager-specific categories)
    COALESCE(cr.average_rating, 0) as rating,
    COALESCE(cr.total_reviews, 0) as review_count,
    
    -- Create searchable text for full-text search
    to_tsvector('simple', 
        COALESCE(c.name, '') || ' ' || 
        COALESCE(c.description, '') || ' ' ||
        COALESCE(c.manager_data->>'primary_needs', '') || ' ' ||
        COALESCE(c.manager_data->>'frequent_services', '')
    ) as search_vector

FROM companies c
LEFT JOIN company_ratings cr ON c.id = cr.company_id
WHERE c.type IN ('property_management', 'housing_association', 'cooperative', 
                 'condo_management', 'spółdzielnia', 'wspólnota')
  AND c.is_verified = true;

-- Create function to get managers for browse page
CREATE OR REPLACE FUNCTION get_managers_for_browse(
    city_filter TEXT DEFAULT NULL,
    organization_type_filter TEXT DEFAULT NULL,
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
    buildings_count INTEGER,
    units_count INTEGER,
    total_area INTEGER,
    organization_type TEXT,
    primary_needs JSONB,
    frequent_services JSONB,
    managed_property_types JSONB,
    years_active INTEGER,
    published_jobs INTEGER,
    completed_projects INTEGER,
    active_contractors INTEGER,
    average_response_time TEXT,
    payment_punctuality INTEGER,
    project_completion_rate INTEGER,
    contractor_retention_rate INTEGER,
    rating DECIMAL(3,2),
    review_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mbv.id,
        mbv.name,
        mbv.short_name,
        mbv.city,
        mbv.avatar_url,
        mbv.plan_type,
        mbv.last_active,
        mbv.is_verified,
        mbv.verification_level,
        mbv.founded_year,
        mbv.employee_count,
        mbv.buildings_count,
        mbv.units_count,
        mbv.total_area,
        mbv.organization_type,
        mbv.primary_needs,
        mbv.frequent_services,
        mbv.managed_property_types,
        mbv.years_active,
        mbv.published_jobs,
        mbv.completed_projects,
        mbv.active_contractors,
        mbv.average_response_time,
        mbv.payment_punctuality,
        mbv.project_completion_rate,
        mbv.contractor_retention_rate,
        mbv.rating,
        mbv.review_count
    FROM manager_browse_view mbv
    WHERE 
        (city_filter IS NULL OR mbv.city ILIKE '%' || city_filter || '%')
        AND (organization_type_filter IS NULL OR 
             mbv.organization_type ILIKE '%' || organization_type_filter || '%')
        AND (search_query IS NULL OR 
             mbv.search_vector @@ plainto_tsquery('simple', search_query) OR
             mbv.name ILIKE '%' || search_query || '%')
    ORDER BY 
        CASE WHEN sort_by = 'rating' THEN mbv.rating END DESC,
        CASE WHEN sort_by = 'buildings' THEN mbv.buildings_count END DESC,
        CASE WHEN sort_by = 'units' THEN mbv.units_count END DESC,
        CASE WHEN sort_by = 'experience' THEN mbv.years_active END DESC,
        CASE WHEN sort_by = 'name' THEN mbv.name END ASC,
        mbv.rating DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for the function performance
CREATE INDEX IF NOT EXISTS idx_manager_browse_city ON companies(city) 
WHERE type IN ('property_management', 'housing_association', 'cooperative', 
               'condo_management', 'spółdzielnia', 'wspólnota');
CREATE INDEX IF NOT EXISTS idx_manager_browse_verified ON companies(is_verified) 
WHERE type IN ('property_management', 'housing_association', 'cooperative', 
               'condo_management', 'spółdzielnia', 'wspólnota');
CREATE INDEX IF NOT EXISTS idx_manager_browse_rating ON company_ratings(average_rating);

-- Add trigger to update last_active when company is updated (managers)
CREATE OR REPLACE FUNCTION update_manager_last_active()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type IN ('property_management', 'housing_association', 'cooperative', 
                    'condo_management', 'spółdzielnia', 'wspólnota') THEN
        NEW.last_active = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manager_last_active_trigger
    BEFORE UPDATE ON companies
    FOR EACH ROW
    WHEN (NEW.type IN ('property_management', 'housing_association', 'cooperative', 
                       'condo_management', 'spółdzielnia', 'wspólnota'))
    EXECUTE FUNCTION update_manager_last_active();
