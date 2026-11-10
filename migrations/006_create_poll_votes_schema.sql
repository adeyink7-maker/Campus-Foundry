-- ==============================================================================
-- CAMPUS FOUNDRY: POLL VOTES SCHEMA & RLS POLICIES
-- Migration: 006_create_poll_votes_schema.sql
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create poll_votes table with unique constraint on (poll_id, user_id)
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    candidate_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT poll_votes_poll_id_user_id_key UNIQUE (poll_id, user_id)
);

-- Ensure UNIQUE constraint exists if table already existed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'poll_votes_poll_id_user_id_key'
    ) THEN
        ALTER TABLE public.poll_votes ADD CONSTRAINT poll_votes_poll_id_user_id_key UNIQUE (poll_id, user_id);
    END IF;
END $$;

-- 3. Grant table privileges to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.poll_votes TO anon, authenticated;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own vote" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can view their own vote" ON public.poll_votes;

-- 5. Policy: User can insert only their own vote (user_id = auth.uid())
CREATE POLICY "Users can insert their own vote"
ON public.poll_votes FOR INSERT TO authenticated, anon
WITH CHECK (user_id = auth.uid());

-- 6. Policy: User can read only their own vote (user_id = auth.uid())
CREATE POLICY "Users can view their own vote"
ON public.poll_votes FOR SELECT TO authenticated, anon
USING (user_id = auth.uid());
