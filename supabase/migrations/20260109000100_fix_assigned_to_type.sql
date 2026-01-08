-- =============================================
-- FIX ASSIGNED_TO COLUMN TYPE
-- =============================================
-- Change assigned_to from UUID to TEXT since frontend uses simple IDs

-- First drop the foreign key constraints
ALTER TABLE public.kanban_tasks DROP CONSTRAINT IF EXISTS kanban_tasks_assigned_to_fkey;
ALTER TABLE public.recurring_tasks DROP CONSTRAINT IF EXISTS recurring_tasks_assigned_to_fkey;

-- Change column type from UUID to TEXT
ALTER TABLE public.kanban_tasks ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;
ALTER TABLE public.recurring_tasks ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;

-- Add missing columns to recurring_tasks
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS expected_arrival DATE;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS building_task_id INTEGER;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS sc_status TEXT;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS deadline_on_site DATE;
ALTER TABLE public.recurring_tasks ADD COLUMN IF NOT EXISTS recurring_task_id TEXT;

-- Make sure RLS is enabled with public access for all tables
DO $$
BEGIN
    -- Enable RLS on all tables
    ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.building_tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.workforce ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.building_sequences ENABLE ROW LEVEL SECURITY;
END $$;

-- Drop and recreate policies for kanban_tasks
DROP POLICY IF EXISTS "Allow public read kanban_tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Allow public write kanban_tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Allow public insert kanban_tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Allow public update kanban_tasks" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Allow public delete kanban_tasks" ON public.kanban_tasks;
CREATE POLICY "Allow public select kanban_tasks" ON public.kanban_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert kanban_tasks" ON public.kanban_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update kanban_tasks" ON public.kanban_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete kanban_tasks" ON public.kanban_tasks FOR DELETE USING (true);

-- Drop and recreate policies for recurring_tasks
DROP POLICY IF EXISTS "Allow public read recurring_tasks" ON public.recurring_tasks;
DROP POLICY IF EXISTS "Allow public write recurring_tasks" ON public.recurring_tasks;
DROP POLICY IF EXISTS "Allow public insert recurring_tasks" ON public.recurring_tasks;
DROP POLICY IF EXISTS "Allow public update recurring_tasks" ON public.recurring_tasks;
DROP POLICY IF EXISTS "Allow public delete recurring_tasks" ON public.recurring_tasks;
CREATE POLICY "Allow public select recurring_tasks" ON public.recurring_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert recurring_tasks" ON public.recurring_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update recurring_tasks" ON public.recurring_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete recurring_tasks" ON public.recurring_tasks FOR DELETE USING (true);
