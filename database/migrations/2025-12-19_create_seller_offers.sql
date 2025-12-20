-- Migration: Create seller_offers table (2025-12-19)

create table if not exists public.seller_offers (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.sellers(id) on delete cascade not null,
  name text not null,
  poster_url text,
  offer_type text references public.offer_categories(id),
  starts_at timestamptz default timezone('utc'::text, now()),
  ends_at timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.seller_offers enable row level security;

create policy "Seller offers are viewable by everyone" 
  on public.seller_offers for select 
  using (true);

create policy "Sellers can manage their own offers" 
  on public.seller_offers for all 
  using (
    exists (select 1 from public.sellers s where s.id = seller_id and s.profile_id = auth.uid())
  )
  with check (
    exists (select 1 from public.sellers s where s.id = seller_id and s.profile_id = auth.uid())
  );
