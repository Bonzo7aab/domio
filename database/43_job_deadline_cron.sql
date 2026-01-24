-- =============================================
-- JOB DEADLINE CRON JOB
-- =============================================
-- Automatically update job status to 'inactive' when deadline has passed
-- Runs daily via pg_cron to check and update expired jobs

-- =============================================
-- ENABLE PG_CRON EXTENSION
-- =============================================
-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =============================================
-- ADD 'INACTIVE' STATUS TO JOBS TABLE
-- =============================================
-- Update jobs table constraint to include 'inactive' status
ALTER TABLE jobs 
  DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs 
  ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'inactive'));

-- =============================================
-- CREATE UPDATE FUNCTION
-- =============================================
-- Function to update active jobs with passed deadlines to 'inactive' status
CREATE OR REPLACE FUNCTION update_expired_jobs_to_inactive()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE jobs
  SET 
    status = 'inactive',
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND deadline IS NOT NULL
    AND deadline < CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SCHEDULE DAILY CRON JOB
-- =============================================
-- Schedule the function to run daily at midnight UTC
-- Cron format: minute hour day month weekday
-- '0 0 * * *' = every day at 00:00 UTC
SELECT cron.schedule(
  'update_expired_jobs_daily',
  '0 0 * * *',
  $$SELECT update_expired_jobs_to_inactive()$$
);
