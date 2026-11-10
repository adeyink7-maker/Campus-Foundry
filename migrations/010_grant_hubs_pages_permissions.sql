-- Migration 010: Grant Schema and Table Privileges for Hubs Pages & Staff Tables
-- Description: Grants SELECT, INSERT, UPDATE, DELETE permissions on pages, page_posts, page_members, page_reports, page_messages, and admin_actions to anon and authenticated roles, and ensures RLS policies allow public read for approved pages and published posts.

-- 1. Grant Schema Usage and Table Privileges to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON TABLE public.pages TO anon, authenticated;
GRANT ALL ON TABLE public.page_members TO anon, authenticated;
GRANT ALL ON TABLE public.page_posts TO anon, authenticated;
GRANT ALL ON TABLE public.page_reports TO anon, authenticated;
GRANT ALL ON TABLE public.page_messages TO anon, authenticated;
GRANT ALL ON TABLE public.admin_actions TO anon, authenticated;

-- 2. Update RLS Policies for Pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone signed in can read approved pages or owned/admin pages" ON public.pages;
DROP POLICY IF EXISTS "Anyone can read approved pages" ON public.pages;

CREATE POLICY "Anyone can read approved pages"
  ON public.pages FOR SELECT
  USING (
    status = 'approved'
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR staff_role IN ('super_admin', 'page_moderator'))
    )
  );

-- 3. Update RLS Policies for Page Posts
ALTER TABLE public.page_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone signed in can read published page posts" ON public.page_posts;
DROP POLICY IF EXISTS "Anyone can read published page posts" ON public.page_posts;

CREATE POLICY "Anyone can read published page posts"
  ON public.page_posts FOR SELECT
  USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.page_members pm
        WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
      ))
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR staff_role = 'super_admin')
    )
  );
