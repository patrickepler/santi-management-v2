-- Remove foreign key constraint on profiles.id referencing auth.users
-- This allows profiles to work with Clerk instead of Supabase Auth

-- Drop the existing profiles table and recreate without the auth.users constraint
-- First, drop dependent triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;

-- Recreate profiles table with auto-generated UUID (no auth.users reference)
CREATE TABLE IF NOT EXISTS public.profiles_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'worker' CHECK (role IN ('worker', 'procurement', 'manager')),
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy existing data if any
INSERT INTO public.profiles_new (id, email, username, avatar_url, role, manager_id, created_at, updated_at)
SELECT id, email, username, avatar_url, role, manager_id, created_at, updated_at
FROM public.profiles
ON CONFLICT (email) DO NOTHING;

-- Drop old table and rename new one
DROP TABLE IF EXISTS public.profiles CASCADE;
ALTER TABLE public.profiles_new RENAME TO profiles;

-- Re-add RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Re-add policies
CREATE POLICY "Profiles are viewable by all authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles are editable by authenticated users" ON public.profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Re-add trigger
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
