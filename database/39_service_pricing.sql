-- =============================================
-- SERVICE PRICING FOR CONTRACTORS
-- =============================================
-- Adds service-specific pricing management to contractor profiles
-- Stores pricing data in profile_data JSONB column as service_pricing field

-- Add index for efficient querying of service pricing
CREATE INDEX IF NOT EXISTS idx_companies_service_pricing 
ON companies USING GIN((profile_data->'service_pricing'));

-- Note: The service_pricing field will be stored in profile_data JSONB as:
-- {
--   "service_pricing": {
--     "Service Name": {
--       "type": "hourly" | "fixed" | "range",
--       "min": number (optional),
--       "max": number (optional),
--       "currency": "PLN" (default),
--       "unit": string (optional, e.g., "per m²", "per project")
--     }
--   }
-- }

-- Example structure:
-- {
--   "service_pricing": {
--     "Remonty mieszkań": {
--       "type": "hourly",
--       "min": 120,
--       "max": 180,
--       "currency": "PLN",
--       "unit": "per hour"
--     },
--     "Malowanie": {
--       "type": "fixed",
--       "min": 50,
--       "currency": "PLN",
--       "unit": "per m²"
--     },
--     "Instalacje": {
--       "type": "range",
--       "min": 2000,
--       "max": 5000,
--       "currency": "PLN",
--       "unit": "per project"
--     }
--   }
-- }

