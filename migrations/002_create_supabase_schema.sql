-- ==============================================================================
-- CAMPUS FOUNDRY: SUPABASE POSTGRESQL DDL & ROW LEVEL SECURITY (RLS)
-- Migration: 002_create_supabase_schema.sql
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE (Mirrors UserProfile & links to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    matric_number TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'trader', 'admin')),
    account_type TEXT NOT NULL DEFAULT 'BUYER' CHECK (account_type IN ('BUYER', 'TRADER')),
    university TEXT NOT NULL DEFAULT 'University of Ilorin (UNILORIN)',
    faculty TEXT,
    department TEXT,
    level TEXT CHECK (level IN ('100L', '200L', '300L', '400L', '500L', 'Postgraduate', 'Postgrad')),
    hostel_location TEXT,
    whatsapp TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    unilorin_domain TEXT NOT NULL DEFAULT 'students.unilorin.edu.ng',
    posts_count INT NOT NULL DEFAULT 0,
    followers_count INT NOT NULL DEFAULT 0,
    following_count INT NOT NULL DEFAULT 0,
    following_user_ids UUID[] DEFAULT '{}',
    blocked_user_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_matric ON public.profiles(matric_number);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ------------------------------------------------------------------------------
-- 3. OTP VERIFICATIONS TABLE (Encrypted Student Verification Storage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash TEXT NOT NULL UNIQUE,
    normalized_email TEXT NOT NULL,
    hashed_otp TEXT NOT NULL,
    salt TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts_left INT NOT NULL DEFAULT 5,
    daily_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at);

-- ------------------------------------------------------------------------------
-- 4. STUDENT BUSINESSES TABLE (Marketplace ventures)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    category TEXT NOT NULL,
    university TEXT NOT NULL DEFAULT 'University of Ilorin',
    campus TEXT NOT NULL DEFAULT 'Permanent Site',
    hostel_location TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_email TEXT,
    student_faculty TEXT,
    student_dept TEXT,
    student_level TEXT,
    whatsapp TEXT NOT NULL,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    reviews_count INT NOT NULL DEFAULT 0,
    accepts_hostel_delivery BOOLEAN NOT NULL DEFAULT TRUE,
    starting_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_url TEXT,
    badge TEXT,
    verified_student BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.student_businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.student_businesses(category);

-- ------------------------------------------------------------------------------
-- 5. CAMPUS POSTS TABLE (Social Feed)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campus_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_username TEXT,
    author_avatar TEXT,
    author_dept TEXT,
    author_level TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'student',
    author_business_id UUID REFERENCES public.student_businesses(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video')),
    location_tag TEXT,
    likes_count INT NOT NULL DEFAULT 0,
    comments_count INT NOT NULL DEFAULT 0,
    reshares_count INT NOT NULL DEFAULT 0,
    reactions JSONB DEFAULT '{"heart": 0, "fire": 0, "lightbulb": 0, "clap": 0}'::jsonb,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    restricted_user_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.campus_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.campus_posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.campus_posts(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. CAMPUS COMMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campus_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_username TEXT,
    author_avatar TEXT,
    author_level TEXT,
    author_dept TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.campus_comments(post_id, created_at ASC);

-- ------------------------------------------------------------------------------
-- 7. 24-HOUR CAMPUS SNAPS TABLE (Status/Stories)
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_snaps_active ON public.campus_snaps(expires_at DESC);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_snaps ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- OTP Verifications: Service role only
CREATE POLICY "Service role full access on OTP"
ON public.otp_verifications TO service_role USING (true) WITH CHECK (true);

-- Student Businesses Policies
CREATE POLICY "Businesses viewable by all authenticated users"
ON public.student_businesses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can create businesses"
ON public.student_businesses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update businesses"
ON public.student_businesses FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete businesses"
ON public.student_businesses FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Campus Posts Policies
CREATE POLICY "Posts viewable by all authenticated users"
ON public.campus_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authors can create posts"
ON public.campus_posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
ON public.campus_posts FOR UPDATE TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
ON public.campus_posts FOR DELETE TO authenticated
USING (auth.uid() = author_id);

-- Campus Comments Policies
CREATE POLICY "Comments viewable by authenticated users"
ON public.campus_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authors can insert comments"
ON public.campus_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments"
ON public.campus_comments FOR DELETE TO authenticated
USING (auth.uid() = author_id);

-- ------------------------------------------------------------------------------
-- 9. AUTH TRIGGER (Auto-create profile upon Supabase signup)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    matric_number,
    role,
    account_type,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'matric_number',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'trader' THEN 'TRADER' ELSE 'BUYER' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
