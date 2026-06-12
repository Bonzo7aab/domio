-- Polymorphic bookmarks (local dev parity with supabase/migrations/20260611120000_*)

DO $$
BEGIN
  CREATE TYPE public.bookmark_entity_type AS ENUM ('job', 'tender', 'contest');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE IF EXISTS public.job_bookmarks RENAME TO bookmarks;

ALTER TABLE public.bookmarks RENAME COLUMN job_id TO entity_id;

ALTER TABLE public.bookmarks
  ADD COLUMN IF NOT EXISTS entity_type public.bookmark_entity_type;

UPDATE public.bookmarks
SET entity_type = 'job'
WHERE entity_type IS NULL;

ALTER TABLE public.bookmarks
  ALTER COLUMN entity_type SET NOT NULL;

ALTER TABLE public.bookmarks
  ALTER COLUMN entity_type DROP DEFAULT;

ALTER TABLE public.bookmarks
  DROP CONSTRAINT IF EXISTS job_bookmarks_job_id_fkey;

ALTER TABLE public.bookmarks
  DROP CONSTRAINT IF EXISTS job_bookmarks_job_id_user_id_key;

ALTER TABLE public.bookmarks
  ADD CONSTRAINT bookmarks_user_entity_unique
  UNIQUE (user_id, entity_type, entity_id);

ALTER INDEX IF EXISTS job_bookmarks_pkey RENAME TO bookmarks_pkey;
ALTER INDEX IF EXISTS idx_job_bookmarks_job_id RENAME TO idx_bookmarks_entity_id;
ALTER INDEX IF EXISTS idx_job_bookmarks_user_id RENAME TO idx_bookmarks_user_id;
ALTER INDEX IF EXISTS idx_job_bookmarks_created_at RENAME TO idx_bookmarks_created_at;

CREATE INDEX IF NOT EXISTS idx_bookmarks_entity_type_id
  ON public.bookmarks (entity_type, entity_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own bookmarks" ON public.bookmarks;
CREATE POLICY "Users read own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users insert own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users delete own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (user_id = auth.uid());
