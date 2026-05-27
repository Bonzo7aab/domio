-- OPD-70: Allow any active company member to manage contest Q&A (not only tender.manager_id)

CREATE OR REPLACE FUNCTION user_can_manage_contest_tender(p_tender_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenders t
    WHERE t.id = p_tender_id
      AND (
        t.manager_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM user_companies uc
          WHERE uc.company_id = t.company_id
            AND uc.user_id = auth.uid()
            AND uc.is_active = TRUE
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION user_can_manage_contest_tender(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION list_contest_questions_manager(p_tender_id UUID)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  created_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  asker_id UUID,
  asker_display_name TEXT,
  company_name TEXT
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
    q.answer,
    q.created_at,
    q.answered_at,
    q.asker_id,
    TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')) AS asker_display_name,
    c.name::TEXT AS company_name
  FROM questions q
  JOIN user_profiles up ON up.id = q.asker_id
  LEFT JOIN user_companies uc ON uc.user_id = q.asker_id AND uc.is_primary = TRUE
  LEFT JOIN companies c ON c.id = uc.company_id
  WHERE q.tender_id = p_tender_id
  ORDER BY q.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION answer_contest_question(p_question_id UUID, p_answer TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tender_id UUID;
  v_question_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF TRIM(COALESCE(p_answer, '')) = '' THEN
    RAISE EXCEPTION 'Answer required';
  END IF;

  SELECT q.tender_id, q.id INTO v_tender_id, v_question_id
  FROM questions q
  WHERE q.id = p_question_id AND q.tender_id IS NOT NULL;

  IF v_question_id IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  IF NOT user_can_manage_contest_tender(v_tender_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE questions
  SET
    answer = TRIM(p_answer),
    answered_by = auth.uid(),
    answered_at = NOW(),
    updated_at = NOW()
  WHERE id = p_question_id;

  RETURN p_question_id;
END;
$$;

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
  WHERE q.tender_id = ANY(p_tender_ids)
    AND user_can_manage_contest_tender(q.tender_id)
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

  IF NOT user_can_manage_contest_tender(p_tender_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE questions q
  SET manager_seen_at = NOW(), updated_at = NOW()
  WHERE q.tender_id = p_tender_id
    AND q.manager_seen_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

DROP POLICY IF EXISTS "Managers can view questions on their tenders" ON questions;
CREATE POLICY "Managers can view questions on their tenders" ON questions
  FOR SELECT USING (
    tender_id IS NOT NULL
    AND user_can_manage_contest_tender(tender_id)
  );

DROP POLICY IF EXISTS "Job/tender owners can answer questions" ON questions;
CREATE POLICY "Job/tender owners can answer questions" ON questions
  FOR UPDATE USING (
    answered_by = auth.uid()
    OR (
      tender_id IS NOT NULL
      AND user_can_manage_contest_tender(tender_id)
    )
    OR (
      job_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = questions.job_id AND j.manager_id = auth.uid()
      )
    )
  );
