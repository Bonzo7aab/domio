-- OPD-70: Manager unseen question indicator on Konkursy list

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS manager_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_questions_tender_unseen
  ON questions(tender_id)
  WHERE answered_at IS NULL AND manager_seen_at IS NULL;

CREATE OR REPLACE FUNCTION count_unseen_contest_questions(p_tender_ids UUID[])
RETURNS TABLE (tender_id UUID, unseen_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT q.tender_id, COUNT(*)::BIGINT
  FROM questions q
  INNER JOIN tenders t ON t.id = q.tender_id
  WHERE q.tender_id = ANY(p_tender_ids)
    AND t.manager_id = auth.uid()
    AND q.answered_at IS NULL
    AND q.manager_seen_at IS NULL
  GROUP BY q.tender_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_contest_questions_seen(p_tender_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE questions q
  SET manager_seen_at = NOW(), updated_at = NOW()
  FROM tenders t
  WHERE q.tender_id = p_tender_id
    AND q.tender_id = t.id
    AND t.manager_id = auth.uid()
    AND q.manager_seen_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION count_unseen_contest_questions(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_contest_questions_seen(UUID) TO authenticated;
