-- OPD-66: Contest offer drafts (mirror of supabase/migrations/20260526120000_opd66_contest_offer_drafts.sql)

ALTER TABLE tender_bids
  DROP CONSTRAINT IF EXISTS tender_bids_status_check;

ALTER TABLE tender_bids
  ADD CONSTRAINT tender_bids_status_check
  CHECK (status IN (
    'draft',
    'submitted',
    'under_review',
    'shortlisted',
    'accepted',
    'rejected',
    'cancelled'
  ));

ALTER TABLE tender_bids
  ADD COLUMN IF NOT EXISTS offer_details JSONB;

CREATE OR REPLACE FUNCTION update_tender_bids_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tenders
  SET bids_count = (
    SELECT COUNT(*)
    FROM tender_bids
    WHERE tender_id = COALESCE(NEW.tender_id, OLD.tender_id)
      AND status NOT IN ('cancelled', 'draft')
  )
  WHERE id = COALESCE(NEW.tender_id, OLD.tender_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tender_bids_one_draft_per_company
  ON tender_bids (tender_id, company_id)
  WHERE status = 'draft';
