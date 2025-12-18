-- =============================================
-- UPDATE APPLICATION COUNTS TRIGGERS
-- =============================================
-- Automatically update applications_count and bids_count when
-- applications/bids are created, updated, or deleted

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
-- TENDER BIDS COUNT
-- =============================================

-- Function to update tender bids_count
CREATE OR REPLACE FUNCTION update_tender_bids_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenders 
  SET bids_count = (
    SELECT COUNT(*) 
    FROM tender_bids 
    WHERE tender_id = COALESCE(NEW.tender_id, OLD.tender_id)
    AND status != 'cancelled'  -- Exclude cancelled bids from count
  )
  WHERE id = COALESCE(NEW.tender_id, OLD.tender_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_tender_bids_count_on_insert ON tender_bids;
DROP TRIGGER IF EXISTS update_tender_bids_count_on_update ON tender_bids;
DROP TRIGGER IF EXISTS update_tender_bids_count_on_delete ON tender_bids;

-- Trigger on insert
CREATE TRIGGER update_tender_bids_count_on_insert
  AFTER INSERT ON tender_bids
  FOR EACH ROW 
  EXECUTE FUNCTION update_tender_bids_count();

-- Trigger on update (to handle status changes, e.g., cancelling)
CREATE TRIGGER update_tender_bids_count_on_update
  AFTER UPDATE ON tender_bids
  FOR EACH ROW 
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_tender_bids_count();

-- Trigger on delete
CREATE TRIGGER update_tender_bids_count_on_delete
  AFTER DELETE ON tender_bids
  FOR EACH ROW 
  EXECUTE FUNCTION update_tender_bids_count();

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

UPDATE tenders 
SET bids_count = (
  SELECT COUNT(*) 
  FROM tender_bids 
  WHERE tender_bids.tender_id = tenders.id
  AND status != 'cancelled'
);

