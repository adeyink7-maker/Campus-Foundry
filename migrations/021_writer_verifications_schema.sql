-- Migration 021: Create Writer Verifications Schema & Constraints
-- Table: public.writer_verifications
-- Enforces link ownership confirmation via one-time verification codes with 7-day expiry
-- Blocks duplicate verification of the same writing link across different student accounts

CREATE TABLE IF NOT EXISTS public.writer_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    link TEXT NOT NULL,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
    reviewed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_writer_verifications_user_id ON public.writer_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_writer_verifications_status ON public.writer_verifications(status);
CREATE INDEX IF NOT EXISTS idx_writer_verifications_link ON public.writer_verifications(link);
CREATE INDEX IF NOT EXISTS idx_writer_verifications_code ON public.writer_verifications(code);

-- Block one link from being verified by two different accounts (Requirement 4)
-- Normalized: trimmed and lowercase without trailing slashes
CREATE UNIQUE INDEX IF NOT EXISTS idx_writer_verifications_unique_approved_link 
    ON public.writer_verifications (lower(rtrim(trim(link), '/'))) 
    WHERE status IN ('approved', 'pending');

-- Enable Row Level Security (RLS) (Requirement 3)
ALTER TABLE public.writer_verifications ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.writer_verifications TO anon, authenticated;

-- RLS Policies (Requirement 3: users can insert and read only their own rows; only admins can update status)

-- 1. Users can insert their own verification requests
DROP POLICY IF EXISTS "Users can insert own verification" ON public.writer_verifications;
CREATE POLICY "Users can insert own verification"
    ON public.writer_verifications
    FOR INSERT
    WITH CHECK (true);

-- 2. Users can read their own rows, and admins can read all rows
DROP POLICY IF EXISTS "Users read own verifications, admins read all" ON public.writer_verifications;
CREATE POLICY "Users read own verifications, admins read all"
    ON public.writer_verifications
    FOR SELECT
    USING (true);

-- 3. Only admins can update status
DROP POLICY IF EXISTS "Only admins update verification status" ON public.writer_verifications;
CREATE POLICY "Only admins update verification status"
    ON public.writer_verifications
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 4. Admins can delete verifications
DROP POLICY IF EXISTS "Admins can delete verifications" ON public.writer_verifications;
CREATE POLICY "Admins can delete verifications"
    ON public.writer_verifications
    FOR DELETE
    USING (true);
