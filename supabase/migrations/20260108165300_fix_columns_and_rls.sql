-- =============================================
-- FIX COLUMNS AND RLS POLICIES
-- =============================================
-- Migration: 20260108165300_fix_columns_and_rls.sql
-- Description: Add missing columns and fix RLS policies for public access

-- =============================================
-- ADD MISSING COLUMNS
-- =============================================

-- Add est_time to kanban_tasks (frontend is sending this)
ALTER TABLE public.kanban_tasks
ADD COLUMN IF NOT EXISTS est_time TEXT;

-- Add completed_at to kanban_tasks
ALTER TABLE public.kanban_tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Rename recurring_id to recurring_task_id if needed (or add as alias)
-- Note: The frontend uses recurring_task_id but DB has recurring_id
-- We'll add recurring_task_id as a new column to match frontend expectations
ALTER TABLE public.kanban_tasks
ADD COLUMN IF NOT EXISTS recurring_task_id TEXT;

-- =============================================
-- FIX RLS POLICIES - ALLOW PUBLIC ACCESS FOR DEVELOPMENT
-- =============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Profiles are viewable by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Building tasks are viewable by all" ON public.building_tasks;
DROP POLICY IF EXISTS "Building tasks are editable by all" ON public.building_tasks;
DROP POLICY IF EXISTS "Kanban tasks are viewable by all" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Kanban tasks are editable by all" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Recurring tasks are viewable by all" ON public.recurring_tasks;
DROP POLICY IF EXISTS "Recurring tasks are editable by all" ON public.recurring_tasks;
DROP POLICY IF EXISTS "Comments are viewable by all" ON public.comments;
DROP POLICY IF EXISTS "Comments are editable by all" ON public.comments;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Dropdown options are viewable by all" ON public.dropdown_options;
DROP POLICY IF EXISTS "Dropdown options are editable by all" ON public.dropdown_options;
DROP POLICY IF EXISTS "Workforce is viewable by all" ON public.workforce;
DROP POLICY IF EXISTS "Workforce is editable by all" ON public.workforce;
DROP POLICY IF EXISTS "Building sequences are viewable by all" ON public.building_sequences;
DROP POLICY IF EXISTS "Building sequences are editable by all" ON public.building_sequences;
DROP POLICY IF EXISTS "Options are viewable by all" ON public.options;
DROP POLICY IF EXISTS "Options are editable by all" ON public.options;

-- Create new policies that allow public access (for development)
-- Profiles
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write profiles" ON public.profiles FOR ALL USING (true);

-- Building Tasks
CREATE POLICY "Allow public read building_tasks" ON public.building_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public write building_tasks" ON public.building_tasks FOR ALL USING (true);

-- Kanban Tasks
CREATE POLICY "Allow public read kanban_tasks" ON public.kanban_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public write kanban_tasks" ON public.kanban_tasks FOR ALL USING (true);

-- Recurring Tasks
CREATE POLICY "Allow public read recurring_tasks" ON public.recurring_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public write recurring_tasks" ON public.recurring_tasks FOR ALL USING (true);

-- Comments
CREATE POLICY "Allow public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public write comments" ON public.comments FOR ALL USING (true);

-- Notifications
CREATE POLICY "Allow public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public write notifications" ON public.notifications FOR ALL USING (true);

-- Dropdown Options
CREATE POLICY "Allow public read dropdown_options" ON public.dropdown_options FOR SELECT USING (true);
CREATE POLICY "Allow public write dropdown_options" ON public.dropdown_options FOR ALL USING (true);

-- Workforce
CREATE POLICY "Allow public read workforce" ON public.workforce FOR SELECT USING (true);
CREATE POLICY "Allow public write workforce" ON public.workforce FOR ALL USING (true);

-- Building Sequences
CREATE POLICY "Allow public read building_sequences" ON public.building_sequences FOR SELECT USING (true);
CREATE POLICY "Allow public write building_sequences" ON public.building_sequences FOR ALL USING (true);

-- Options
CREATE POLICY "Allow public read options" ON public.options FOR SELECT USING (true);
CREATE POLICY "Allow public write options" ON public.options FOR ALL USING (true);

-- =============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON COLUMN public.kanban_tasks.est_time IS 'Estimated time for the task (format: HH:MM or minutes)';
COMMENT ON COLUMN public.kanban_tasks.completed_at IS 'Timestamp when the task was completed';
COMMENT ON COLUMN public.kanban_tasks.recurring_task_id IS 'Reference to the parent recurring task';
