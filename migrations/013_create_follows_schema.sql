-- ==============================================================================
-- CAMPUS FOUNDRY: FOLLOWS TABLE & RLS POLICIES
-- Migration: 013_create_follows_schema.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Indexes for fast follower / following lookups and count queries
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Anyone authenticated can view follows" ON public.follows;
DROP POLICY IF EXISTS "Users can insert their own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

-- RLS Policies
CREATE POLICY "Anyone authenticated can view follows"
ON public.follows FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can insert their own follows"
ON public.follows FOR INSERT TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
ON public.follows FOR DELETE TO authenticated
USING (auth.uid() = follower_id);

-- Grants
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
