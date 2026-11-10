-- ==============================================================================
-- Migration 017: Grant Public Table Permissions and RLS Policies for Anon & Authenticated
-- ==============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_posts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_comments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_businesses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_snaps TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_reactions TO anon, authenticated;

-- Ensure RLS policies allow public read & authenticated write on campus_posts
ALTER TABLE public.campus_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view campus posts" ON public.campus_posts;
CREATE POLICY "Public can view campus posts" ON public.campus_posts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can create campus posts" ON public.campus_posts;
CREATE POLICY "Authenticated can create campus posts" ON public.campus_posts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authors can delete campus posts" ON public.campus_posts;
CREATE POLICY "Authors can delete campus posts" ON public.campus_posts FOR DELETE TO authenticated USING (true);

-- Ensure RLS policies allow public read & authenticated write on student_businesses
ALTER TABLE public.student_businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view student businesses" ON public.student_businesses;
CREATE POLICY "Public can view student businesses" ON public.student_businesses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Owners can manage student businesses" ON public.student_businesses;
CREATE POLICY "Owners can manage student businesses" ON public.student_businesses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure RLS policies allow public read & authenticated write on campus_snaps
ALTER TABLE public.campus_snaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view campus snaps" ON public.campus_snaps;
CREATE POLICY "Public can view campus snaps" ON public.campus_snaps FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can create campus snaps" ON public.campus_snaps;
CREATE POLICY "Authenticated can create campus snaps" ON public.campus_snaps FOR INSERT TO authenticated WITH CHECK (true);
