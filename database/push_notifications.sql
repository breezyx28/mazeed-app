-- Push Notification Tokens Table
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token text NOT NULL,
    platform text NOT NULL, -- 'android', 'ios', 'web'
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, token)
);

-- Trigger to notify seller when a new order item is created
CREATE OR REPLACE FUNCTION notify_seller_on_order()
RETURNS TRIGGER AS $$
DECLARE
    v_seller_profile_id uuid;
    v_product_name text;
    v_order_id uuid;
BEGIN
    -- Get the profile_id of the seller associated with this seller record
    SELECT profile_id INTO v_seller_profile_id
    FROM public.sellers
    WHERE id = NEW.seller_id;

    -- Get product name
    SELECT name INTO v_product_name
    FROM public.products
    WHERE id = NEW.product_id;

    v_order_id := NEW.order_id;

    -- Insert into notifications table
    -- The 'data' field (jsonb) can store metadata for auto-navigation
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        data
    ) VALUES (
        v_seller_profile_id,
        'طلب جديد!',
        'لقد تلقيت طلباً جديداً لمنتج ' || v_product_name,
        'order',
        jsonb_build_object('order_id', v_order_id, 'type', 'order')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if columns exist and add them if necessary
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE public.notifications ADD COLUMN data jsonb DEFAULT '{}'::jsonb;
    END IF;
END
$$;

DROP TRIGGER IF EXISTS trigger_notify_seller_on_order ON public.order_items;
CREATE TRIGGER trigger_notify_seller_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION notify_seller_on_order();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
