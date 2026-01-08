-- Add due_date column to recurring_tasks
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
