-- OPD-56: Contractor account finance, service area, and extended document metadata

ALTER TABLE contractor_account_settings
  ADD COLUMN IF NOT EXISTS bank_account_iban TEXT,
  ADD COLUMN IF NOT EXISTS vat_status TEXT CHECK (vat_status IN ('active_vat', 'vat_exempt')),
  ADD COLUMN IF NOT EXISTS service_area_settings JSONB NOT NULL DEFAULT '{
    "voivodeship": "mazowieckie",
    "scope": "selected_cities",
    "cities": ["Warszawa"],
    "districts": ["Wilanów", "Mokotów"]
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS oc_guarantee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS zus_certificate_path TEXT,
  ADD COLUMN IF NOT EXISTS zus_certificate_issued_at DATE,
  ADD COLUMN IF NOT EXISTS tax_certificate_path TEXT,
  ADD COLUMN IF NOT EXISTS tax_certificate_issued_at DATE,
  ADD COLUMN IF NOT EXISTS professional_qualification_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reference_document_paths JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN contractor_account_settings.bank_account_iban IS 'Polish bank account number (26 digits, without PL prefix)';
COMMENT ON COLUMN contractor_account_settings.vat_status IS 'active_vat = czynny podatnik VAT; vat_exempt = zwolniony z VAT';
COMMENT ON COLUMN contractor_account_settings.service_area_settings IS 'Voivodeship, scope, cities and districts for contractor service area';
COMMENT ON COLUMN contractor_account_settings.oc_guarantee_amount IS 'OC policy guarantee sum in PLN';
COMMENT ON COLUMN contractor_account_settings.professional_qualification_types IS 'Selected professional qualification type slugs (OPD-56 checklist)';
