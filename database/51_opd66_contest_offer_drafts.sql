-- OPD-66: Contest offer drafts (mirror of supabase/migrations/20260526120000_opd66_contest_offer_drafts.sql)

ALTER TABLE contest_offers
  DROP CONSTRAINT IF EXISTS contest_offers_status_check;

ALTER TABLE contest_offers
  ADD CONSTRAINT contest_offers_status_check
  CHECK (status IN (
    'draft',
    'submitted',
    'under_review',
    'shortlisted',
    'accepted',
    'rejected',
    'cancelled'
  ));

ALTER TABLE contest_offers
  ADD COLUMN IF NOT EXISTS offer_details JSONB;

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_contest_offers_one_draft_per_company
  ON contest_offers (contest_id, company_id)
  WHERE status = 'draft';
