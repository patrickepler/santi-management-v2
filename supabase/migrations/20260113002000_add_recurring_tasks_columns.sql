-- Add missing columns to recurring_tasks table

-- Add archived column for tracking archived recurring tasks
ALTER TABLE public.recurring_tasks 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add est_time column for estimated time in hours
ALTER TABLE public.recurring_tasks 
ADD COLUMN IF NOT EXISTS est_time NUMERIC;

-- Add due_date column
ALTER TABLE public.recurring_tasks 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add status column for active/paused/archived
ALTER TABLE public.recurring_tasks 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
