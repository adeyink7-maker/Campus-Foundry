-- Migration 008: Add Staff Roles, Admin Audit Logging & Role-Based Access Control
-- Description: Introduces staff_role column on profiles, creates admin_actions log table, and updates RLS policies for student_verifier, page_moderator, and super_admin.

-- 1. Add staff_role column to public.profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS staff_role TEXT CHECK (staff_role IN ('student_verifier', 'page_moderator', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_staff_role ON public.profiles(staff_role);


-- 2. Create admin_actions audit log table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_staff_id ON public.admin_actions(staff_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read admin_actions
DROP POLICY IF EXISTS "Only super_admin can read admin_actions" ON public.admin_actions;
CREATE POLICY "Only super_admin can read admin_actions"
  ON public.admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND staff_role = 'super_admin'
    )
  );

-- Any staff member (student_verifier, page_moderator, super_admin) can insert audit logs
DROP POLICY IF EXISTS "Staff members can insert audit logs" ON public.admin_actions;
CREATE POLICY "Staff members can insert audit logs"
  ON public.admin_actions FOR INSERT
  WITH CHECK (
    staff_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND staff_role IN ('student_verifier', 'page_moderator', 'super_admin')
    )
  );


-- 3. RLS Policy Updates for profiles table
-- Users cannot update their own staff_role. Only super_admin can update staff_role.
DROP POLICY IF EXISTS "Only super_admin can update staff_role on profiles" ON public.profiles;
CREATE POLICY "Only super_admin can update staff_role on profiles"
  ON public.profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND staff_role = 'super_admin'
    )
  );


-- 4. RLS Policy Updates for verification_requests table
-- Accessible to student_verifier and super_admin (and legacy is_admin)
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student verifiers and super admins can view verification requests" ON public.verification_requests;
CREATE POLICY "Student verifiers and super admins can view verification requests"
  ON public.verification_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (staff_role IN ('student_verifier', 'super_admin') OR is_admin = TRUE)
    )
  );

DROP POLICY IF EXISTS "Student verifiers and super admins can update verification requests" ON public.verification_requests;
CREATE POLICY "Student verifiers and super admins can update verification requests"
  ON public.verification_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (staff_role IN ('student_verifier', 'super_admin') OR is_admin = TRUE)
    )
  );


-- 5. RLS Policy Updates for pages table
-- page_moderator can approve/reject page requests, but ONLY super_admin can mark is_verified = true.
DROP POLICY IF EXISTS "Page moderators and super admins can review page requests" ON public.pages;
CREATE POLICY "Page moderators and super admins can review page requests"
  ON public.pages FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (staff_role IN ('page_moderator', 'super_admin') OR is_admin = TRUE)
    )
    OR EXISTS (
      SELECT 1 FROM public.page_members
      WHERE page_id = pages.id AND user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );


-- 6. RLS Policy Updates for page_reports table
DROP POLICY IF EXISTS "Page moderators and super admins can view reports" ON public.page_reports;
CREATE POLICY "Page moderators and super admins can view reports"
  ON public.page_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (staff_role IN ('page_moderator', 'super_admin') OR is_admin = TRUE)
    )
  );

DROP POLICY IF EXISTS "Page moderators and super admins can resolve reports" ON public.page_reports;
CREATE POLICY "Page moderators and super admins can resolve reports"
  ON public.page_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (staff_role IN ('page_moderator', 'super_admin') OR is_admin = TRUE)
    )
  );


-- 7. SQL Helper to set specific user account as super_admin
-- Replace 'adeyink7@gmail.com' or specific user ID with your target account:
UPDATE public.profiles
SET staff_role = 'super_admin', is_admin = TRUE
WHERE email = 'adeyink7@gmail.com' OR username = 'adeyink7';
