-- KAN-8: Admin panel — platform role, verification audit, notes, offer/listing moderation, tender paused, notifications enum, RLS, storage

-- =============================================
-- USER PROFILES: platform admin role + verification submitted
-- =============================================
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS platform_role VARCHAR(32) NOT NULL DEFAULT 'user'
    CHECK (platform_role IN ('user', 'platform_admin'));

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN user_profiles.platform_role IS 'platform_admin = Domio operations panel access';
COMMENT ON COLUMN user_profiles.verification_submitted_at IS 'When user submitted documents for manual verification';

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS verification_document_paths JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_profiles.verification_document_paths IS 'Map documentType -> storage path under verification-documents bucket';

-- =============================================
-- IS_ADMIN(): checks JWT uid against profile
-- =============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
      AND up.platform_role = 'platform_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- =============================================
-- VERIFICATION DECISIONS (audit)
-- =============================================
CREATE TABLE IF NOT EXISTS verification_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  decided_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_decisions_subject ON verification_decisions(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_verification_decisions_created ON verification_decisions(created_at DESC);

ALTER TABLE verification_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins manage verification decisions" ON verification_decisions;
CREATE POLICY "Platform admins manage verification decisions" ON verification_decisions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================
-- ADMIN USER NOTES
-- =============================================
CREATE TABLE IF NOT EXISTS admin_user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_user_notes_subject ON admin_user_notes(subject_user_id, created_at DESC);

ALTER TABLE admin_user_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins manage user notes" ON admin_user_notes;
CREATE POLICY "Platform admins manage user notes" ON admin_user_notes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================
-- ADMIN ACTION LOG (audit trail)
-- =============================================
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
  action_type VARCHAR(80) NOT NULL,
  entity_table VARCHAR(80),
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created ON admin_action_logs(created_at DESC);

ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins read action logs" ON admin_action_logs;
CREATE POLICY "Platform admins read action logs" ON admin_action_logs
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Platform admins insert action logs" ON admin_action_logs;
CREATE POLICY "Platform admins insert action logs" ON admin_action_logs
  FOR INSERT WITH CHECK (is_admin());

-- =============================================
-- JOB APPLICATIONS / TENDER BIDS — admin moderation
-- =============================================
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS admin_moderation_status VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (admin_moderation_status IN ('none', 'suspended'));

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS admin_feedback_message TEXT;

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS admin_moderated_at TIMESTAMPTZ;

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS admin_moderated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE tender_bids
  ADD COLUMN IF NOT EXISTS admin_moderation_status VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (admin_moderation_status IN ('none', 'suspended'));

ALTER TABLE tender_bids
  ADD COLUMN IF NOT EXISTS admin_feedback_message TEXT;

ALTER TABLE tender_bids
  ADD COLUMN IF NOT EXISTS admin_moderated_at TIMESTAMPTZ;

ALTER TABLE tender_bids
  ADD COLUMN IF NOT EXISTS admin_moderated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- =============================================
-- TENDERS — paused status (admin / manager suspend)
-- =============================================
ALTER TABLE tenders DROP CONSTRAINT IF EXISTS tenders_status_check;

ALTER TABLE tenders
  ADD CONSTRAINT tenders_status_check CHECK (status IN (
    'draft', 'active', 'paused', 'evaluation', 'awarded', 'cancelled'
  ));

-- =============================================
-- NOTIFICATION TYPE ENUM — admin moderation
-- =============================================
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_admin_moderation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'listing_admin_paused';

-- =============================================
-- RLS: platform admin policies (additive OR with existing)
-- =============================================

DROP POLICY IF EXISTS "Platform admins full access user_profiles" ON user_profiles;
CREATE POLICY "Platform admins full access user_profiles" ON user_profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Platform admins full access companies" ON companies;
CREATE POLICY "Platform admins full access companies" ON companies
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Platform admins full access user_companies" ON user_companies;
CREATE POLICY "Platform admins full access user_companies" ON user_companies
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Platform admins full access jobs" ON jobs;
CREATE POLICY "Platform admins full access jobs" ON jobs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Platform admins full access tenders" ON tenders;
CREATE POLICY "Platform admins full access tenders" ON tenders
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Platform admins full access job_applications" ON job_applications;
CREATE POLICY "Platform admins full access job_applications" ON job_applications
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Platform admins full access tender_bids" ON tender_bids;
CREATE POLICY "Platform admins full access tender_bids" ON tender_bids
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Platform admins select contractor_account_settings" ON contractor_account_settings;
CREATE POLICY "Platform admins select contractor_account_settings" ON contractor_account_settings
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Platform admins update contractor_account_settings" ON contractor_account_settings;
CREATE POLICY "Platform admins update contractor_account_settings" ON contractor_account_settings
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Platform admins insert notifications" ON notifications;
CREATE POLICY "Platform admins insert notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin());

-- =============================================
-- STORAGE: admins read any verification document
-- =============================================
DROP POLICY IF EXISTS "Platform admins read verification documents" ON storage.objects;
CREATE POLICY "Platform admins read verification documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-documents'
    AND is_admin()
  );
