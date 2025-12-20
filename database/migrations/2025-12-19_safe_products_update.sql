-- Migration: Add missing product fields and adjust for product_videos
-- Date: 2025-12-19

-- 1. Unify product discount usage (using existing 'discount' column for percentage 0-100)
DO $$ BEGIN
  ALTER TABLE public.products ADD CONSTRAINT check_discount_percentage CHECK (discount >= 0 AND discount <= 100);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add sizes and material (attributes missing from previous schema)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS material text;

-- 3. Ensure product_videos table exists and has correct structure (safe creation)
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

-- 4. Apply RLS to product_videos if not already enabled
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

-- 5. Policies for product_videos (using DO block to avoid 'policy already exists' errors)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public view active product videos" ON public.product_videos;
  CREATE POLICY "Public view active product videos" ON public.product_videos 
    FOR SELECT USING (is_active = true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Sellers manage their own product videos" ON public.product_videos;
  CREATE POLICY "Sellers manage their own product videos" ON public.product_videos 
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.sellers s ON p.seller_id = s.id
        WHERE p.id = product_videos.product_id AND s.profile_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
