-- Auth hardening: restrict broad "system" write policies.
-- These policies were previously permissive (`WITH CHECK (true)`), which allowed
-- any authenticated user to insert/update rows intended for trusted server flows.

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    is_admin() OR
    user_id = auth.uid()
  );
