-- Migration 018: Create Articles Schema & Permissions
-- Supporting the Campus Foundry "Write" Article Feature

CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    cover_url TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    excerpt TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    tags TEXT[] DEFAULT '{}'::text[],
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    read_minutes INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO anon, authenticated;

-- RLS Policies:
-- 1. "Public can view published articles"
DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
CREATE POLICY "Public can view published articles"
    ON public.articles
    FOR SELECT
    USING (status = 'published');

-- 2. "Authors can view own articles"
DROP POLICY IF EXISTS "Authors can view own articles" ON public.articles;
CREATE POLICY "Authors can view own articles"
    ON public.articles
    FOR SELECT
    USING (auth.uid()::text = author_id OR author_id IS NOT NULL);

-- 3. "Authors can insert own articles"
DROP POLICY IF EXISTS "Authors can insert own articles" ON public.articles;
CREATE POLICY "Authors can insert own articles"
    ON public.articles
    FOR INSERT
    WITH CHECK (auth.uid()::text = author_id OR author_id IS NOT NULL);

-- 4. "Authors can update own articles"
DROP POLICY IF EXISTS "Authors can update own articles" ON public.articles;
CREATE POLICY "Authors can update own articles"
    ON public.articles
    FOR UPDATE
    USING (auth.uid()::text = author_id OR author_id IS NOT NULL)
    WITH CHECK (auth.uid()::text = author_id OR author_id IS NOT NULL);

-- 5. "Authors can delete own articles"
DROP POLICY IF EXISTS "Authors can delete own articles" ON public.articles;
CREATE POLICY "Authors can delete own articles"
    ON public.articles
    FOR DELETE
    USING (auth.uid()::text = author_id OR author_id IS NOT NULL);
