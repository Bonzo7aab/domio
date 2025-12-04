-- =============================================
-- ADD CANCELLED STATUS TO JOB APPLICATIONS AND TENDER BIDS
-- =============================================
-- This migration adds 'cancelled' status to allow contractors to withdraw their offers
-- while keeping them visible for reference in both contractor and manager views

-- Update job_applications table to include 'cancelled' status
ALTER TABLE job_applications 
  DROP CONSTRAINT IF EXISTS job_applications_status_check;

ALTER TABLE job_applications 
  ADD CONSTRAINT job_applications_status_check 
  CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'cancelled'));

-- Update tender_bids table to include 'cancelled' status
ALTER TABLE tender_bids 
  DROP CONSTRAINT IF EXISTS tender_bids_status_check;

ALTER TABLE tender_bids 
  ADD CONSTRAINT tender_bids_status_check 
  CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'cancelled'));

