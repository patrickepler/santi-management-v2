-- Add missing sort_order column to building_tasks
ALTER TABLE building_tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
