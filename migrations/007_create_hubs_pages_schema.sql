-- Migration 007: Create Hubs Pages, Members, Posts, Reports & Chat Schema
-- Description: Adds tables and RLS policies for Clubs & News Outlet Pages, Membership, Page Posts, Reports and Club Group Messaging.

-- 1. Create Pages Table
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('club', 'news')),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  join_mode TEXT NOT NULL CHECK (join_mode IN ('open', 'request', 'follow_only')) DEFAULT 'open',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast status & type queries
CREATE INDEX IF NOT EXISTS idx_pages_status_type ON public.pages(status, type);
CREATE INDEX IF NOT EXISTS idx_pages_owner_id ON public.pages(owner_id);

-- Enable RLS on pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Pages RLS Policies
DROP POLICY IF EXISTS "Anyone signed in can read approved pages or owned/admin pages" ON public.pages;
CREATE POLICY "Anyone signed in can read approved pages or owned/admin pages"
  ON public.pages FOR SELECT
  USING (
    status = 'approved'
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Users can insert page requests as owner with pending status" ON public.pages;
CREATE POLICY "Users can insert page requests as owner with pending status"
  ON public.pages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND owner_id = auth.uid()
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "App admins or page owner/admins can update pages" ON public.pages;
CREATE POLICY "App admins or page owner/admins can update pages"
  ON public.pages FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.page_members
      WHERE page_id = pages.id AND user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "App admins or page owners can delete pages" ON public.pages;
CREATE POLICY "App admins or page owners can delete pages"
  ON public.pages FOR DELETE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );


-- 2. Create Page Members Table
CREATE TABLE IF NOT EXISTS public.page_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'follower')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending')) DEFAULT 'active',
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_page_user UNIQUE (page_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_page_members_page_id ON public.page_members(page_id);
CREATE INDEX IF NOT EXISTS idx_page_members_user_id ON public.page_members(user_id);

ALTER TABLE public.page_members ENABLE ROW LEVEL SECURITY;

-- Page Members RLS Policies
DROP POLICY IF EXISTS "Anyone signed in can read page members" ON public.page_members;
CREATE POLICY "Anyone signed in can read page members"
  ON public.page_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can join/follow or page admins can manage members" ON public.page_members;
CREATE POLICY "Users can join/follow or page admins can manage members"
  ON public.page_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.page_members pm
        WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
      ))
    )
  );

DROP POLICY IF EXISTS "Users update self or page admins update members" ON public.page_members;
CREATE POLICY "Users update self or page admins update members"
  ON public.page_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.page_members pm
        WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
      ))
    )
  );

DROP POLICY IF EXISTS "Users remove self or page admins remove members" ON public.page_members;
CREATE POLICY "Users remove self or page admins remove members"
  ON public.page_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.page_members pm
        WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
      ))
    )
  );


-- 3. Create Page Posts Table
CREATE TABLE IF NOT EXISTS public.page_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_page_posts_page_id ON public.page_posts(page_id);
CREATE INDEX IF NOT EXISTS idx_page_posts_status ON public.page_posts(status);

ALTER TABLE public.page_posts ENABLE ROW LEVEL SECURITY;

-- Page Posts RLS Policies
DROP POLICY IF EXISTS "Anyone signed in can read published page posts" ON public.page_posts;
CREATE POLICY "Anyone signed in can read published page posts"
  ON public.page_posts FOR SELECT
  USING (
    status = 'published'
    OR EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.page_members pm
        WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
      ))
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Page owners or page admins can insert posts" ON public.page_posts;
CREATE POLICY "Page owners or page admins can insert posts"
  ON public.page_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND p.status = 'approved' AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.page_members pm
          WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Page owners or page admins can update posts" ON public.page_posts;
CREATE POLICY "Page owners or page admins can update posts"
  ON public.page_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.page_members pm
          WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Page owners or page admins can delete posts" ON public.page_posts;
CREATE POLICY "Page owners or page admins can delete posts"
  ON public.page_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.page_members pm
          WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );


-- 4. Create Page Reports Table
CREATE TABLE IF NOT EXISTS public.page_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.page_posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'dismissed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.page_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App admins can view reports" ON public.page_reports;
CREATE POLICY "App admins can view reports"
  ON public.page_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.page_reports;
CREATE POLICY "Authenticated users can submit reports"
  ON public.page_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "App admins can update reports" ON public.page_reports;
CREATE POLICY "App admins can update reports"
  ON public.page_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
    )
  );


-- 5. Create Page Messages Table (Members-only club chat)
CREATE TABLE IF NOT EXISTS public.page_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_messages_page_id ON public.page_messages(page_id);

ALTER TABLE public.page_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active club members can view messages" ON public.page_messages;
CREATE POLICY "Active club members can view messages"
  ON public.page_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND p.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.page_members pm
      WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'member') AND pm.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Active club members can send messages" ON public.page_messages;
CREATE POLICY "Active club members can send messages"
  ON public.page_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.pages p
        WHERE p.id = page_id AND p.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.page_members pm
        WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'member') AND pm.status = 'active'
      )
    )
  );
