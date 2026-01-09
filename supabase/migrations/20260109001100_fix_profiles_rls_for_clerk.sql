-- Fix RLS policy for profiles to allow writes without Supabase Auth
-- Since we use Clerk for authentication, not Supabase Auth

-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are editable by authenticated users" ON public.profiles;

-- Create more permissive policies for Clerk usage
-- Allow anyone to read profiles
CREATE POLICY "Profiles are viewable by anyone" ON public.profiles
  FOR SELECT USING (true);

-- Allow anyone to insert/update profiles (Clerk handles auth separately)
CREATE POLICY "Profiles can be created by anyone" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Profiles can be updated by anyone" ON public.profiles
  FOR UPDATE USING (true);
