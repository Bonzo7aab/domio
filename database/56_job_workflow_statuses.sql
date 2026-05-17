-- KAN-9: manager workflow statuses for jobs (zgłoszenia)
-- Mirrors supabase/migrations/20260517130000_job_workflow_statuses.sql

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

UPDATE public.jobs
SET status = 'collecting_offers'
WHERE status = 'active';

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN (
    'draft',
    'collecting_offers',
    'selecting_offer',
    'in_progress',
    'ready_for_acceptance',
    'completed',
    'paused',
    'cancelled',
    'inactive'
  ));

CREATE OR REPLACE FUNCTION public.update_expired_jobs_to_inactive()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.jobs
  SET
    status = 'inactive',
    updated_at = NOW()
  WHERE
    status IN ('active', 'collecting_offers')
    AND deadline IS NOT NULL
    AND deadline < CURRENT_DATE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
