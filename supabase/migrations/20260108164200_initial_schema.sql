-- =============================================
-- SANTI MANAGEMENT - INITIAL MIGRATION
-- =============================================
-- Migration: 20260108164200_initial_schema.sql
-- Description: Create all tables, RLS policies, triggers, and seed data

-- =============================================
-- TABLES
-- =============================================

-- 1. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'worker' CHECK (role IN ('worker', 'procurement', 'manager')),
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUILDING TASKS (Construction Sequence)
CREATE TABLE IF NOT EXISTS public.building_tasks (
  id SERIAL PRIMARY KEY,
  "order" INTEGER DEFAULT 1,
  villa TEXT NOT NULL,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  task TEXT,
  step TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Ready to start (Supply Chain confirmed on-site)',
  expected_arrival DATE,
  earliest_start DATE,
  skilled_workers TEXT[] DEFAULT '{}',
  unskilled_workers TEXT[] DEFAULT '{}',
  duration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KANBAN TASKS
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  "column" TEXT DEFAULT 'later' CHECK ("column" IN ('today', 'thisWeek', 'waiting', 'review', 'later', 'done')),
  "order" INTEGER DEFAULT 0,
  due_date DATE,
  type TEXT DEFAULT 'manual' CHECK (type IN ('manual', 'sc', 'recurring')),
  building_task_id INTEGER REFERENCES public.building_tasks(id),
  sc_status TEXT CHECK (sc_status IN ('research', 'researchApproval', 'pendingArrival', 'readyToStart', 'done')),
  deadline_on_site DATE,
  expected_arrival DATE,
  recurring_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RECURRING TASKS
CREATE TABLE IF NOT EXISTS public.recurring_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'specific')),
  days TEXT[] DEFAULT '{}',
  specific_dates DATE[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES public.building_tasks(id) ON DELETE CASCADE,
  kanban_task_id TEXT REFERENCES public.kanban_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  text TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.profiles(id),
  type TEXT DEFAULT 'mention',
  task_id INTEGER REFERENCES public.building_tasks(id),
  kanban_task_id TEXT REFERENCES public.kanban_tasks(id),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DROPDOWN OPTIONS (configurable)
CREATE TABLE IF NOT EXISTS public.dropdown_options (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  parent_category TEXT,
  value TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WORKFORCE (Workers with rates & debt tracking)
CREATE TABLE IF NOT EXISTS public.workforce (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'skilled' CHECK (type IN ('skilled', 'unskilled')),
  hourly_rate DECIMAL(10,2) DEFAULT 100,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  debt DECIMAL(10,2) DEFAULT 0,
  debt_description TEXT,
  repayment_frequency TEXT DEFAULT 'none' CHECK (repayment_frequency IN ('none', 'daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BUILDING SEQUENCES (JSON config for project structure)
CREATE TABLE IF NOT EXISTS public.building_sequences (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{"standalone": [], "commons": {"label": "Commons / Infrastructure", "zones": []}}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. OPTIONS (Key-Value store for app settings)
CREATE TABLE IF NOT EXISTS public.options (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_building_tasks_villa ON public.building_tasks(villa);
CREATE INDEX IF NOT EXISTS idx_building_tasks_status ON public.building_tasks(status);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_column ON public.kanban_tasks("column");
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assigned_to ON public.kanban_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_kanban_task_id ON public.comments(kanban_task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dropdown_options_category ON public.dropdown_options(category);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
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

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by all authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Building Tasks: All authenticated users can CRUD
CREATE POLICY "Building tasks are viewable by all" ON public.building_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Building tasks are editable by all" ON public.building_tasks
  FOR ALL USING (auth.role() = 'authenticated');

-- Kanban Tasks: All authenticated users can CRUD
CREATE POLICY "Kanban tasks are viewable by all" ON public.kanban_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Kanban tasks are editable by all" ON public.kanban_tasks
  FOR ALL USING (auth.role() = 'authenticated');

-- Recurring Tasks: All authenticated users can CRUD
CREATE POLICY "Recurring tasks are viewable by all" ON public.recurring_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Recurring tasks are editable by all" ON public.recurring_tasks
  FOR ALL USING (auth.role() = 'authenticated');

-- Comments: All authenticated users can CRUD
CREATE POLICY "Comments are viewable by all" ON public.comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Comments are editable by all" ON public.comments
  FOR ALL USING (auth.role() = 'authenticated');

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Dropdown Options: All can read and edit
CREATE POLICY "Dropdown options are viewable by all" ON public.dropdown_options
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Dropdown options are editable by all" ON public.dropdown_options
  FOR ALL USING (auth.role() = 'authenticated');

-- Workforce: All can CRUD
CREATE POLICY "Workforce is viewable by all" ON public.workforce
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Workforce is editable by all" ON public.workforce
  FOR ALL USING (auth.role() = 'authenticated');

-- Building Sequences: All can CRUD
CREATE POLICY "Building sequences are viewable by all" ON public.building_sequences
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Building sequences are editable by all" ON public.building_sequences
  FOR ALL USING (auth.role() = 'authenticated');

-- Options: All can CRUD
CREATE POLICY "Options are viewable by all" ON public.options
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Options are editable by all" ON public.options
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

-- Enable realtime for tables that need live updates (ignore errors if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.building_tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.workforce;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first (idempotent)
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS building_tasks_updated_at ON public.building_tasks;
DROP TRIGGER IF EXISTS kanban_tasks_updated_at ON public.kanban_tasks;
DROP TRIGGER IF EXISTS recurring_tasks_updated_at ON public.recurring_tasks;
DROP TRIGGER IF EXISTS workforce_updated_at ON public.workforce;
DROP TRIGGER IF EXISTS building_sequences_updated_at ON public.building_sequences;
DROP TRIGGER IF EXISTS options_updated_at ON public.options;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER building_tasks_updated_at BEFORE UPDATE ON public.building_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER kanban_tasks_updated_at BEFORE UPDATE ON public.kanban_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recurring_tasks_updated_at BEFORE UPDATE ON public.recurring_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workforce_updated_at BEFORE UPDATE ON public.workforce
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER building_sequences_updated_at BEFORE UPDATE ON public.building_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER options_updated_at BEFORE UPDATE ON public.options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- FUNCTION: Auto-create profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || split_part(NEW.email, '@', 1) || '&background=059669&color=fff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
