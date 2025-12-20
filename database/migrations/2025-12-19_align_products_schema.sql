-- Migration: Align products schema and ensure product_videos exists
-- Date: 2025-12-19

-- 1. Add discount_percentage if not exists (to be explicit about percentage vs amount)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0;

-- 2. Add sizes and material (useful common e-commerce fields)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS material text;

-- 3. Ensure constraints on discount_percentage
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS check_discount_percentage;

ALTER TABLE public.products 
ADD CONSTRAINT check_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- 4. Create product_videos table if it doesn't exist (used in ProductEditor)
CREATE TABLE IF NOT EXISTS public.product_videos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id text REFERENCES public.products(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  video_type text CHECK (video_type IN ('uploaded', 'external', 'youtube', 'vimeo')),
  caption text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on product_videos
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for product_videos
DROP POLICY IF EXISTS "Public view active product videos" ON public.product_videos;
CREATE POLICY "Public view active product videos" ON public.product_videos 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Sellers manage their own product videos" ON public.product_videos;
CREATE POLICY "Sellers manage their own product videos" ON public.product_videos 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.sellers s ON p.seller_id = s.id
      WHERE p.id = product_videos.product_id AND s.profile_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.sellers s ON p.seller_id = s.id
      WHERE p.id = product_videos.product_id AND s.profile_id = auth.uid()
    )
  );

-- 5. Fix potential type mismatch for id in product_videos
-- Note: public.products(id) is 'text' in the provided schema, so product_videos.product_id must be 'text'.
-- The CREATE TABLE above uses 'text', so it matches.
