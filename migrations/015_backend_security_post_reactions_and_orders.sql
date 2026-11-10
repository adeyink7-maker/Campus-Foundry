-- ==============================================================================
-- CAMPUS FOUNDRY: POST REACTIONS & ORDER SECURITY MIGRATION
-- Migration: 015_backend_security_post_reactions_and_orders.sql
-- ==============================================================================

-- 1. POST REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.campus_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL DEFAULT 'heart',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_post_user_reaction UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON public.post_reactions(user_id);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Post reactions policies
DROP POLICY IF EXISTS "Public read post reactions" ON public.post_reactions;
CREATE POLICY "Public read post reactions"
ON public.post_reactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own post reaction" ON public.post_reactions;
CREATE POLICY "Users insert own post reaction"
ON public.post_reactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own post reaction" ON public.post_reactions;
CREATE POLICY "Users update own post reaction"
ON public.post_reactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own post reaction" ON public.post_reactions;
CREATE POLICY "Users delete own post reaction"
ON public.post_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 2. TRIGGER TO MAINTAIN POST LIKES & REACTIONS
CREATE OR REPLACE FUNCTION public.sync_post_reactions_count()
RETURNS TRIGGER AS $$
DECLARE
    target_post_id UUID;
    total_likes INT;
BEGIN
    target_post_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.post_id ELSE NEW.post_id END;
    SELECT COUNT(*) INTO total_likes FROM public.post_reactions WHERE post_id = target_post_id;
    UPDATE public.campus_posts SET likes_count = total_likes WHERE id = target_post_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_reactions ON public.post_reactions;
CREATE TRIGGER trg_sync_post_reactions
AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.sync_post_reactions_count();

-- 3. CONFIRM DELIVERY RPC (Trader calls with p_order, p_pin)
CREATE OR REPLACE FUNCTION public.confirm_delivery(p_order UUID, p_pin TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    actual_pin TEXT;
    order_record RECORD;
BEGIN
    -- Verify caller is trader of this order
    SELECT * INTO order_record FROM public.orders WHERE id = p_order;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF order_record.trader_id != auth.uid() THEN
        RAISE EXCEPTION 'Only the assigned trader can confirm delivery';
    END IF;

    -- Verify delivery PIN against order_secrets
    SELECT delivery_pin INTO actual_pin FROM public.order_secrets WHERE order_id = p_order;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Delivery PIN not generated for this order';
    END IF;

    IF TRIM(actual_pin) != TRIM(p_pin) THEN
        RETURN FALSE;
    END IF;

    -- Update order status to delivered
    UPDATE public.orders
    SET status = 'delivered',
        delivered_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ORDER SECRETS RLS: Traders MUST NEVER read order_secrets
DROP POLICY IF EXISTS "Traders read order_secrets" ON public.order_secrets;
DROP POLICY IF EXISTS "Buyers read own order_secrets" ON public.order_secrets;
CREATE POLICY "Buyers read own order_secrets"
ON public.order_secrets FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_secrets.order_id
        AND o.buyer_id = auth.uid()
    )
);

-- 5. REVIEWS RLS: Allowed only after order is delivered
DROP POLICY IF EXISTS "Users create reviews for delivered orders" ON public.reviews;
CREATE POLICY "Users create reviews for delivered orders"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = reviews.order_id
        AND o.buyer_id = auth.uid()
        AND o.status = 'delivered'
    )
);

-- 6. ORDERS UPDATE RLS: Buyers only cancel pending orders, traders set payment_status
DROP POLICY IF EXISTS "Buyers cancel pending orders" ON public.orders;
CREATE POLICY "Buyers cancel pending orders"
ON public.orders FOR UPDATE TO authenticated
USING (
    buyer_id = auth.uid() AND status = 'pending'
)
WITH CHECK (
    buyer_id = auth.uid() AND status = 'cancelled'
);

DROP POLICY IF EXISTS "Traders update order status and payment" ON public.orders;
CREATE POLICY "Traders update order status and payment"
ON public.orders FOR UPDATE TO authenticated
USING (
    trader_id = auth.uid()
)
WITH CHECK (
    trader_id = auth.uid()
);
