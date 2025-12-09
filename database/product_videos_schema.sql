-- PRODUCT VIDEOS TABLE
-- Add this to your existing schema

-- 1. Create video_type enum
create type video_type as enum ('uploaded', 'external_link');

-- 2. Create product_videos table
create table public.product_videos (
  id uuid default uuid_generate_v4() primary key,
  product_id text not null,
  video_type video_type default 'uploaded' not null,
  video_url text not null, -- Supabase storage URL or external link
  thumbnail_url text, -- Preview image
  caption text,
  link_title text, -- For external links (like WhatsApp status)
  link_description text, -- Meta description for external links
  link_image text, -- Meta image for external links
  views integer default 0,
  duration integer, -- Video duration in seconds
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Foreign key constraint
  constraint fk_product_videos_product_id 
    foreign key (product_id) 
    references public.products(id) 
    on delete cascade
    on update cascade
);

-- 3. Enable RLS
alter table product_videos enable row level security;

-- 4. RLS Policies
create policy "Product videos are viewable by everyone" on product_videos 
  for select using (is_active = true);

create policy "Admins can manage product videos" on product_videos 
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Create indexes for better performance
create index idx_product_videos_product_id on product_videos(product_id);
create index idx_product_videos_active on product_videos(is_active);
create index idx_product_videos_display_order on product_videos(display_order);

-- 6. Add comment for documentation
comment on table product_videos is 'Stores product videos - either uploaded to Supabase Storage or external links (TikTok, YouTube, etc.)';
comment on column product_videos.video_type is 'Type of video: uploaded (stored in Supabase) or external_link (TikTok, YouTube, etc.)';
comment on column product_videos.product_id is 'References products table - videos are deleted when product is deleted (cascade)';
