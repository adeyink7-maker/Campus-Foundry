-- ==============================================================================
-- CAMPUS FOUNDRY: CHAT CONVERSATIONS & CHAT MESSAGES RLS POLICIES & SCHEMA
-- Migration: 005_fix_chat_conversations_and_chat_messages_rls.sql
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure chat_conversations table exists with all standard columns
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    business_name TEXT,
    business_image_url TEXT,
    trader_name TEXT NOT NULL,
    trader_id UUID NOT NULL,
    trader_hostel TEXT,
    buyer_id UUID NOT NULL,
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

-- Ensure all optional columns exist on chat_conversations
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS trader_hostel TEXT;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS buyer_email TEXT;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS unread_count INT DEFAULT 0;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS is_message_request BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS request_status TEXT DEFAULT 'accepted';
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT TRUE;
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS last_seen TEXT DEFAULT 'Online';
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS chat_theme TEXT DEFAULT 'emerald';
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ensure chat_messages table exists with all standard columns (including voice note fields)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    voice_note_url TEXT,
    voice_duration NUMERIC(6, 2),
    voice_waveform JSONB,
    text TEXT DEFAULT '',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_state TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_state IN ('sending', 'sent', 'delivered', 'read')),
    business_id TEXT,
    business_name TEXT,
    sender_name TEXT,
    sender_role TEXT DEFAULT 'student',
    recipient_name TEXT,
    hostel_location TEXT,
    order_snippet JSONB,
    attachment_url TEXT,
    attachment_type TEXT,
    attachment_name TEXT,
    reply_to_message JSONB,
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure voice note and chat columns exist on chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS voice_note_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS voice_duration NUMERIC(6, 2);
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS voice_waveform JSONB;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS order_snippet JSONB;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS business_id TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'student';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS delivery_state TEXT DEFAULT 'sent';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS hostel_location TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to_message JSONB;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- 4. Grant table privileges to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.chat_conversations TO anon, authenticated;
GRANT ALL ON TABLE public.chat_messages TO anon, authenticated;

-- 5. Enable RLS on chat_conversations and configure policies
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can insert chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can update chat_conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can delete chat_conversations" ON public.chat_conversations;

CREATE POLICY "Public can view chat_conversations"
ON public.chat_conversations FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Public can insert chat_conversations"
ON public.chat_conversations FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can update chat_conversations"
ON public.chat_conversations FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete chat_conversations"
ON public.chat_conversations FOR DELETE TO anon, authenticated
USING (true);

-- 6. Enable RLS on chat_messages and configure policies
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public can insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public can update chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public can delete chat_messages" ON public.chat_messages;

CREATE POLICY "Public can view chat_messages"
ON public.chat_messages FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Public can insert chat_messages"
ON public.chat_messages FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public can update chat_messages"
ON public.chat_messages FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete chat_messages"
ON public.chat_messages FOR DELETE TO anon, authenticated
USING (true);

-- 7. Ensure storage bucket 'audio' has public and authenticated policies
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

DROP POLICY IF EXISTS "Public can read audio files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload audio voice notes" ON storage.objects;

CREATE POLICY "Public can read audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Anyone can upload audio voice notes"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'audio');
