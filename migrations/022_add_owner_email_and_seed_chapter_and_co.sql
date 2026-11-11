-- Migration 022: Add owner_email and club metadata columns to pages, and seed Chapter & Co Book Club
-- Description: Supports admin-seeded pages without initial owner_id, auto-assignment via owner_email, and rich club metadata.

-- 1. Alter pages table to allow null owner_id and add metadata columns
ALTER TABLE public.pages ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS motto TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS status_badge TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS launch_date TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS activities TEXT[];
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS membership_fee TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS membership_info TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS brand_colors JSONB;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS external_links JSONB;

CREATE INDEX IF NOT EXISTS idx_pages_owner_email ON public.pages(LOWER(owner_email));

-- 2. Update RLS policies to allow owners with matching email to update page & post
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App admins or page owner/admins can update pages" ON public.pages;
CREATE POLICY "App admins or page owner/admins can update pages"
  ON public.pages FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR (owner_email IS NOT NULL AND LOWER(owner_email) = LOWER(auth.jwt()->>'email'))
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR staff_role IN ('super_admin', 'page_moderator'))
    )
    OR EXISTS (
      SELECT 1 FROM public.page_members
      WHERE page_id = pages.id AND user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

ALTER TABLE public.page_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Page owners or page admins can insert posts" ON public.page_posts;
CREATE POLICY "Page owners or page admins can insert posts"
  ON public.page_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id AND p.status = 'approved' AND (
        p.owner_id = auth.uid()
        OR (p.owner_email IS NOT NULL AND LOWER(p.owner_email) = LOWER(auth.jwt()->>'email'))
        OR EXISTS (
          SELECT 1 FROM public.page_members pm
          WHERE pm.page_id = page_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin') AND pm.status = 'active'
        )
      )
    )
  );

-- 3. Seed Chapter & Co Book Club
INSERT INTO public.pages (
  id,
  type,
  name,
  slug,
  description,
  tagline,
  motto,
  category,
  status_badge,
  launch_date,
  activities,
  membership_fee,
  membership_info,
  brand_colors,
  external_links,
  owner_id,
  owner_email,
  is_verified,
  join_mode,
  status,
  logo_url,
  cover_url,
  created_at
) VALUES (
  'c4a973a0-9e6e-44ef-94c6-e91d6df4b001',
  'club',
  'Chapter & Co Book Club',
  'chapter-and-co-book-club',
  'What if reading became more than just a personal activity? What if it became an opportunity to connect with people, exchange ideas, discover new perspectives and grow together? That''s the idea behind Chapter & Co. If you''ve been looking for a community that inspires you to read, think, connect and grow, this is your invitation. Join us as one of our founding members!',
  'Read. Reflect. Connect.',
  'Creativity is intelligence having fun.',
  'Books & Reading',
  'Newly launched',
  'Monday, 9 November 2026',
  ARRAY[
    'Book of the Month',
    'Physical Meetups',
    'Member''s Picks',
    'Virtual Discussions',
    'Guest Sessions',
    'Read and Chill',
    'Chapter Chat',
    'Page Talk',
    'and many more'
  ],
  '₦2,000, one-time payment',
  'Payment and registration are handled by the club, not inside the app.',
  '{"primary": "#FF7A1A", "accent": "#10B981", "cream": "#FFFDF7"}',
  '{"joinFormUrl": "https://forms.gle/PH2wLwkGVrtPKs16A", "instagramUrl": "https://www.instagram.com/ilorin_bookclub", "tiktokHandle": "ilorin_bookclub"}',
  NULL,
  NULL,
  TRUE,
  'open',
  'approved',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
  '2026-11-09T08:00:00Z'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tagline = EXCLUDED.tagline,
  motto = EXCLUDED.motto,
  category = EXCLUDED.category,
  status_badge = EXCLUDED.status_badge,
  launch_date = EXCLUDED.launch_date,
  activities = EXCLUDED.activities,
  membership_fee = EXCLUDED.membership_fee,
  membership_info = EXCLUDED.membership_info,
  brand_colors = EXCLUDED.brand_colors,
  external_links = EXCLUDED.external_links,
  is_verified = TRUE,
  status = 'approved';
