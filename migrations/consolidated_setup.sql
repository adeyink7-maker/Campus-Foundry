-- ==============================================================================
-- CAMPUS FOUNDRY: ULTIMATE SCHEMA MIGRATION (Consolidated)
-- Description: Creates all tables, indexes, RLS policies, and triggers.
-- Run this in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. PROFILES TABLE
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
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    staff_role TEXT,
    unilorin_domain TEXT NOT NULL DEFAULT 'students.unilorin.edu.ng',
    posts_count INT NOT NULL DEFAULT 0,
    followers_count INT NOT NULL DEFAULT 0,
    following_count INT NOT NULL DEFAULT 0,
    following_user_ids UUID[] DEFAULT '{}',
    blocked_user_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin ((coalesce(full_name,'') || ' ' || coalesce(username,'')) gin_trgm_ops);

-- 3. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- 4. STUDENT BUSINESSES
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
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.student_businesses(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('good', 'service')),
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    images TEXT[],
    category TEXT NOT NULL,
    estimated_time TEXT,
    stock_quantity INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sold_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin ((coalesce(title,'') || ' ' || coalesce(description,'')) gin_trgm_ops);

-- 6. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,
    business_id UUID NOT NULL REFERENCES public.student_businesses(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    buyer_name TEXT,
    buyer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    delivery_address TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    cancel_reason TEXT,
    accepted_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.order_secrets (
    order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
    delivery_pin TEXT NOT NULL
);

-- 7. CAMPUS POSTS & COMMENTS
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

CREATE INDEX IF NOT EXISTS idx_campus_posts_search ON campus_posts USING gin (coalesce(content,'') gin_trgm_ops);

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

-- 8. CAMPUS SNAPS & VIEWS
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

CREATE TABLE IF NOT EXISTS public.snap_views (
    snap_id UUID NOT NULL REFERENCES public.campus_snaps(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (snap_id, viewer_id)
);

-- 9. HUBS / PAGES
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('club', 'news')),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  join_mode TEXT NOT NULL CHECK (join_mode IN ('open', 'request', 'follow_only')) DEFAULT 'open',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_search ON pages USING gin ((coalesce(name,'') || ' ' || coalesce(description,'')) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.page_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'follower')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending')) DEFAULT 'active',
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_page_user UNIQUE (page_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.page_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('announcement', 'event', 'poll', 'article', 'breaking')),
  title TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  event_date TIMESTAMPTZ,
  event_location TEXT,
  poll_options JSONB,
  is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('published', 'pending', 'removed')) DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.page_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.page_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.page_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CHATS
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID,
    business_name TEXT,
    business_image_url TEXT,
    trader_name TEXT NOT NULL,
    trader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trader_hostel TEXT,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- 11. MARKETPLACE CHATS
CREATE TABLE IF NOT EXISTS public.marketplace_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.student_businesses(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    buyer_unread INT NOT NULL DEFAULT 0,
    trader_unread INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketplace_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.marketplace_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    attachment_url TEXT,
    attachment_type TEXT,
    voice_note_url TEXT,
    voice_duration INT,
    read_at TIMESTAMPTZ,
    reply_to UUID REFERENCES public.marketplace_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. REVIEWS & MISC
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.student_businesses(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    candidate_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- 13. ENABLE RLS
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 14. POLICIES (Idempotent)

-- Profiles
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Follows
DROP POLICY IF EXISTS "Public read follows" ON public.follows;
CREATE POLICY "Public read follows" ON public.follows FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own follows" ON public.follows;
CREATE POLICY "Users manage own follows" ON public.follows FOR ALL TO authenticated USING (auth.uid() = follower_id);

-- Snaps & Views
DROP POLICY IF EXISTS "Public read snaps" ON public.campus_snaps;
CREATE POLICY "Public read snaps" ON public.campus_snaps FOR SELECT TO authenticated USING (expires_at > now());
DROP POLICY IF EXISTS "Users manage own snaps" ON public.campus_snaps;
CREATE POLICY "Users manage own snaps" ON public.campus_snaps FOR ALL TO authenticated USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Public read snap views" ON public.snap_views;
CREATE POLICY "Public read snap views" ON public.snap_views FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users insert snap views" ON public.snap_views;
CREATE POLICY "Users insert snap views" ON public.snap_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

-- Hubs & Pages
DROP POLICY IF EXISTS "Anyone read approved pages" ON public.pages;
CREATE POLICY "Anyone read approved pages" ON public.pages FOR SELECT USING (status = 'approved' OR owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR staff_role IN ('super_admin', 'page_moderator'))));
DROP POLICY IF EXISTS "Anyone read published page posts" ON public.page_posts;
CREATE POLICY "Anyone read published page posts" ON public.page_posts FOR SELECT USING (status = 'published' OR EXISTS (SELECT 1 FROM public.pages p WHERE p.id = page_id AND (p.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.page_members pm WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'))) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR staff_role = 'super_admin')));

-- Marketplace
DROP POLICY IF EXISTS "Public read businesses" ON public.student_businesses;
CREATE POLICY "Public read businesses" ON public.student_businesses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR trader_id = auth.uid());

-- Chats
DROP POLICY IF EXISTS "Users view own conversations" ON public.chat_conversations;
CREATE POLICY "Users view own conversations" ON public.chat_conversations FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR trader_id = auth.uid());
DROP POLICY IF EXISTS "Users view own messages" ON public.chat_messages;
CREATE POLICY "Users view own messages" ON public.chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND (buyer_id = auth.uid() OR trader_id = auth.uid())));

-- 15. GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 16. AUTH TRIGGER
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 17. SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';
