-- Add social_media column to sellers table
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS social_media jsonb;

-- Update the RPC function to handle social_media
CREATE OR REPLACE FUNCTION public.rpc_update_seller_profile(
    p_shop_name text,
    p_shop_slug text,
    p_description text,
    p_location jsonb,
    p_opening_times jsonb,
    p_website text,
    p_logo_url text,
    p_social_media jsonb DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_seller_id uuid;
BEGIN
  -- 1) Get seller ID from auth.uid()
  SELECT id INTO v_seller_id 
  FROM public.sellers 
  WHERE profile_id = auth.uid();

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Seller profile not found for current user';
  END IF;

  -- 2) Update seller record
  UPDATE public.sellers
  SET
    shop_name = p_shop_name,
    shop_slug = COALESCE(p_shop_slug, shop_slug),
    description = p_description,
    location = p_location,
    opening_times = p_opening_times,
    website = p_website,
    logo_url = p_logo_url,
    social_media = COALESCE(p_social_media, social_media),
    updated_at = timezone('utc'::text, now())
  WHERE id = v_seller_id;
END;
$function$;
