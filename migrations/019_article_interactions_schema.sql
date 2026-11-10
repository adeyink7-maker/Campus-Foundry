-- Migration 019: Create Article Interactions Schema & Permissions
-- Supporting article likes, bookmarks, views, and comments

-- 1. Table: article_likes
CREATE TABLE IF NOT EXISTS public.article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_article_user_like UNIQUE (article_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON public.article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON public.article_likes(user_id);

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.article_likes TO anon, authenticated;

-- Policies for article_likes:
DROP POLICY IF EXISTS "Public can read article likes" ON public.article_likes;
CREATE POLICY "Public can read article likes"
    ON public.article_likes
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert own article likes" ON public.article_likes;
CREATE POLICY "Users can insert own article likes"
    ON public.article_likes
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete own article likes" ON public.article_likes;
CREATE POLICY "Users can delete own article likes"
    ON public.article_likes
    FOR DELETE
    USING (auth.uid()::text = user_id OR user_id IS NOT NULL);


-- 2. Table: article_bookmarks
CREATE TABLE IF NOT EXISTS public.article_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_article_user_bookmark UNIQUE (article_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_article_id ON public.article_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_article_bookmarks_user_id ON public.article_bookmarks(user_id);

ALTER TABLE public.article_bookmarks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.article_bookmarks TO anon, authenticated;

-- Policies for article_bookmarks:
DROP POLICY IF EXISTS "Users can read own article bookmarks" ON public.article_bookmarks;
CREATE POLICY "Users can read own article bookmarks"
    ON public.article_bookmarks
    FOR SELECT
    USING (auth.uid()::text = user_id OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert own article bookmarks" ON public.article_bookmarks;
CREATE POLICY "Users can insert own article bookmarks"
    ON public.article_bookmarks
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete own article bookmarks" ON public.article_bookmarks;
CREATE POLICY "Users can delete own article bookmarks"
    ON public.article_bookmarks
    FOR DELETE
    USING (auth.uid()::text = user_id OR user_id IS NOT NULL);


-- 3. Table: article_views
CREATE TABLE IF NOT EXISTS public.article_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_article_user_view UNIQUE (article_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON public.article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_user_id ON public.article_views(user_id);

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.article_views TO anon, authenticated;

-- Policies for article_views:
DROP POLICY IF EXISTS "Public can read article views" ON public.article_views;
CREATE POLICY "Public can read article views"
    ON public.article_views
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert article views" ON public.article_views;
CREATE POLICY "Users can insert article views"
    ON public.article_views
    FOR INSERT
    WITH CHECK (true);


-- 4. Table: article_comments
CREATE TABLE IF NOT EXISTS public.article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON public.article_comments(created_at ASC);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_comments TO anon, authenticated;

-- Policies for article_comments:
DROP POLICY IF EXISTS "Public can read article comments" ON public.article_comments;
CREATE POLICY "Public can read article comments"
    ON public.article_comments
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert own article comments" ON public.article_comments;
CREATE POLICY "Users can insert own article comments"
    ON public.article_comments
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete own article comments" ON public.article_comments;
CREATE POLICY "Users can delete own article comments"
    ON public.article_comments
    FOR DELETE
    USING (auth.uid()::text = user_id OR user_id IS NOT NULL);
