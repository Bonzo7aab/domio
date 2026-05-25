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

-- ---------------------------------------------------------------------------
-- activity_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    is_admin() OR
    user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- storage_quotas
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can manage storage quotas" ON storage_quotas;
CREATE POLICY "System can manage storage quotas" ON storage_quotas
  FOR ALL
  USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ---------------------------------------------------------------------------
-- company_storage_quotas
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can manage company storage quotas" ON company_storage_quotas;
CREATE POLICY "System can manage company storage quotas" ON company_storage_quotas
  FOR ALL
  USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());

-- ---------------------------------------------------------------------------
-- file_processing_queue
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can manage file processing queue" ON file_processing_queue;
CREATE POLICY "System can manage file processing queue" ON file_processing_queue
  FOR ALL
  USING (auth.role() = 'service_role' OR is_admin())
  WITH CHECK (auth.role() = 'service_role' OR is_admin());
