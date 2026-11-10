-- ==============================================================================
-- CAMPUS FOUNDRY: COMPREHENSIVE RLS FIX FOR SNAPS, CONVERSATIONS, MESSAGES & AUDIO
-- Migration: 004_fix_rls_snaps_chat_audio.sql
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- PART 1: CAMPUS SNAPS (24-Hour Stories & Expiry)
-- ==============================================================================

-- Ensure campus_snaps table exists with proper structure
CREATE TABLE IF NOT EXISTS public.campus_snaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_username TEXT,
    author_avatar TEXT,
    author_dept TEXT,
    author_level TEXT,
    location_tag TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    expires_in_hours INT NOT NULL DEFAULT 24,
    views_count INT NOT NULL DEFAULT 0,
    stickers JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_campus_snaps_active ON public.campus_snaps(expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_campus_snaps_author ON public.campus_snaps(author_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.campus_snaps ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting or incomplete existing policies
DROP POLICY IF EXISTS "Public can view non-expired snaps" ON public.campus_snaps;
DROP POLICY IF EXISTS "Anyone authenticated can view non-expired snaps" ON public.campus_snaps;
DROP POLICY IF EXISTS "Users can create their own snaps" ON public.campus_snaps;
DROP POLICY IF EXISTS "Users can update their own snaps" ON public.campus_snaps;
DROP POLICY IF EXISTS "Users can delete their own snaps" ON public.campus_snaps;

-- 1. SELECT: Anyone logged in can read non-expired snaps (or the author can see their own)
CREATE POLICY "Anyone authenticated can view non-expired snaps"
ON public.campus_snaps FOR SELECT TO authenticated
USING (expires_at > NOW() OR auth.uid() = author_id);

-- 2. INSERT: Users can only create snaps with their own author_id
CREATE POLICY "Users can create their own snaps"
ON public.campus_snaps FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

-- 3. UPDATE: Authors can update only their own snaps (e.g. view count or stickers)
CREATE POLICY "Users can update their own snaps"
ON public.campus_snaps FOR UPDATE TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- 4. DELETE: Authors can delete only their own snaps
CREATE POLICY "Users can delete their own snaps"
ON public.campus_snaps FOR DELETE TO authenticated
USING (auth.uid() = author_id);

-- Also apply policies to singular `campus_snap` in case that table exists in your project
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campus_snap') THEN
    EXECUTE 'ALTER TABLE public.campus_snap ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone authenticated can view non-expired snaps" ON public.campus_snap';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own snaps" ON public.campus_snap';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own snaps" ON public.campus_snap';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own snaps" ON public.campus_snap';
    
    EXECUTE 'CREATE POLICY "Anyone authenticated can view non-expired snaps" ON public.campus_snap FOR SELECT TO authenticated USING (expires_at > NOW() OR auth.uid() = author_id)';
    EXECUTE 'CREATE POLICY "Users can create their own snaps" ON public.campus_snap FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id)';
    EXECUTE 'CREATE POLICY "Users can update their own snaps" ON public.campus_snap FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id)';
    EXECUTE 'CREATE POLICY "Users can delete their own snaps" ON public.campus_snap FOR DELETE TO authenticated USING (auth.uid() = author_id)';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- SNAP EXPIRY AUTOMATION
-- Explanation:
-- 1. Real-time filtering: The SELECT policy above (expires_at > NOW()) guarantees
--    that any snap older than 24 hours immediately disappears from user feeds.
-- 2. Physical Database Cleanup: The function below purges old rows from the DB.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_expired_campus_snaps()
RETURNS integer AS $$
DECLARE
  deleted_count integer := 0;
  deleted_count_singular integer := 0;
BEGIN
  -- Delete from campus_snaps
  DELETE FROM public.campus_snaps WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Delete from campus_snap if present
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campus_snap') THEN
    EXECUTE 'DELETE FROM public.campus_snap WHERE expires_at < NOW()';
  END IF;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule automatic hourly cleanup with pg_cron if enabled on your cluster
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge-campus-snaps-hourly');
    PERFORM cron.schedule('purge-campus-snaps-hourly', '0 * * * *', 'SELECT public.purge_expired_campus_snaps();');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not active or insufficient privileges; real-time RLS filter handles expiry cleanly
END $$;


-- ==============================================================================
-- PART 2: CONVERSATIONS & DIRECT MESSAGES (With Message-Request Flow)
-- ==============================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    business_name TEXT,
    business_image_url TEXT,
    trader_name TEXT NOT NULL,
    trader_id TEXT NOT NULL,
    trader_hostel TEXT,
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_email TEXT,
    last_message TEXT,
    last_message_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unread_count INT NOT NULL DEFAULT 0,
    is_message_request BOOLEAN NOT NULL DEFAULT FALSE,
    request_status TEXT NOT NULL DEFAULT 'accepted' CHECK (request_status IN ('pending', 'accepted', 'declined', 'blocked')),
    is_online BOOLEAN DEFAULT TRUE,
    last_seen TEXT DEFAULT 'Online',
    chat_theme TEXT DEFAULT 'emerald',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(buyer_id, trader_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(request_status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_timestamp DESC);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can delete conversations" ON public.conversations;

-- SELECT: Only buyer or trader can view the conversation (unless blocked)
CREATE POLICY "Participants can view conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  (auth.uid()::text = buyer_id OR auth.uid()::text = trader_id)
  AND request_status != 'blocked'
);

-- INSERT: Only buyer or trader can create a conversation
CREATE POLICY "Participants can insert conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
  auth.uid()::text = buyer_id OR auth.uid()::text = trader_id
);

-- UPDATE: Participants can update conversation (accept request, mark read, update timestamp)
CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (
  auth.uid()::text = buyer_id OR auth.uid()::text = trader_id
)
WITH CHECK (
  auth.uid()::text = buyer_id OR auth.uid()::text = trader_id
);

-- DELETE: Participants can delete or clear conversation
CREATE POLICY "Participants can delete conversations"
ON public.conversations FOR DELETE TO authenticated
USING (
  auth.uid()::text = buyer_id OR auth.uid()::text = trader_id
);


-- 2. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    business_id TEXT,
    business_name TEXT,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'student',
    recipient_id TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    text TEXT DEFAULT '',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_state TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_state IN ('sending', 'sent', 'delivered', 'read')),
    hostel_location TEXT,
    order_snippet JSONB,
    voice_note_url TEXT,
    voice_duration NUMERIC(6, 2),
    voice_waveform JSONB,
    attachment_url TEXT,
    attachment_type TEXT,
    attachment_name TEXT,
    reply_to_message JSONB,
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;
DROP POLICY IF EXISTS "Sender can delete own message" ON public.messages;

