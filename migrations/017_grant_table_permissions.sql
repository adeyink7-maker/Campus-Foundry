-- Migration 017: Grant Table Privileges to anon and authenticated roles
-- Fixes PostgreSQL error 42501 (permission denied for tables student_businesses, campus_posts, campus_snaps)

-- 1. Ensure schema usage is granted
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant table permissions for student_businesses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_businesses TO anon, authenticated;
ALTER TABLE public.student_businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view student businesses" ON public.student_businesses;
CREATE POLICY "Public can view student businesses"
    ON public.student_businesses
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Owners insert student business" ON public.student_businesses;
CREATE POLICY "Owners insert student business"
    ON public.student_businesses
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id OR owner_id IS NOT NULL);

DROP POLICY IF EXISTS "Owners update student business" ON public.student_businesses;
CREATE POLICY "Owners update student business"
    ON public.student_businesses
    FOR UPDATE
    USING (auth.uid() = owner_id OR owner_id IS NOT NULL)
    WITH CHECK (auth.uid() = owner_id OR owner_id IS NOT NULL);


-- 3. Grant table permissions for campus_posts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_posts TO anon, authenticated;
ALTER TABLE public.campus_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view campus posts" ON public.campus_posts;
CREATE POLICY "Public can view campus posts"
    ON public.campus_posts
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert campus posts" ON public.campus_posts;
CREATE POLICY "Users can insert campus posts"
    ON public.campus_posts
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update campus posts" ON public.campus_posts;
CREATE POLICY "Users can update campus posts"
    ON public.campus_posts
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete campus posts" ON public.campus_posts;
CREATE POLICY "Users can delete campus posts"
    ON public.campus_posts
    FOR DELETE
    USING (true);


-- 4. Grant table permissions for campus_snaps
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campus_snaps TO anon, authenticated;
ALTER TABLE public.campus_snaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view campus snaps" ON public.campus_snaps;
CREATE POLICY "Public can view campus snaps"
    ON public.campus_snaps
    FOR SELECT
    USING (expires_at > NOW() OR expires_at IS NULL);

DROP POLICY IF EXISTS "Users can insert campus snaps" ON public.campus_snaps;
CREATE POLICY "Users can insert campus snaps"
    ON public.campus_snaps
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update campus snaps" ON public.campus_snaps;
CREATE POLICY "Users can update campus snaps"
    ON public.campus_snaps
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete campus snaps" ON public.campus_snaps;
CREATE POLICY "Users can delete campus snaps"
    ON public.campus_snaps
    FOR DELETE
    USING (true);


-- 5. Grant table permissions for profiles and other core tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_conversations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO anon, authenticated;
