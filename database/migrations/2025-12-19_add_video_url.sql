-- Migration: Add video_url to products (2025-12-19)

alter table public.products
  add column if not exists video_url text;
