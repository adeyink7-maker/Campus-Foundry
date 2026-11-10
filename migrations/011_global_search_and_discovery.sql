-- Migration 011: Global Search, Balanced People Discovery RPC, and Snap Delete RLS & Policies
-- Run these sequentially in your Supabase SQL editor.

-- 1. Enable pg_trgm extension for fast similarity and ILIKE search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Indexes for Global Search performance
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin ((coalesce(full_name,'') || ' ' || coalesce(username,'')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pages_search ON pages USING gin ((coalesce(name,'') || ' ' || coalesce(description,'')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin ((coalesce(title,'') || ' ' || coalesce(description,'')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_campus_posts_search ON campus_posts USING gin (coalesce(content,'') gin_trgm_ops);

-- 3. RLS Policy for Snaps Delete (Owners can delete their own snaps)
-- Note: Replace 'campus_snaps' with your actual table name if different.
ALTER TABLE IF EXISTS campus_snaps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can delete their own snaps" ON campus_snaps;
CREATE POLICY "Users can delete their own snaps"
  ON campus_snaps
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- 4. Balanced People Discovery RPC function
CREATE OR REPLACE FUNCTION get_balanced_people_suggestions(
  p_user_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  faculty TEXT,
  department TEXT,
  level TEXT,
  hostel_location TEXT,
  is_verified BOOLEAN,
  bio TEXT,
  suggestion_reason TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_faculty TEXT;
  v_department TEXT;
  v_level TEXT;
  v_hostel TEXT;
  v_following UUID[];
  v_blocked UUID[];
BEGIN
  -- Get user profile details
  SELECT faculty, department, level, hostel_location, 
         COALESCE(following_user_ids, ARRAY[]::UUID[]),
         COALESCE(blocked_user_ids, ARRAY[]::UUID[])
  INTO v_faculty, v_department, v_level, v_hostel, v_following, v_blocked
  FROM profiles
  WHERE profiles.id = p_user_id;

  -- Ensure user is excluded alongside followed and blocked users
  v_following := array_append(v_following, p_user_id);
  v_following := v_following || v_blocked;

  RETURN QUERY
  (
    -- Bucket 1: Same Department or Level (50% weight)
    SELECT p.id, p.full_name, p.username, p.avatar_url, p.faculty, p.department, p.level, p.hostel_location, p.is_verified, p.bio,
           CASE WHEN p.department = v_department THEN 'Same department' ELSE 'Same level' END::TEXT as suggestion_reason
    FROM profiles p
    WHERE NOT (p.id = ANY(v_following))
      AND (p.department = v_department OR p.level = v_level)
    ORDER BY RANDOM()
    LIMIT GREATEST(5, p_limit / 2)
  )
  UNION
  (
    -- Bucket 2: Same Faculty, Hostel or Mutual/Proximity (30% weight)
    SELECT p.id, p.full_name, p.username, p.avatar_url, p.faculty, p.department, p.level, p.hostel_location, p.is_verified, p.bio,
           CASE WHEN p.faculty = v_faculty THEN 'Same faculty' ELSE 'Same hostel' END::TEXT as suggestion_reason
    FROM profiles p
    WHERE NOT (p.id = ANY(v_following))
      AND NOT (p.id IN (SELECT id FROM profiles WHERE department = v_department OR level = v_level))
      AND (p.faculty = v_faculty OR (v_hostel IS NOT NULL AND p.hostel_location = v_hostel))
    ORDER BY RANDOM()
    LIMIT GREATEST(3, (p_limit * 3) / 10)
  )
  UNION
  (
    -- Bucket 3: Random active students across other faculties (20% weight)
    SELECT p.id, p.full_name, p.username, p.avatar_url, p.faculty, p.department, p.level, p.hostel_location, p.is_verified, p.bio,
           'Discover'::TEXT as suggestion_reason
    FROM profiles p
    WHERE NOT (p.id = ANY(v_following))
      AND NOT (p.id IN (
        SELECT id FROM profiles 
        WHERE department = v_department OR level = v_level OR faculty = v_faculty OR (v_hostel IS NOT NULL AND hostel_location = v_hostel)
      ))
    ORDER BY RANDOM()
    LIMIT GREATEST(2, p_limit / 5)
  )
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_balanced_people_suggestions TO authenticated, anon;
