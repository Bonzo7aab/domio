-- OPD-70: Multiple manager comments per contest question

CREATE TABLE IF NOT EXISTS question_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_comments_question
  ON question_comments(question_id, created_at);

ALTER TABLE question_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view comments on manageable contest questions" ON question_comments;
CREATE POLICY "Managers can view comments on manageable contest questions" ON question_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_comments.question_id
        AND q.tender_id IS NOT NULL
        AND user_can_manage_contest_tender(q.tender_id)
    )
  );

DROP POLICY IF EXISTS "Managers can insert comments on manageable contest questions" ON question_comments;
CREATE POLICY "Managers can insert comments on manageable contest questions" ON question_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = question_comments.question_id
        AND q.tender_id IS NOT NULL
        AND user_can_manage_contest_tender(q.tender_id)
    )
  );

-- Backfill legacy single-answer rows into comments
INSERT INTO question_comments (question_id, author_id, body, created_at)
SELECT
  q.id,
  COALESCE(
    q.answered_by,
    (SELECT t.manager_id FROM tenders t WHERE t.id = q.tender_id LIMIT 1)
  ),
  q.answer,
  q.answered_at
FROM questions q
WHERE q.answer IS NOT NULL
  AND q.answered_at IS NOT NULL
  AND TRIM(q.answer) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM question_comments qc WHERE qc.question_id = q.id
  );

CREATE OR REPLACE FUNCTION add_contest_question_comment(p_question_id UUID, p_body TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tender_id UUID;
  v_comment_id UUID;
  v_trimmed TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_trimmed := TRIM(COALESCE(p_body, ''));
  IF v_trimmed = '' THEN
    RAISE EXCEPTION 'Comment required';
  END IF;

  SELECT q.tender_id INTO v_tender_id
  FROM questions q
  WHERE q.id = p_question_id AND q.tender_id IS NOT NULL;

  IF v_tender_id IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  IF NOT user_can_manage_contest_tender(v_tender_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO question_comments (question_id, author_id, body)
  VALUES (p_question_id, auth.uid(), v_trimmed)
  RETURNING id INTO v_comment_id;

  UPDATE questions
  SET
    answer = CASE WHEN answered_at IS NULL THEN v_trimmed ELSE answer END,
    answered_by = CASE WHEN answered_at IS NULL THEN auth.uid() ELSE answered_by END,
    answered_at = COALESCE(answered_at, NOW()),
    updated_at = NOW()
  WHERE id = p_question_id;

  RETURN v_comment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION add_contest_question_comment(UUID, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS list_contest_questions_contractor(UUID);
DROP FUNCTION IF EXISTS list_contest_questions_manager(UUID);

-- Contractor: published threads with comment list (manager comments only)
CREATE OR REPLACE FUNCTION list_contest_questions_contractor(p_tender_id UUID)
RETURNS TABLE (
  id UUID,
  question TEXT,
  created_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  comments JSONB
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
  SELECT
    q.id,
    q.question,
    q.created_at,
    q.answered_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', qc.id,
            'body', qc.body,
            'created_at', qc.created_at
          )
          ORDER BY qc.created_at ASC
        )
        FROM question_comments qc
        WHERE qc.question_id = q.id
      ),
      '[]'::JSONB
    ) AS comments
  FROM questions q
  WHERE q.tender_id = p_tender_id
    AND q.answered_at IS NOT NULL
  ORDER BY q.answered_at ASC;
END;
$$;

-- Manager: all questions with comments and asker identity
CREATE OR REPLACE FUNCTION list_contest_questions_manager(p_tender_id UUID)
RETURNS TABLE (
  id UUID,
  question TEXT,
  created_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  asker_id UUID,
  asker_display_name TEXT,
  company_name TEXT,
  comments JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT user_can_manage_contest_tender(p_tender_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.question,
    q.created_at,
    q.answered_at,
    q.asker_id,
    TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, ''))::TEXT AS asker_display_name,
    c.name::TEXT AS company_name,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', qc.id,
            'body', qc.body,
            'created_at', qc.created_at,
            'author_id', qc.author_id,
            'author_display_name', TRIM(COALESCE(ap.first_name, '') || ' ' || COALESCE(ap.last_name, ''))
          )
          ORDER BY qc.created_at ASC
        )
        FROM question_comments qc
        JOIN user_profiles ap ON ap.id = qc.author_id
        WHERE qc.question_id = q.id
      ),
      '[]'::JSONB
    ) AS comments
  FROM questions q
  JOIN user_profiles up ON up.id = q.asker_id
  LEFT JOIN user_companies uc ON uc.user_id = q.asker_id AND uc.is_primary = TRUE
  LEFT JOIN companies c ON c.id = uc.company_id
  WHERE q.tender_id = p_tender_id
  ORDER BY q.created_at ASC;
END;
$$;

-- Keep answer_contest_question as alias for first comment
CREATE OR REPLACE FUNCTION answer_contest_question(p_question_id UUID, p_answer TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN add_contest_question_comment(p_question_id, p_answer);
END;
$$;
