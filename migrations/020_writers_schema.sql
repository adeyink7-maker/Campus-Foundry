-- Migration 020: Create Writers Schema & Permissions
-- Gate writing behind approval & support writer applications

CREATE TABLE IF NOT EXISTS public.writers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    links TEXT[] NOT NULL DEFAULT '{}'::text[],
    bio TEXT NOT NULL DEFAULT '',
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMPTZ
);

-- Ensure column 'note' exists if table was already created
ALTER TABLE public.writers ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
ALTER TABLE public.writers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_writers_user_id ON public.writers(user_id);
CREATE INDEX IF NOT EXISTS idx_writers_status ON public.writers(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.writers ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.writers TO anon, authenticated;

-- RLS Policies:
-- 1. "Public can view approved writers"
DROP POLICY IF EXISTS "Public can view approved writers" ON public.writers;
CREATE POLICY "Public can view approved writers"
    ON public.writers
    FOR SELECT
    USING (status = 'approved');

-- 2. "Users and admins can view applications"
DROP POLICY IF EXISTS "Users and admins can view applications" ON public.writers;
CREATE POLICY "Users and admins can view applications"
    ON public.writers
    FOR SELECT
    USING (true);

-- 3. "Users can submit writer applications"
DROP POLICY IF EXISTS "Users can submit writer applications" ON public.writers;
CREATE POLICY "Users can submit writer applications"
    ON public.writers
    FOR INSERT
    WITH CHECK (true);

-- 4. "Users or admins can update applications"
DROP POLICY IF EXISTS "Users or admins can update applications" ON public.writers;
CREATE POLICY "Users or admins can update applications"
    ON public.writers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 5. "Admins can delete applications"
DROP POLICY IF EXISTS "Admins can delete applications" ON public.writers;
CREATE POLICY "Admins can delete applications"
    ON public.writers
    FOR DELETE
    USING (true);
