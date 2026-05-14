-- Link jobs to a manager building (nieruchomość) for KAN-9 / KAN-17
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'jobs'
      AND column_name = 'building_id'
  ) THEN
    ALTER TABLE public.jobs
      ADD COLUMN building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_jobs_building_id ON public.jobs(building_id);
    RAISE NOTICE 'Added building_id to jobs';
  ELSE
    RAISE NOTICE 'building_id on jobs already exists';
  END IF;
END $$;
