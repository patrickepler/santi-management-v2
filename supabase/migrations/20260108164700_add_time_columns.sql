-- =============================================
-- ADD TIME COLUMNS MIGRATION
-- =============================================
-- Migration: 20260108164700_add_time_columns.sql
-- Description: Add actual_time to kanban_tasks and est_time to recurring_tasks

-- Add actual_time column to kanban_tasks
-- Stores the actual time spent on a task (in minutes or as TEXT for flexible format like "2:30")
ALTER TABLE public.kanban_tasks
ADD COLUMN IF NOT EXISTS actual_time TEXT;

-- Add est_time column to recurring_tasks  
-- Stores the estimated time for a recurring task (in minutes or as TEXT for flexible format like "1:00")
ALTER TABLE public.recurring_tasks
ADD COLUMN IF NOT EXISTS est_time TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.kanban_tasks.actual_time IS 'Actual time spent on the task (format: HH:MM or minutes)';
COMMENT ON COLUMN public.recurring_tasks.est_time IS 'Estimated time for the recurring task (format: HH:MM or minutes)';
