-- =============================================
-- SANTI MANAGEMENT - SUPABASE DATABASE SCHEMA
-- =============================================
-- Run this in Supabase SQL Editor to create all tables

-- 1. USERS TABLE (extends Supabase auth.users)
CREATE TABLE public.profiles (
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
CREATE TABLE public.building_tasks (
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
CREATE TABLE public.kanban_tasks (
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
CREATE TABLE public.recurring_tasks (
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
CREATE TABLE public.comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES public.building_tasks(id) ON DELETE CASCADE,
  kanban_task_id TEXT REFERENCES public.kanban_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  text TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NOTIFICATIONS
CREATE TABLE public.notifications (
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
CREATE TABLE public.dropdown_options (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  parent_category TEXT,
  value TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Dropdown Options: All can read
CREATE POLICY "Dropdown options are viewable by all" ON public.dropdown_options
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Dropdown options are editable by all" ON public.dropdown_options
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.building_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

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

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER building_tasks_updated_at BEFORE UPDATE ON public.building_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER kanban_tasks_updated_at BEFORE UPDATE ON public.kanban_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recurring_tasks_updated_at BEFORE UPDATE ON public.recurring_tasks
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA: Initial dropdown options
-- =============================================

INSERT INTO public.dropdown_options (category, value, "order") VALUES
  ('status', 'Done', 1),
  ('status', 'In Progress', 2),
  ('status', 'Ready to start (Supply Chain confirmed on-site)', 3),
  ('status', 'Supply Chain Pending Order', 4),
  ('status', 'Supply Chain Pending Arrival', 5),
  ('status', 'Blocked', 6),
  ('status', 'On Hold', 7),
  ('villa', 'Villa 1', 1),
  ('villa', 'Villa 2', 2),
  ('villa', 'Villa 3', 3),
  ('villa', 'Villa 4', 4),
  ('villa', 'Villa 5', 5),
  ('villa', 'Landscaping', 6),
  ('mainCategory', '1 Site Prep', 1),
  ('mainCategory', '2 Foundation', 2),
  ('mainCategory', '3 Structure', 3),
  ('mainCategory', '4 Roofing', 4),
  ('mainCategory', '5 MEP', 5),
  ('mainCategory', '6 Finishes', 6),
  ('mainCategory', 'Landscaping', 7),
  ('mainCategory', 'Infrastructure', 8),
  ('skilledWorker', 'zin', 1),
  ('skilledWorker', 'Joshua', 2),
  ('skilledWorker', 'zaw', 3),
  ('skilledWorker', 'diesel', 4),
  ('skilledWorker', 'San Shwe', 5),
  ('unskilledWorker', 'Tun Sein Maung', 1),
  ('unskilledWorker', 'Sone', 2),
  ('unskilledWorker', 'Min Pyea', 3),
  ('unskilledWorker', 'Thein Win', 4);

INSERT INTO public.dropdown_options (category, parent_category, value, "order") VALUES
  ('subCategory', '2 Foundation', 'Base Foundation (incl columns)', 1),
  ('subCategory', '2 Foundation', 'Strip Foundation', 2),
  ('subCategory', '2 Foundation', 'Plumbing', 3),
  ('subCategory', '2 Foundation', 'Main Slab Foundation', 4),
  ('subCategory', '3 Structure', 'Columns', 1),
  ('subCategory', '3 Structure', 'Beams', 2),
  ('subCategory', '3 Structure', 'Walls', 3),
  ('subCategory', '3 Structure', 'Slabs', 4),
  ('subCategory', 'Landscaping', 'Garden', 1),
  ('subCategory', 'Landscaping', 'Trees', 2),
  ('subCategory', 'Landscaping', 'Irrigation', 3),
  ('subCategory', 'Infrastructure', 'Pathways', 1),
  ('subCategory', 'Infrastructure', 'Drainage', 2),
  ('subCategory', 'Infrastructure', 'Lighting', 3),
  ('subCategory', 'Infrastructure', 'Fencing', 4),
  ('task', 'Base Foundation (incl columns)', 'Formwork', 1),
  ('task', 'Base Foundation (incl columns)', 'Re-Bar', 2),
  ('task', 'Base Foundation (incl columns)', 'Concrete', 3),
  ('task', 'Strip Foundation', 'Brick Work', 1),
  ('task', 'Strip Foundation', 'Concrete', 2),
  ('task', 'Strip Foundation', 'Plinch-Beam', 3),
  ('task', 'Strip Foundation', 'Formwork', 4),
  ('task', 'Plumbing', 'Rough-in', 1),
  ('task', 'Plumbing', 'Connections', 2),
  ('task', 'Plumbing', 'Testing', 3),
  ('task', 'Garden', 'Preparation', 1),
  ('task', 'Garden', 'Planting', 2),
  ('task', 'Garden', 'Mulching', 3);

-- =============================================
-- SEED DATA: Sample building tasks
-- =============================================

INSERT INTO public.building_tasks ("order", villa, main_category, sub_category, task, step, notes, status, earliest_start, skilled_workers, unskilled_workers, duration) VALUES
  (1, 'Villa 3', '2 Foundation', 'Base Foundation (incl columns)', 'Re-Bar', 'Prefab Re-Bar', '', 'Done', '2026-01-01', ARRAY['zin'], ARRAY['Tun Sein Maung'], ''),
  (2, 'Villa 3', '2 Foundation', 'Base Foundation (incl columns)', 'Formwork', 'Set up Formwork', '', 'In Progress', NULL, ARRAY['Joshua'], ARRAY['Sone'], '8:00'),
  (3, 'Villa 3', '2 Foundation', 'Base Foundation (incl columns)', 'Formwork', 'Set Re-Bar Inside Formwork', '', 'Ready to start (Supply Chain confirmed on-site)', NULL, ARRAY['zaw'], ARRAY['Min Pyea'], '8:00'),
  (4, 'Villa 3', '2 Foundation', 'Base Foundation (incl columns)', 'Formwork', 'Brace Formwork', 'Step in-between', 'Ready to start (Supply Chain confirmed on-site)', NULL, ARRAY['diesel'], ARRAY['Thein Win'], '8:00'),
  (5, 'Villa 3', '2 Foundation', 'Base Foundation (incl columns)', 'Concrete', 'Concrete Pour', '', 'Supply Chain Pending Order', '2026-01-15', ARRAY['San Shwe'], ARRAY['Tun Sein Maung'], ''),
  (6, 'Villa 3', '2 Foundation', 'Base Foundation (incl columns)', 'Concrete', 'Concrete Dry', '', 'Ready to start (Supply Chain confirmed on-site)', NULL, ARRAY[]::TEXT[], ARRAY[]::TEXT[], '16:00'),
  (7, 'Villa 3', '2 Foundation', 'Base Foundation (incl columns)', 'Formwork', 'Formwork removal', '', 'Ready to start (Supply Chain confirmed on-site)', NULL, ARRAY['zaw'], ARRAY['Sone'], ''),
  (1, 'Villa 3', '2 Foundation', 'Strip Foundation', 'Brick Work', 'Brick Laying', '', 'Supply Chain Pending Order', '2026-01-20', ARRAY['zaw'], ARRAY['Sone'], ''),
  (2, 'Villa 3', '2 Foundation', 'Strip Foundation', 'Concrete', 'Concrete Pouring', '', 'Supply Chain Pending Order', '2026-01-25', ARRAY['diesel'], ARRAY['Min Pyea'], ''),
  (3, 'Villa 3', '2 Foundation', 'Strip Foundation', 'Concrete', 'Strip wall pour', '', 'Ready to start (Supply Chain confirmed on-site)', NULL, ARRAY['diesel'], ARRAY['Min Pyea'], ''),
  (1, 'Villa 2', '2 Foundation', 'Base Foundation (incl columns)', 'Formwork', 'Set up Formwork', '', 'Done', '2025-12-15', ARRAY['Joshua'], ARRAY['Sone'], '8:00'),
  (2, 'Villa 2', '2 Foundation', 'Base Foundation (incl columns)', 'Concrete', 'Concrete Pour', '', 'Done', NULL, ARRAY['San Shwe'], ARRAY['Tun Sein Maung'], ''),
  (1, 'Villa 1', '2 Foundation', 'Base Foundation (incl columns)', 'Concrete', 'Concrete Pour', '', 'Done', NULL, ARRAY['San Shwe'], ARRAY['Tun Sein Maung'], ''),
  (1, 'Landscaping', 'Landscaping', 'Garden', 'Preparation', 'Clear vegetation', '', 'Done', '2025-12-10', ARRAY[]::TEXT[], ARRAY['Sone', 'Min Pyea'], '24:00');

SELECT 'Schema created successfully!' AS result;
