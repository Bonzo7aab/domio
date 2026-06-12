-- Bookmarks count is maintained in app code for entity_type = 'job'.

DROP TRIGGER IF EXISTS trigger_update_bookmarks_count_insert ON public.bookmarks;
DROP TRIGGER IF EXISTS trigger_update_bookmarks_count_delete ON public.bookmarks;

DROP FUNCTION IF EXISTS public.update_job_bookmarks_count_on_insert();
DROP FUNCTION IF EXISTS public.update_job_bookmarks_count_on_delete();
