-- Migration 009: Ensure profiles role column, admin privileges, and user details on page members
-- Description: Ensures public.profiles.role defaults to 'user', allows 'admin', and provides query to set your account to 'admin'.

-- 1. Ensure profiles.role column exists with default 'user' and allows 'admin'
DO $$ 
BEGIN
  -- Drop existing check constraint if it restricts role
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  
  -- Ensure column exists with default 'user'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  ELSE
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';
  END IF;

  -- Add updated check constraint supporting 'user', 'student', 'trader', 'admin'
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'student', 'trader', 'admin'));
END $$;

-- 2. Foreign Key from page_members.user_id to public.profiles.id for joins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_page_members_profiles' AND table_name = 'page_members'
  ) THEN
    ALTER TABLE public.page_members 
      ADD CONSTRAINT fk_page_members_profiles 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping FK creation if already constrained: %', SQLERRM;
END $$;

-- 3. RLS Policies: Ensure users with role = 'admin' or staff_role = 'super_admin' or is_admin = true have admin control
DROP POLICY IF EXISTS "Admins can manage all pages" ON public.pages;
CREATE POLICY "Admins can manage all pages"
  ON public.pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR staff_role IN ('super_admin', 'page_moderator') OR is_admin = TRUE)
    )
  );

-- 4. SQL Command to set your account to 'admin':
-- Run this in the Supabase SQL editor:
UPDATE public.profiles
SET role = 'admin', staff_role = 'super_admin', is_admin = TRUE
WHERE email = 'adeyink7@gmail.com' OR username = 'adeyink7';
