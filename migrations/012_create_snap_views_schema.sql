-- ==============================================================================
-- CAMPUS FOUNDRY: SNAP VIEWS SCHEMA & REAL-TIME VIEW TRACKING
-- Migration: 012_create_snap_views_schema.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.snap_views (
    snap_id UUID NOT NULL REFERENCES public.campus_snaps(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (snap_id, viewer_id)
);

-- Index for fast counts and viewer lists per snap
CREATE INDEX IF NOT EXISTS idx_snap_views_snap_id ON public.snap_views(snap_id);
CREATE INDEX IF NOT EXISTS idx_snap_views_viewer_id ON public.snap_views(viewer_id);

-- Enable Row Level Security
ALTER TABLE public.snap_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Anyone authenticated can view snap views" ON public.snap_views;
DROP POLICY IF EXISTS "Users can record their own snap views" ON public.snap_views;

-- RLS Policies
CREATE POLICY "Anyone authenticated can view snap views"
ON public.snap_views FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can record their own snap views"
ON public.snap_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = viewer_id);

-- Grants
GRANT SELECT, INSERT ON public.snap_views TO authenticated;
GRANT SELECT, INSERT ON public.snap_views TO anon;
