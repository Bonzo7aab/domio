# Schema inventory — table usage and naming

Last updated: 2026-06-13. Cross-reference of SQL schema vs `src/` Supabase queries (`.from('…')`).

For migration order see [README.md](./README.md). **Prod-pending SQL:** [`pending-prod/`](./pending-prod/). For production safety see [`.cursor/rules/supabase-production-safety.mdc`](../.cursor/rules/supabase-production-safety.mdc).

---

## Summary

| Category | Count |
|----------|-------|
| Active tables | 30 |
| Drop-unused migration (pending prod) | [`pending-prod/20260611140000_drop_unused_schema.sql`](./pending-prod/20260611140000_drop_unused_schema.sql) |
| Tenders→contests rename (pending prod) | [`pending-prod/20260612120000_rename_tenders_to_contests.sql`](./pending-prod/20260612120000_rename_tenders_to_contests.sql) — **applied on test**, not prod |

---

## Actively used tables (30)

These tables have `.from()` usage in `src/`:

`user_profiles`, `user_companies`, `companies`, `buildings`, `job_categories`, `jobs`, `contests`, `job_applications`, `contest_offers`, `bookmarks`, `orders`, `company_reviews`, `company_ratings`, `portfolio_projects`, `portfolio_project_images`, `certificates`, `file_uploads`, `conversations`, `messages`, `message_read_status`, `notifications`, `notification_preferences`, `push_subscriptions`, `questions`, `question_comments`, `platform_settings`, `admin_action_logs`, `verification_decisions`, `admin_user_notes`, `contractor_account_settings`

---

## Pending production SQL

Files not in production Supabase migration history live in **[`database/pending-prod/`](./pending-prod/)** (including drop-unused schema, push_subscriptions tracking, and tenders→contests rename).

- **Test:** `push_subscriptions`, `drop_unused_schema`, and `rename_tenders_to_contests` already applied on `vestiqo-test`
- **Prod:** not applied — prod still uses `tenders` / `tender_bids` until you run pending files

See [`pending-prod/README.md`](./pending-prod/README.md) for the full list and workflow.

---

## TypeScript types

[`src/types/database.ts`](../src/types/database.ts) is hand-maintained. Regenerate when convenient: `supabase gen types typescript`.
