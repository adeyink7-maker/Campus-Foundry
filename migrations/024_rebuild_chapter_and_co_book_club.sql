-- Migration 024: Rebuild and Refine Chapter & Co Book Club
-- Description: Updates Chapter & Co club metadata, assigns owner_email to akanbighaniyat896@gmail.com, and resolves owner_id from existing profiles.

-- 1. Ensure columns exist on public.pages
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

-- 2. Upsert Chapter & Co Book Club Page Record
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
  '9 November 2026',
  ARRAY[
    'Book of the Month',
    'Physical Meetups',
    'Member''s Picks',
    'Virtual Discussions',
    'Guest Sessions',
    'Read and Chill',
    'Chapter Chat',
    'Page Talk'
  ],
  '₦2,000, one-time payment',
  'Payment and registration are handled by the club, not inside the app.',
  '{"primary": "#FF7A1A", "accent": "#10B981", "cream": "#FFFDF7"}',
  '{"joinFormUrl": "https://forms.gle/PH2wLwkGVrtPKs16A", "instagramUrl": "https://www.instagram.com/ilorin_bookclub", "tiktokHandle": "ilorin_bookclub"}',
  NULL,
  'akanbighaniyat896@gmail.com',
  TRUE,
  'open',
  'approved',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
  '2026-11-09T08:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
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
  owner_email = EXCLUDED.owner_email,
  is_verified = TRUE,
  status = 'approved';

-- 3. Assign Owner Role to akanbighaniyat896@gmail.com if already signed up in profiles
DO $$
DECLARE
  v_owner_id UUID;
  v_page_id UUID := 'c4a973a0-9e6e-44ef-94c6-e91d6df4b001';
BEGIN
  SELECT id INTO v_owner_id 
  FROM public.profiles 
  WHERE LOWER(TRIM(email)) = 'akanbighaniyat896@gmail.com' 
  LIMIT 1;

  IF v_owner_id IS NOT NULL THEN
    UPDATE public.pages 
    SET owner_id = v_owner_id, owner_email = 'akanbighaniyat896@gmail.com'
    WHERE id = v_page_id OR slug = 'chapter-and-co-book-club';

    INSERT INTO public.page_members (page_id, user_id, role, status, is_muted)
    VALUES (v_page_id, v_owner_id, 'owner', 'active', false)
    ON CONFLICT (page_id, user_id) 
    DO UPDATE SET role = 'owner', status = 'active';
  END IF;
END $$;
