-- Migration: Create product_videos table (2025-12-19)

create type public.video_type as enum ('uploaded', 'youtube', 'vimeo', 'external');

create table if not exists public.product_videos (
  id uuid not null default uuid_generate_v4(),
  product_id text not null,
  video_type public.video_type not null default 'uploaded'::video_type,
  video_url text not null,
  thumbnail_url text null,
  caption text null,
  link_title text null,
  link_description text null,
  link_image text null,
  views integer null default 0,
  duration integer null,
  is_active boolean null default true,
  display_order integer null default 0,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint product_videos_pkey primary key (id),
  constraint fk_product_videos_product_id foreign KEY (product_id) references products (id) on update CASCADE on delete CASCADE
);

create index IF not exists idx_product_videos_product_id on public.product_videos using btree (product_id);
create index IF not exists idx_product_videos_active on public.product_videos using btree (is_active);
create index IF not exists idx_product_videos_display_order on public.product_videos using btree (display_order);

-- RLS
alter table public.product_videos enable row level security;

create policy "Product videos are viewable by everyone" 
  on public.product_videos for select 
  using (true);

create policy "Sellers can manage their own product videos" 
  on public.product_videos for all 
  using (
    exists (
      select 1 from public.products p 
      join public.sellers s on p.seller_id = s.id 
      where p.id = product_videos.product_id 
      and s.profile_id = auth.uid()
    )
  );
