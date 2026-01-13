-- Migration: 20260113001000_add_kanban_missing_columns.sql
-- Status: APPLIED (columns already existed)
-- 
-- This migration attempted to add the following columns to kanban_tasks:
-- - completed_at TIMESTAMPTZ
-- - status_history JSONB
-- - est_time NUMERIC
-- - actual_time NUMERIC
-- - linked_change_id TEXT
--
-- All columns already existed in the production database.
-- This file is kept for migration history consistency.
-- No action needed - schema is correct.

SELECT 1; -- No-op statement to satisfy migration requirements
