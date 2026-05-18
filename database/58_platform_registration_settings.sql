-- Platform-wide registration toggles (admin-controlled holds per role)

CREATE TABLE IF NOT EXISTS platform_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  contractor_registration_enabled BOOLEAN NOT NULL DEFAULT true,
  manager_registration_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE platform_settings IS 'Singleton platform configuration (id must be 1)';
COMMENT ON COLUMN platform_settings.contractor_registration_enabled IS 'When false, new contractor signups are blocked';
COMMENT ON COLUMN platform_settings.manager_registration_enabled IS 'When false, new manager signups are blocked';

INSERT INTO platform_settings (id, contractor_registration_enabled, manager_registration_enabled)
VALUES (1, true, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read platform settings" ON platform_settings;
CREATE POLICY "Anyone can read platform settings" ON platform_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Platform admins update platform settings" ON platform_settings;
CREATE POLICY "Platform admins update platform settings" ON platform_settings
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