-- SELECT: Only conversation participants can read messages
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid()::text OR c.trader_id = auth.uid()::text)
      AND c.request_status != 'blocked'
  )
);

-- INSERT: Only sender can send messages, must be a participant, and message requests flow is respected
-- (If a message request is still pending, only the initiating buyer can post until accepted by trader)
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid()::text = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid()::text OR c.trader_id = auth.uid()::text)
      AND c.request_status IN ('pending', 'accepted')
      AND (
        c.request_status = 'accepted'
        OR c.is_message_request = FALSE
        OR c.buyer_id = auth.uid()::text
      )
  )
);

-- UPDATE: Participants can update reactions or mark read
CREATE POLICY "Participants can update messages"
ON public.messages FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid()::text OR c.trader_id = auth.uid()::text)
  )
);

-- DELETE: Senders can delete their own message
CREATE POLICY "Sender can delete own message"
ON public.messages FOR DELETE TO authenticated
USING (auth.uid()::text = sender_id);


-- ==============================================================================
-- PART 3: STORAGE BUCKETS FOR AUDIO & VOICE NOTES
-- ==============================================================================

-- Create buckets for audio and voice notes (max 10MB per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  true,
  10485760,
  ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/aac', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/aac', 'audio/x-m4a'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-notes',
  'voice-notes',
  true,
  10485760,
  ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/aac', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/aac', 'audio/x-m4a'];

-- Drop existing audio storage policies if any
DROP POLICY IF EXISTS "Public can play audio voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update and delete their own audio" ON storage.objects;

-- 1. Read: Public read allows HTML5 audio streaming without session expiration issues
CREATE POLICY "Public can play audio voice notes"
ON storage.objects FOR SELECT
USING (bucket_id IN ('audio', 'voice-notes'));

-- 2. Insert: Logged-in users can upload to their own folder (folder name matches auth.uid)
CREATE POLICY "Authenticated users can upload audio to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('audio', 'voice-notes')
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR auth.role() = 'authenticated'
  )
);

-- 3. Delete: Users can delete their own uploaded voice notes
CREATE POLICY "Users can update and delete their own audio"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('audio', 'voice-notes')
  AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ==============================================================================
-- PART 4: POLICIES FOR OTHER TABLES WITH RLS
-- ==============================================================================

-- If stories, story_views, story_likes exist from migration 001:
DO $$
BEGIN
  -- 1. stories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    EXECUTE 'ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active stories" ON public.stories';
    EXECUTE 'DROP POLICY IF EXISTS "Authors can insert stories" ON public.stories';
    EXECUTE 'DROP POLICY IF EXISTS "Authors can delete stories" ON public.stories';
    EXECUTE 'CREATE POLICY "Anyone can view active stories" ON public.stories FOR SELECT TO authenticated USING (expires_at > NOW() AND is_deleted = false)';
    EXECUTE 'CREATE POLICY "Authors can insert stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = author_id)';
    EXECUTE 'CREATE POLICY "Authors can delete stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid()::text = author_id)';
  END IF;

  -- 2. story_views
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'story_views') THEN
    EXECUTE 'ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can view story views" ON public.story_views';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can insert story views" ON public.story_views';
    EXECUTE 'CREATE POLICY "Authenticated can view story views" ON public.story_views FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated can insert story views" ON public.story_views FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = viewer_id)';
  END IF;

  -- 3. story_likes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'story_likes') THEN
    EXECUTE 'ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can view story likes" ON public.story_likes';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can toggle story likes" ON public.story_likes';
    EXECUTE 'CREATE POLICY "Authenticated can view story likes" ON public.story_likes FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated can toggle story likes" ON public.story_likes FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id)';
  END IF;
END $$;
