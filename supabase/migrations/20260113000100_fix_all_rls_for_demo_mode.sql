-- Fix RLS policies for all tables to allow access without Supabase Auth
-- Since we use Clerk for authentication and Demo Mode login, NOT Supabase Auth
-- This allows anon key access for demo users (Patrick/David buttons)

-- =============================================
-- BUILDING TASKS
-- =============================================
DROP POLICY IF EXISTS "Building tasks are viewable by all" ON public.building_tasks;
DROP POLICY IF EXISTS "Building tasks are editable by all" ON public.building_tasks;

CREATE POLICY "Building tasks are viewable by anyone" ON public.building_tasks
  FOR SELECT USING (true);

CREATE POLICY "Building tasks are editable by anyone" ON public.building_tasks
  FOR ALL USING (true);

-- =============================================
-- KANBAN TASKS
-- =============================================
DROP POLICY IF EXISTS "Kanban tasks are viewable by all" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Kanban tasks are editable by all" ON public.kanban_tasks;

CREATE POLICY "Kanban tasks are viewable by anyone" ON public.kanban_tasks
  FOR SELECT USING (true);

CREATE POLICY "Kanban tasks are editable by anyone" ON public.kanban_tasks
  FOR ALL USING (true);

-- =============================================
-- RECURRING TASKS
-- =============================================
DROP POLICY IF EXISTS "Recurring tasks are viewable by all" ON public.recurring_tasks;
DROP POLICY IF EXISTS "Recurring tasks are editable by all" ON public.recurring_tasks;

CREATE POLICY "Recurring tasks are viewable by anyone" ON public.recurring_tasks
  FOR SELECT USING (true);

CREATE POLICY "Recurring tasks are editable by anyone" ON public.recurring_tasks
  FOR ALL USING (true);

-- =============================================
-- COMMENTS
-- =============================================
DROP POLICY IF EXISTS "Comments are viewable by all" ON public.comments;
DROP POLICY IF EXISTS "Comments are editable by all" ON public.comments;

CREATE POLICY "Comments are viewable by anyone" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Comments are editable by anyone" ON public.comments
  FOR ALL USING (true);

-- =============================================
-- NOTIFICATIONS
-- =============================================
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;

CREATE POLICY "Notifications are viewable by anyone" ON public.notifications
  FOR SELECT USING (true);

CREATE POLICY "Notifications are editable by anyone" ON public.notifications
  FOR ALL USING (true);

-- =============================================
-- DROPDOWN OPTIONS
-- =============================================
DROP POLICY IF EXISTS "Dropdown options are viewable by all" ON public.dropdown_options;
DROP POLICY IF EXISTS "Dropdown options are editable by all" ON public.dropdown_options;

CREATE POLICY "Dropdown options are viewable by anyone" ON public.dropdown_options
  FOR SELECT USING (true);

CREATE POLICY "Dropdown options are editable by anyone" ON public.dropdown_options
  FOR ALL USING (true);

-- =============================================
-- WORKFORCE
-- =============================================
DROP POLICY IF EXISTS "Workforce is viewable by all" ON public.workforce;
DROP POLICY IF EXISTS "Workforce is editable by all" ON public.workforce;

CREATE POLICY "Workforce is viewable by anyone" ON public.workforce
  FOR SELECT USING (true);

CREATE POLICY "Workforce is editable by anyone" ON public.workforce
  FOR ALL USING (true);

-- =============================================
-- BUILDING SEQUENCES
-- =============================================
DROP POLICY IF EXISTS "Building sequences are viewable by all" ON public.building_sequences;
DROP POLICY IF EXISTS "Building sequences are editable by all" ON public.building_sequences;

CREATE POLICY "Building sequences are viewable by anyone" ON public.building_sequences
  FOR SELECT USING (true);

CREATE POLICY "Building sequences are editable by anyone" ON public.building_sequences
  FOR ALL USING (true);

-- =============================================
-- OPTIONS
-- =============================================
DROP POLICY IF EXISTS "Options are viewable by all" ON public.options;
DROP POLICY IF EXISTS "Options are editable by all" ON public.options;

CREATE POLICY "Options are viewable by anyone" ON public.options
  FOR SELECT USING (true);

CREATE POLICY "Options are editable by anyone" ON public.options
  FOR ALL USING (true);
