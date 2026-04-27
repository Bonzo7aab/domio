-- Unified zgłoszenie workflow replacing the separate job/tender status flow.

ALTER TABLE jobs
  DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs
  ADD CONSTRAINT jobs_status_check CHECK (status IN (
    'draft',
    'active',
    'collecting_offers',
    'choosing_offer',
    'in_progress',
    'ready_for_acceptance',
    'completed',
    'cancelled',
    'paused',
    'inactive'
  ));

UPDATE jobs
SET status = 'collecting_offers'
WHERE status = 'active';
