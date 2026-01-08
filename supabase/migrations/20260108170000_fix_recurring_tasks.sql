-- =============================================
-- FIX RECURRING TASKS TABLE
-- =============================================
-- Add missing columns to recurring_tasks that frontend is sending

-- Add missing columns to recurring_tasks
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS expected_arrival DATE;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS building_task_id INTEGER REFERENCES public.building_tasks(id);
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS sc_status TEXT CHECK (sc_status IN ('research', 'researchApproval', 'pendingArrival', 'readyToStart', 'done'));
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS deadline_on_site DATE;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS recurring_task_id TEXT;

-- Add RLS policies for dropdown_options
DROP POLICY IF EXISTS "Allow public read dropdown_options" ON public.dropdown_options;
DROP POLICY IF EXISTS "Allow public write dropdown_options" ON public.dropdown_options;
CREATE POLICY "Allow public read dropdown_options" ON public.dropdown_options FOR SELECT USING (true);
CREATE POLICY "Allow public write dropdown_options" ON public.dropdown_options FOR ALL USING (true);

-- Add RLS policies for notifications
DROP POLICY IF EXISTS "Allow public read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow public write notifications" ON public.notifications;
CREATE POLICY "Allow public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public write notifications" ON public.notifications FOR ALL USING (true);

-- Add RLS policies for comments
DROP POLICY IF EXISTS "Allow public read comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public write comments" ON public.comments;
CREATE POLICY "Allow public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public write comments" ON public.comments FOR ALL USING (true);

-- Add RLS policies for profiles
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public write profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write profiles" ON public.profiles FOR ALL USING (true);
