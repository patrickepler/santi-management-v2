-- Add missing columns to building_tasks
ALTER TABLE public.building_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.building_tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.building_tasks ADD COLUMN IF NOT EXISTS deadline_on_site DATE;
