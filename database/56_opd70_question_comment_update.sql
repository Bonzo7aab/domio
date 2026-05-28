-- OPD-70: Manager can update own contest question comments (parity with supabase migration)

DROP POLICY IF EXISTS "Managers can update own comments on manageable questions" ON question_comments;
CREATE POLICY "Managers can update own comments on manageable questions" ON question_comments
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_comments.question_id
        AND q.tender_id IS NOT NULL
        AND user_can_manage_contest_tender(q.tender_id)
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_comments.question_id
        AND q.tender_id IS NOT NULL
        AND user_can_manage_contest_tender(q.tender_id)
    )
  );
