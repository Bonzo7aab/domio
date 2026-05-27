-- Fix: companies.name is varchar(255), RPC return type expects text

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
    TRIM(COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, ''))::TEXT AS asker_display_name,
    c.name::TEXT AS company_name
  FROM questions q
  JOIN user_profiles up ON up.id = q.asker_id
  LEFT JOIN user_companies uc ON uc.user_id = q.asker_id AND uc.is_primary = TRUE
  LEFT JOIN companies c ON c.id = uc.company_id
  WHERE q.tender_id = p_tender_id
  ORDER BY q.created_at ASC;
END;
$$;
