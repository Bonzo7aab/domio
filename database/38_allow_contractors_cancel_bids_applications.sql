-- =============================================
-- ALLOW CONTRACTORS TO CANCEL THEIR OWN BIDS AND APPLICATIONS
-- =============================================
-- This migration adds RLS policies to allow contractors to update their own
-- bids and applications to 'cancelled' status

-- Allow contractors to update their own job applications (for cancellation)
-- This policy allows contractors to update their own applications, but we'll
-- restrict it in the application logic to only allow status changes to 'cancelled'
CREATE POLICY "Contractors can cancel their own applications" ON job_applications
    FOR UPDATE USING (contractor_id = auth.uid());

-- Allow contractors to update their own tender bids (for cancellation)
-- This policy allows contractors to update their own bids, but we'll
-- restrict it in the application logic to only allow status changes to 'cancelled'
CREATE POLICY "Contractors can cancel their own bids" ON tender_bids
    FOR UPDATE USING (contractor_id = auth.uid());

