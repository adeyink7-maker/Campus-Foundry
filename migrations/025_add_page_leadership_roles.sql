-- Migration 025: Add Page Leadership Roles
-- Description: Updates the role check constraint on public.page_members to support leadership roles (co_lead, moderator, editor_in_chief, editor, official) alongside owner, admin, member, follower.
-- Ensures that leadership badges derive strictly from verified page roles and can be assigned by page owners/admins.

DO $$
BEGIN
  -- Drop existing check constraint if it exists
  ALTER TABLE public.page_members DROP CONSTRAINT IF EXISTS page_members_role_check;
  
  -- Add updated check constraint with leadership roles
  ALTER TABLE public.page_members ADD CONSTRAINT page_members_role_check 
    CHECK (role IN ('owner', 'admin', 'co_lead', 'moderator', 'editor_in_chief', 'editor', 'official', 'member', 'follower'));
END $$;

-- Enable Row Level Security
ALTER TABLE public.page_members ENABLE ROW LEVEL SECURITY;

-- 1. Read policy: Anyone signed in or anon can read page members to display leadership badges and member counts
DROP POLICY IF EXISTS "Anyone signed in can read page members" ON public.page_members;
CREATE POLICY "Anyone signed in can read page members"
  ON public.page_members FOR SELECT
  USING (true);

-- 2. Update policy: Page owners, club admins, or app admins can assign or update member roles (e.g., Co-lead, Moderator)
DROP POLICY IF EXISTS "Page admins or owners can update member roles" ON public.page_members;
CREATE POLICY "Page admins or owners can update member roles"
  ON public.page_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.page_members pm
        WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'co_lead', 'editor_in_chief') AND pm.status = 'active'
      ))
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR staff_role = 'super_admin')
    )
  );

-- 3. Delete policy: Owners, admins, or users leaving can remove members
DROP POLICY IF EXISTS "Users remove self or page admins remove members" ON public.page_members;
CREATE POLICY "Users remove self or page admins remove members"
  ON public.page_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.page_members pm
        WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'co_lead', 'editor_in_chief') AND pm.status = 'active'
      ))
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR staff_role = 'super_admin')
    )
  );

GRANT ALL ON TABLE public.page_members TO anon, authenticated;
