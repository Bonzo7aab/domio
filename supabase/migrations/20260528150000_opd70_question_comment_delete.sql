-- Allow managers to delete own contest question comments and sync question publish state

DROP POLICY IF EXISTS "Managers can delete own comments on manageable questions" ON question_comments;
CREATE POLICY "Managers can delete own comments on manageable questions" ON question_comments
  FOR DELETE
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_comments.question_id
        AND q.tender_id IS NOT NULL
        AND user_can_manage_contest_tender(q.tender_id)
    )
  );

CREATE OR REPLACE FUNCTION delete_contest_question_comment(p_comment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question_id UUID;
  v_tender_id UUID;
  v_latest_body TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT qc.question_id, q.tender_id
  INTO v_question_id, v_tender_id
  FROM question_comments qc
  JOIN questions q ON q.id = qc.question_id
  WHERE qc.id = p_comment_id
    AND qc.author_id = auth.uid()
    AND q.tender_id IS NOT NULL;

  IF v_question_id IS NULL THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;

  IF NOT user_can_manage_contest_tender(v_tender_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  DELETE FROM question_comments WHERE id = p_comment_id;

  SELECT qc.body
  INTO v_latest_body
  FROM question_comments qc
  WHERE qc.question_id = v_question_id
  ORDER BY qc.created_at DESC
  LIMIT 1;

  IF v_latest_body IS NULL THEN
    UPDATE questions
    SET
      answer = NULL,
      answered_by = NULL,
      answered_at = NULL,
      updated_at = NOW()
    WHERE id = v_question_id;
  ELSE
    UPDATE questions
    SET
      answer = v_latest_body,
      updated_at = NOW()
    WHERE id = v_question_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_contest_question_comment(UUID) TO authenticated;
