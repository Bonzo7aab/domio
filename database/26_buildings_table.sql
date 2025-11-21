-- =============================================
-- DOMIO PLATFORM - BUILDINGS TABLE
-- =============================================
-- Buildings managed by property management companies

-- Buildings table
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    country VARCHAR(2) DEFAULT 'PL',
    building_type VARCHAR(50), -- 'residential', 'commercial', 'mixed', 'office', 'industrial'
    year_built INTEGER,
    units_count INTEGER,
    floors_count INTEGER,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_buildings_company_id ON buildings(company_id);
CREATE INDEX idx_buildings_city ON buildings(city);
CREATE INDEX idx_buildings_coordinates ON buildings(latitude, longitude);
CREATE INDEX idx_buildings_type ON buildings(building_type);

-- Enable Row Level Security
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buildings

-- Users can view buildings for companies they're associated with
CREATE POLICY "Users can view company buildings" ON buildings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
        )
    );

-- Public buildings can be viewed by authenticated users (for job postings, etc.)
CREATE POLICY "Authenticated users can view public buildings" ON buildings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert buildings for companies they own or manage
CREATE POLICY "Users can insert company buildings" ON buildings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can update buildings for companies they own or manage
CREATE POLICY "Users can update company buildings" ON buildings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can delete buildings for companies they own or manage
CREATE POLICY "Users can delete company buildings" ON buildings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Trigger for updated_at timestamp
CREATE TRIGGER update_buildings_updated_at 
    BEFORE UPDATE ON buildings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

