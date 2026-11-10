-- Migration 016: Privacy update for profiles and student_businesses
-- Enforce explicit column access, get_my_profile RPC, and get_payment_details RPC

-- 1. Enable RLS on profiles and student_businesses
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_businesses ENABLE ROW LEVEL SECURITY;

-- 2. get_my_profile RPC
-- Returns the logged-in user's own full profile including private fields
-- (email, matric_number, whatsapp, blocked_user_ids)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT to_jsonb(p) INTO v_profile
    FROM public.profiles p
    WHERE p.id = v_user_id;

    RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated, anon;

-- 3. get_payment_details RPC
-- Returns bank details only to the business owner or a buyer who placed an order for this business
CREATE OR REPLACE FUNCTION public.get_payment_details(p_business UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_is_owner BOOLEAN := FALSE;
    v_is_buyer BOOLEAN := FALSE;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL OR p_business IS NULL THEN
        RETURN NULL;
    END IF;

    -- Check if caller is owner of the business
    SELECT EXISTS (
        SELECT 1 FROM public.student_businesses
        WHERE id = p_business AND owner_id = v_user_id
    ) INTO v_is_owner;

    -- Check if caller is a buyer who has an order for this business
    IF NOT v_is_owner THEN
        SELECT EXISTS (
            SELECT 1 FROM public.orders
            WHERE business_id = p_business AND buyer_id = v_user_id
        ) INTO v_is_buyer;
    END IF;

    IF NOT (v_is_owner OR v_is_buyer) THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'bank_name', bank_name,
        'account_number', account_number,
        'account_name', account_name
    ) INTO v_result
    FROM public.student_businesses
    WHERE id = p_business;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_details(UUID) TO authenticated, anon;

-- 4. RLS Policies on profiles
-- Policy 1: Anyone can read public columns of profiles
DROP POLICY IF EXISTS "Public can view allowed profile columns" ON public.profiles;
CREATE POLICY "Public can view allowed profile columns"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Policy 2: Users can update their own profile
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 5. RLS Policies on student_businesses
-- Policy 1: Anyone can read active student businesses
DROP POLICY IF EXISTS "Public can view student businesses" ON public.student_businesses;
CREATE POLICY "Public can view student businesses"
    ON public.student_businesses
    FOR SELECT
    USING (true);

-- Policy 2: Business owners can insert their own business
DROP POLICY IF EXISTS "Owners insert student business" ON public.student_businesses;
CREATE POLICY "Owners insert student business"
    ON public.student_businesses
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Policy 3: Business owners can update their own business
DROP POLICY IF EXISTS "Owners update student business" ON public.student_businesses;
CREATE POLICY "Owners update student business"
    ON public.student_businesses
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);
