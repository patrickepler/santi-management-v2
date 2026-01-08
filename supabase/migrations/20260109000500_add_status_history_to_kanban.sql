-- Add status_history column to kanban_tasks
ALTER TABLE public.kanban_tasks ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]';
