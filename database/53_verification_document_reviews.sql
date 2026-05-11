-- KAN-8 follow-up: per-document admin review annotations
--
-- Lets platform admins approve or reject individual documents on the
-- /admin/verification/{id} page. The state lives as a JSONB map keyed by
-- the document type so we don't need a wide new table; structure is:
--
--   {
--     "company_registration": {
--       "status": "approved" | "rejected",
--       "reason": null | "...",
--       "reviewedAt": "2026-05-10T01:50:00Z",
--       "reviewedBy": "<admin user id>"
--     },
--     ...
--   }
--
-- This is admin-internal context; the user is only notified through the
-- existing overall approve / reject flow. The map is cleared whenever an
-- overall decision is recorded so the next verification cycle starts fresh.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS verification_document_reviews JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_profiles.verification_document_reviews IS
  'Map documentType -> {status, reason, reviewedAt, reviewedBy}; per-document admin annotations. Cleared on overall verification decision.';
