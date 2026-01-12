-- Add missing status_column column to kanban_tasks
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS status_column TEXT DEFAULT 'todo';
