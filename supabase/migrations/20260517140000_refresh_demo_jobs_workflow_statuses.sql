-- Refresh public demo/seed jobs for homepage map (KAN-9 workflow statuses)

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (ORDER BY created_at, id) AS rn
  FROM jobs
  WHERE is_public = true
    AND status IN ('inactive', 'paused', 'active')
)
UPDATE jobs j
SET
  status = (ARRAY[
    'collecting_offers',
    'selecting_offer',
    'in_progress',
    'collecting_offers',
    'selecting_offer'
  ])[1 + ((r.rn - 1) % 5)],
  deadline = CASE
    WHEN j.deadline IS NULL OR j.deadline < CURRENT_DATE THEN CURRENT_DATE + INTERVAL '60 days'
    ELSE j.deadline
  END,
  published_at = COALESCE(j.published_at, NOW()),
  updated_at = NOW()
FROM ranked r
WHERE j.id = r.id;

-- Public jobs missing map coordinates (Warsaw metro area scatter for demo)
UPDATE jobs
SET
  latitude = 52.12 + (random() * 0.08),
  longitude = 20.98 + (random() * 0.14),
  updated_at = NOW()
WHERE is_public = true
  AND latitude IS NULL;

-- Ensure remaining public collecting jobs have a future deadline (avoid cron → inactive)
UPDATE jobs
SET
  deadline = CURRENT_DATE + INTERVAL '90 days',
  updated_at = NOW()
WHERE is_public = true
  AND status IN ('collecting_offers', 'selecting_offer', 'in_progress')
  AND (deadline IS NULL OR deadline < CURRENT_DATE);
