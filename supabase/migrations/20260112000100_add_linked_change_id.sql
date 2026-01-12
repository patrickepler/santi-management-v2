-- Add missing linked_change_id column to kanban_tasks
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS linked_change_id TEXT;
