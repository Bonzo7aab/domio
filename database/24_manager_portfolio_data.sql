-- =============================================
-- MANAGER PORTFOLIO DATA
-- =============================================
-- Adds portfolio_data column to companies table and populates it with
-- managed buildings information for property managers

-- Add portfolio_data column if it doesn't exist
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS portfolio_data JSONB DEFAULT '{}';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_companies_portfolio_data ON companies USING GIN(portfolio_data);

-- Function to generate portfolio data for managers
CREATE OR REPLACE FUNCTION create_manager_portfolio_data()
RETURNS VOID AS $$
DECLARE
    manager_record RECORD;
    managed_buildings JSONB;
    property_count INTEGER;
    avg_units_per_building INTEGER;
    buildings_per_property INTEGER;
    units_per_property INTEGER;
    building_types TEXT[] := ARRAY['Bloki mieszkalne', 'Osiedle', 'Kompleks', 'Kwartał Mieszkaniowy'];
    districts TEXT[] := ARRAY['Mokotów', 'Śródmieście', 'Żoliborz', 'Praga', 'Wilanów', 'Ursynów'];
    property_names TEXT[] := ARRAY['Osiedle', 'Kompleks', 'Kwartał', 'Zespół'];
    building_i INTEGER;
    current_building JSONB;
BEGIN
    -- Loop through all managers
    FOR manager_record IN 
        SELECT 
            id,
            name,
            city,
            manager_data,
            experience_data
        FROM companies 
        WHERE type IN ('property_management', 'housing_association', 'cooperative', 
                      'condo_management', 'spółdzielnia', 'wspólnota')
    LOOP
        -- Extract data from manager_data
        DECLARE
            buildings_count INTEGER := COALESCE((manager_record.manager_data->>'buildings_count')::integer, 0);
            units_count INTEGER := COALESCE((manager_record.manager_data->>'units_count')::integer, 0);
            org_type TEXT := COALESCE(manager_record.manager_data->>'organization_type', 'wspólnota');
            years_active INTEGER := COALESCE((manager_record.experience_data->>'years_active')::integer, 0);
            city_name TEXT := manager_record.city;
        BEGIN
            -- If manager has buildings, create portfolio data
            IF buildings_count > 0 THEN
                -- Generate 2-4 properties based on buildings count
                property_count := LEAST(4, GREATEST(2, FLOOR(buildings_count / 2)));
                avg_units_per_building := FLOOR(units_count / buildings_count);
                
                managed_buildings := '[]'::jsonb;
                
                -- Generate sample buildings based on stats
                FOR building_i IN 1..property_count LOOP
                    buildings_per_property := CEIL(buildings_count / property_count);
                    units_per_property := buildings_per_property * avg_units_per_building;
                    
                    current_building := jsonb_build_object(
                        'id', building_i::text,
                        'name', (property_names[(building_i % array_length(property_names, 1)) + 1] || ' ' || 
                               CASE building_i 
                                   WHEN 1 THEN 'I'
                                   WHEN 2 THEN 'II'
                                   WHEN 3 THEN 'III'
                                   WHEN 4 THEN 'IV'
                                   ELSE building_i::text
                               END),
                        'type', building_types[(building_i % array_length(building_types, 1)) + 1],
                        'address', COALESCE(city_name, 'Warszawa') || ', ' || 
                                  districts[(building_i % array_length(districts, 1)) + 1],
                        'unitsCount', units_per_property,
                        'yearBuilt', 2024 - years_active - building_i,
                        'images', ARRAY[
                            'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=400&h=300&fit=crop',
                            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
                            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
                            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop'
                        ]::text[],
                        'recentProjects', ARRAY[
                            'Termomodernizacja budynku',
                            'Remont klatek schodowych',
                            'Modernizacja instalacji'
                        ]::text[]
                    );
                    
                    managed_buildings := managed_buildings || current_building::jsonb;
                END LOOP;
                
                -- Update the company with portfolio data
                UPDATE companies 
                SET portfolio_data = jsonb_build_object(
                    'images', '[]'::jsonb,
                    'managedBuildings', managed_buildings
                )
                WHERE id = manager_record.id;
            ELSE
                -- Create empty portfolio structure
                UPDATE companies 
                SET portfolio_data = jsonb_build_object(
                    'images', '[]'::jsonb,
                    'managedBuildings', '[]'::jsonb
                )
                WHERE id = manager_record.id;
            END IF;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute portfolio data creation
SELECT create_manager_portfolio_data();

-- Drop helper function after use
DROP FUNCTION IF EXISTS create_manager_portfolio_data();

-- Verify portfolio data was created
SELECT 
    c.id,
    c.name,
    c.type,
    jsonb_array_length(c.portfolio_data->'managedBuildings') as buildings_count,
    c.portfolio_data->'managedBuildings' as managed_buildings
FROM companies c
WHERE c.type IN ('property_management', 'housing_association', 'cooperative', 
                'condo_management', 'spółdzielnia', 'wspólnota')
ORDER BY c.name;

