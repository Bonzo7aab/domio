-- OPD-70: Allow loading published contest Q&A before session is ready (public read, no asker data)

CREATE OR REPLACE FUNCTION list_contest_questions_contractor(p_tender_id UUID)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  created_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tenders t WHERE t.id = p_tender_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT q.id, q.question, q.answer, q.created_at, q.answered_at
  FROM questions q
  WHERE q.tender_id = p_tender_id
    AND q.answered_at IS NOT NULL
    AND q.answer IS NOT NULL
  ORDER BY q.answered_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION list_contest_questions_contractor(UUID) TO anon, authenticated;
