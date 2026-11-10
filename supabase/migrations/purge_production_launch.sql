-- ============================================================================
-- CAMPUS FOUNDRY - PRODUCTION LAUNCH ADMINISTRATIVE PURGE SCRIPT
-- Database Setup: Supabase (PostgreSQL 15+ with Auth & Storage)
-- ============================================================================
-- Execute this script directly in the Supabase SQL Editor or via psql client.
--
-- What this script executes:
-- 1. Preserves table structures, indexes, foreign keys, and super-admin accounts.
-- 2. Truncates all operational records: posts, snaps, stores, products, orders, comments, messages.
-- 3. Empties media objects from storage.objects table across all buckets.
-- 4. Deletes all non-admin user accounts from auth.users and public.profiles.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. TRUNCATE ALL OPERATIONAL CONTENT & MARKETPLACE TABLES
--    (CASCADE automatically handles foreign key references cleanly)
-- ----------------------------------------------------------------------------
TRUNCATE TABLE 
  public.product_orders,
  public.marketplace_products,
  public.student_businesses,
  public.campus_comments,
  public.campus_posts,
  public.campus_snaps,
  public.chat_messages,
  public.chat_conversations,
  public.marketplace_messages,
  public.marketplace_conversations
RESTART IDENTITY CASCADE;

-- Fallback check for singular snap table name if present
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campus_snap') THEN
    EXECUTE 'TRUNCATE TABLE public.campus_snap RESTART IDENTITY CASCADE;';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 2. CLEAR ALL MEDIA FILES & OBJECTS FROM STORAGE BUCKETS
-- ----------------------------------------------------------------------------
DELETE FROM storage.objects
WHERE bucket_id IN ('avatars', 'media', 'businesses', 'audio', 'voice-notes', 'player-cards');


-- ----------------------------------------------------------------------------
-- 3. DELETE NON-ADMIN USERS FROM PUBLIC PROFILES & AUTH SERVICE
--    (Preserves super-admin email accounts specified below)
-- ----------------------------------------------------------------------------
-- Declare super-admin emails to preserve (e.g. adeyink7@gmail.com)
WITH super_admins AS (
  SELECT id FROM auth.users
  WHERE LOWER(email) IN ('adeyink7@gmail.com', 'admin@campusfoundry.app')
)
-- Delete profiles for non-admin users
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM super_admins);

-- Delete non-admin accounts from Supabase Auth service (auth.users)
DELETE FROM auth.users
WHERE LOWER(email) NOT IN ('adeyink7@gmail.com', 'admin@campusfoundry.app');


-- ----------------------------------------------------------------------------
-- 4. VERIFY SYSTEM AT ZERO STATE (METRICS AUDIT)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_posts INT;
  v_stores INT;
  v_orders INT;
  v_users INT;
BEGIN
  SELECT COUNT(*) INTO v_posts FROM public.campus_posts;
  SELECT COUNT(*) INTO v_businesses FROM public.student_businesses;
  SELECT COUNT(*) INTO v_users FROM auth.users WHERE LOWER(email) NOT IN ('adeyink7@gmail.com');
  
  RAISE NOTICE '--- LAUNCH PURGE AUDIT RESULTS ---';
  RAISE NOTICE 'Remaining Non-Admin Auth Users: %', v_users;
  RAISE NOTICE 'Remaining Campus Posts: %', v_posts;
  RAISE NOTICE 'Remaining Stores: %', v_businesses;
END $$;

COMMIT;

-- ============================================================================
-- END OF LAUNCH PURGE SCRIPT
-- ============================================================================
