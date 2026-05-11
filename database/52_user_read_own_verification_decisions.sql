-- KAN-8 follow-up: allow users to read their own verification decisions
--
-- The base 50_admin_panel_kan8.sql migration only granted SELECT/INSERT on
-- verification_decisions to platform admins (via the is_admin() helper).
-- The user-facing /verification and /account pages need to surface the
-- latest rejection reason and decision timestamp to the subject themselves
-- (so they understand why they were rejected and can resubmit).
--
-- This adds a dedicated SELECT-only policy for the subject. Because RLS
-- ORs SELECT policies, admins keep full access via the existing FOR ALL
-- policy, while subjects can only read rows where they are the subject.

DROP POLICY IF EXISTS "Subjects read own verification decisions" ON verification_decisions;
CREATE POLICY "Subjects read own verification decisions" ON verification_decisions
  FOR SELECT
  USING (subject_user_id = auth.uid());
