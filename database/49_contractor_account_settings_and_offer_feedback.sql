-- Contractor account settings (OC + radar + notification channels)
-- and manager feedback fields for offers.

CREATE TABLE IF NOT EXISTS contractor_account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  oc_valid_until DATE,
  oc_policy_scan_path TEXT,
  notification_channels JSONB NOT NULL DEFAULT '{"email": true, "app": true, "phoneCall": false, "sms": false}'::jsonb,
  radar_settings JSONB NOT NULL DEFAULT '{"enabled": true, "minAmountNet": 1000, "areas": ["Warszawa"]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE contractor_account_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contractor account settings" ON contractor_account_settings;
CREATE POLICY "Users can view own contractor account settings" ON contractor_account_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own contractor account settings" ON contractor_account_settings;
CREATE POLICY "Users can upsert own contractor account settings" ON contractor_account_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_contractor_account_settings_updated_at ON contractor_account_settings;
CREATE TRIGGER update_contractor_account_settings_updated_at
  BEFORE UPDATE ON contractor_account_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS manager_feedback_message TEXT;

ALTER TABLE tender_bids
  ADD COLUMN IF NOT EXISTS manager_feedback_message TEXT;

