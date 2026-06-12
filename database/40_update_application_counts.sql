-- =============================================
-- UPDATE APPLICATION COUNTS TRIGGERS
-- =============================================
-- Automatically update applications_count and offers_count when
-- applications/offers are created, updated, or deleted

-- =============================================
-- JOB APPLICATIONS COUNT
-- =============================================

-- Function to update job applications_count
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs 
  SET applications_count = (
    SELECT COUNT(*) 
    FROM job_applications 
    WHERE job_id = COALESCE(NEW.job_id, OLD.job_id)
    AND status != 'cancelled'  -- Exclude cancelled applications from count
  )
  WHERE id = COALESCE(NEW.job_id, OLD.job_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_job_app_count_on_insert ON job_applications;
DROP TRIGGER IF EXISTS update_job_app_count_on_update ON job_applications;
DROP TRIGGER IF EXISTS update_job_app_count_on_delete ON job_applications;

-- Trigger on insert
CREATE TRIGGER update_job_app_count_on_insert
  AFTER INSERT ON job_applications
  FOR EACH ROW 
  EXECUTE FUNCTION update_job_applications_count();

-- Trigger on update (to handle status changes, e.g., cancelling)
CREATE TRIGGER update_job_app_count_on_update
  AFTER UPDATE ON job_applications
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_job_applications_count();

-- Trigger on delete
CREATE TRIGGER update_job_app_count_on_delete
  AFTER DELETE ON job_applications
  FOR EACH ROW 
  EXECUTE FUNCTION update_job_applications_count();

-- =============================================
-- CONTEST OFFERS COUNT
-- =============================================

-- Function to update contest offers_count
CREATE OR REPLACE FUNCTION update_contest_offers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contests
  SET offers_count = (
    SELECT COUNT(*)
    FROM contest_offers
    WHERE contest_id = COALESCE(NEW.contest_id, OLD.contest_id)
    AND status NOT IN ('cancelled', 'draft')
  )
  WHERE id = COALESCE(NEW.contest_id, OLD.contest_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_contest_offers_count_on_insert ON contest_offers;
DROP TRIGGER IF EXISTS update_contest_offers_count_on_update ON contest_offers;
DROP TRIGGER IF EXISTS update_contest_offers_count_on_delete ON contest_offers;

-- Trigger on insert
CREATE TRIGGER update_contest_offers_count_on_insert
  AFTER INSERT ON contest_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_offers_count();

-- Trigger on update (to handle status changes, e.g., cancelling or submitting draft)
CREATE TRIGGER update_contest_offers_count_on_update
  AFTER UPDATE ON contest_offers
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.contest_id IS DISTINCT FROM NEW.contest_id)
  EXECUTE FUNCTION update_contest_offers_count();

-- Trigger on delete
CREATE TRIGGER update_contest_offers_count_on_delete
  AFTER DELETE ON contest_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_offers_count();

-- =============================================
-- INITIAL COUNT UPDATE
-- =============================================
-- Update all existing counts to ensure they're accurate

UPDATE jobs 
SET applications_count = (
  SELECT COUNT(*) 
  FROM job_applications 
  WHERE job_applications.job_id = jobs.id
  AND status != 'cancelled'
);

UPDATE contests
SET offers_count = (
  SELECT COUNT(*)
  FROM contest_offers
  WHERE contest_offers.contest_id = contests.id
  AND status NOT IN ('cancelled', 'draft')
);

