-- Migration: Ensure seller_offers table exists (2025-12-28)
-- This migration ensures the seller_offers table is created even if the schema.sql file is out of sync.

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

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seller_offers'
      and policyname = 'Seller offers are viewable by everyone'
  ) then
    create policy "Seller offers are viewable by everyone"
      on public.seller_offers for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seller_offers'
      and policyname = 'Sellers can manage their own offers'
  ) then
    create policy "Sellers can manage their own offers"
      on public.seller_offers for all
      using (
        exists (select 1 from public.sellers s where s.id = seller_id and s.profile_id = auth.uid())
      )
      with check (
        exists (select 1 from public.sellers s where s.id = seller_id and s.profile_id = auth.uid())
      );
  end if;
end $$;
