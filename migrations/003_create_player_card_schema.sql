-- ==============================================================================
-- CAMPUS FOUNDRY: PLAYER CARD & ACHIEVEMENTS SCHEMA MIGRATION
-- Migration: 003_create_player_card_schema.sql
-- ==============================================================================

-- 1. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Trophy',
    category TEXT NOT NULL CHECK (category IN ('academic', 'sports', 'leadership', 'project', 'award', 'other')),
    date_achieved DATE,
    link_url TEXT,
    media_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_achievements_visible ON public.achievements(user_id, is_visible) WHERE is_visible = TRUE;

-- 2. PLAYER CARD SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.player_card_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    accent_color TEXT NOT NULL DEFAULT '#f59e0b',
    hero_video_url TEXT,
    show_stats BOOLEAN NOT NULL DEFAULT TRUE,
    tagline TEXT,
    top_skill TEXT,
    jersey_number INT DEFAULT 10,
    portfolio_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_card_settings ENABLE ROW LEVEL SECURITY;

-- Achievements RLS:
-- Anyone authenticated can view visible achievements (or authors can view all their own)
CREATE POLICY "Public authenticated can read visible achievements"
ON public.achievements FOR SELECT TO authenticated
USING (is_visible = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.achievements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND is_verified = FALSE);

CREATE POLICY "Users can update their own achievements"
ON public.achievements FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
ON public.achievements FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Player Card Settings RLS:
CREATE POLICY "Public authenticated can read player card settings"
ON public.player_card_settings FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "Users can insert their own card settings"
ON public.player_card_settings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card settings"
ON public.player_card_settings FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. STORAGE BUCKET FOR PLAYER CARDS (Icons, Media, Short Loop Videos max ~5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'player-cards',
    'player-cards',
    TRUE,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880;

-- Public read for player cards media
CREATE POLICY "Public player-cards media access"
ON storage.objects FOR SELECT
USING (bucket_id = 'player-cards');

-- Authenticated owner upload into user folder
CREATE POLICY "Authenticated users can upload player card media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'player-cards' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can update their player card media"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'player-cards' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can delete their player card media"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'player-cards' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
