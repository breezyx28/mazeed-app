-- Migration: Nearby Products & Store Navigation System
-- Date: 2025-12-20
-- Description: Enables location-based product discovery and store navigation

-- ============================================================================
-- 1. USER CATEGORY INTERACTIONS TABLE
-- ============================================================================
-- Tracks user interactions with product categories to determine favorites

CREATE TABLE IF NOT EXISTS public.user_category_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  
  -- Interaction type: view (browsing), click (engaged), purchase (converted)
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'click', 'purchase')),
  
  -- Count of interactions (incremented on each interaction)
  interaction_count integer DEFAULT 1 CHECK (interaction_count > 0),
  
  -- Timestamps
  last_interaction_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Prevent duplicate entries for same user + category + type
  CONSTRAINT unique_user_category_interaction 
    UNIQUE(user_id, category_id, interaction_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_category_interactions_user 
  ON public.user_category_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_category_interactions_category 
  ON public.user_category_interactions(category_id);

CREATE INDEX IF NOT EXISTS idx_user_category_interactions_count 
  ON public.user_category_interactions(user_id, interaction_count DESC);

CREATE INDEX IF NOT EXISTS idx_user_category_interactions_recent 
  ON public.user_category_interactions(user_id, last_interaction_at DESC);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.user_category_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own interactions
CREATE POLICY "Users can view own category interactions" 
  ON public.user_category_interactions 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Users can insert their own interactions
CREATE POLICY "Users can create own category interactions" 
  ON public.user_category_interactions 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Users can update their own interactions
CREATE POLICY "Users can update own category interactions" 
  ON public.user_category_interactions 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function: Increment category interaction count
CREATE OR REPLACE FUNCTION increment_category_interaction(
  p_user_id uuid,
  p_category_id text,
  p_interaction_type text
)
RETURNS void AS $$
BEGIN
  -- Insert or update interaction count
  INSERT INTO public.user_category_interactions (
    user_id,
    category_id,
    interaction_type,
    interaction_count,
    last_interaction_at
  ) VALUES (
    p_user_id,
    p_category_id,
    p_interaction_type,
    1,
    now()
  )
  ON CONFLICT (user_id, category_id, interaction_type)
  DO UPDATE SET
    interaction_count = public.user_category_interactions.interaction_count + 1,
    last_interaction_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's favorite categories
CREATE OR REPLACE FUNCTION get_user_favorite_categories(
  p_user_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  category_id text,
  category_name text,
  category_name_ar text,
  total_interactions integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    c.name_ar as category_name_ar,
    SUM(uci.interaction_count)::integer as total_interactions
  FROM public.user_category_interactions uci
  JOIN public.categories c ON uci.category_id = c.id
  WHERE uci.user_id = p_user_id
  GROUP BY c.id, c.name, c.name_ar
  ORDER BY total_interactions DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get nearby products using Haversine formula
CREATE OR REPLACE FUNCTION get_nearby_products(
  p_user_lat double precision,
  p_user_lng double precision,
  p_category_id text,
  p_radius_km double precision DEFAULT 5,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  product_id text,
  product_name text,
  product_price numeric,
  product_image text,
  product_rating numeric,
  product_stock integer,
  seller_id uuid,
  seller_name text,
  seller_address text,
  seller_lat double precision,
  seller_lng double precision,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.price as product_price,
    p.image as product_image,
    COALESCE(p.rating, 0) as product_rating,
    p.stock_quantity as product_stock,
    s.id as seller_id,
    s.shop_name as seller_name,
    COALESCE((s.location->>'address')::text, '') as seller_address,
    (s.location->>'lat')::double precision as seller_lat,
    (s.location->>'lng')::double precision as seller_lng,
    -- Haversine formula for distance calculation (in kilometers)
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_user_lat)) * 
          cos(radians((s.location->>'lat')::double precision)) * 
          cos(radians((s.location->>'lng')::double precision) - radians(p_user_lng)) + 
          sin(radians(p_user_lat)) * 
          sin(radians((s.location->>'lat')::double precision))
        ))
      )
    ) as distance_km
  FROM public.products p
  JOIN public.sellers s ON p.seller_id = s.id
  WHERE 
    p.category_id = p_category_id
    AND p.status = 'published'
    AND p.stock_quantity > 0
    AND s.location IS NOT NULL
    AND (s.location->>'lat') IS NOT NULL
    AND (s.location->>'lng') IS NOT NULL
    -- Filter by radius using Haversine formula
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_user_lat)) * 
          cos(radians((s.location->>'lat')::double precision)) * 
          cos(radians((s.location->>'lng')::double precision) - radians(p_user_lng)) + 
          sin(radians(p_user_lat)) * 
          sin(radians((s.location->>'lat')::double precision))
        ))
      )
    ) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Get all nearby products (all categories)
CREATE OR REPLACE FUNCTION get_all_nearby_products(
  p_user_lat double precision,
  p_user_lng double precision,
  p_radius_km double precision DEFAULT 5,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  product_id text,
  product_name text,
  product_price numeric,
  product_image text,
  product_rating numeric,
  product_stock integer,
  category_id text,
  category_name text,
  seller_id uuid,
  seller_name text,
  seller_address text,
  seller_lat double precision,
  seller_lng double precision,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.price as product_price,
    p.image as product_image,
    COALESCE(p.rating, 0) as product_rating,
    p.stock_quantity as product_stock,
    p.category_id,
    c.name as category_name,
    s.id as seller_id,
    s.shop_name as seller_name,
    COALESCE((s.location->>'address')::text, '') as seller_address,
    (s.location->>'lat')::double precision as seller_lat,
    (s.location->>'lng')::double precision as seller_lng,
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_user_lat)) * 
          cos(radians((s.location->>'lat')::double precision)) * 
          cos(radians((s.location->>'lng')::double precision) - radians(p_user_lng)) + 
          sin(radians(p_user_lat)) * 
          sin(radians((s.location->>'lat')::double precision))
        ))
      )
    ) as distance_km
  FROM public.products p
  JOIN public.sellers s ON p.seller_id = s.id
  JOIN public.categories c ON p.category_id = c.id
  WHERE 
    p.status = 'published'
    AND p.stock_quantity > 0
    AND s.location IS NOT NULL
    AND (s.location->>'lat') IS NOT NULL
    AND (s.location->>'lng') IS NOT NULL
    AND (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_user_lat)) * 
          cos(radians((s.location->>'lat')::double precision)) * 
          cos(radians((s.location->>'lng')::double precision) - radians(p_user_lng)) + 
          sin(radians(p_user_lat)) * 
          sin(radians((s.location->>'lat')::double precision))
        ))
      )
    ) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 4. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.user_category_interactions IS 
  'Tracks user interactions with product categories to determine favorite categories for personalized recommendations';

COMMENT ON COLUMN public.user_category_interactions.interaction_type IS 
  'Type of interaction: view (browsing), click (engaged), purchase (converted)';

COMMENT ON COLUMN public.user_category_interactions.interaction_count IS 
  'Number of times user has interacted with this category in this way';

COMMENT ON FUNCTION increment_category_interaction IS 
  'Increments the interaction count for a user-category-type combination, or creates new record if not exists';

COMMENT ON FUNCTION get_user_favorite_categories IS 
  'Returns user''s top favorite categories based on total interaction counts across all interaction types';

COMMENT ON FUNCTION get_nearby_products IS 
  'Returns products within specified radius of user location, filtered by category, using Haversine distance formula';

COMMENT ON FUNCTION get_all_nearby_products IS 
  'Returns all products within specified radius of user location across all categories, using Haversine distance formula';
