-- Contractor account: professional qualifications (uprawnienia zawodowe) scan + validity

ALTER TABLE contractor_account_settings
  ADD COLUMN IF NOT EXISTS professional_qualifications_valid_until DATE,
  ADD COLUMN IF NOT EXISTS professional_qualifications_scan_path TEXT;

COMMENT ON COLUMN contractor_account_settings.professional_qualifications_valid_until IS 'Optional expiry date for professional licence / qualification document';
COMMENT ON COLUMN contractor_account_settings.professional_qualifications_scan_path IS 'Storage path under verification-documents bucket for qualification scan';
