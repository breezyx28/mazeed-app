-- Migration: Add extra product fields (badges, colors, discount)
-- Date: 2025-12-19

-- Add badges, colors, and discount_percentage columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0;

-- Ensure constraints (optional but good practice)
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS check_discount_percentage;

ALTER TABLE public.products
ADD CONSTRAINT check_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
