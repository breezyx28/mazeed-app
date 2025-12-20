-- Migration: Add seller support (2025-12-18)
-- Adds sellers table, payment methods, product status, and RLS policies + seeds

-- 1) Add is_seller flag to profiles
alter table public.profiles
  add column if not exists is_seller boolean default false;

-- 2) Create seller_status and product_status enums
create type seller_status as enum ('pending','active','suspended','rejected');
create type product_status as enum ('draft','published','sold','out_of_stock','archived');

-- 3) Create sellers table (1:1 with profiles)
create table public.sellers (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  shop_name text not null,
  shop_slug text unique,
  description text,
  location jsonb,
  opening_times jsonb,
  website text,
  logo_url text,
  settings jsonb,
  is_verified boolean default false,
  status seller_status default 'pending',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4) Seller-specific payment methods
create table public.seller_payment_methods (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.sellers(id) on delete cascade not null,
  name text not null,
  code text not null,
  type payment_type not null,
  details jsonb,
  is_enabled boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
create index idx_seller_payment_methods_seller_id on public.seller_payment_methods(seller_id);

-- 5) Modify products: seller attribution + status + payment overrides
alter table public.products add column seller_id uuid references public.sellers(id) on delete set null;
alter table public.products add column status product_status default 'draft';
alter table public.products add column preferred_payment_codes text[];
create index idx_products_seller_id on public.products(seller_id);

-- 6) Keep seller attribution for order items
alter table public.order_items add column seller_id uuid;
create index idx_order_items_seller_id on public.order_items(seller_id);

-- 7) RLS: enable RLS on new tables
alter table public.sellers enable row level security;
alter table public.seller_payment_methods enable row level security;

-- 8) Policies for sellers
create policy "Sellers are viewable by everyone (public fields)" on public.sellers for select using (status = 'active');
create policy "Users can create own seller record" on public.sellers for insert with check (auth.uid() = profile_id);
create policy "Users can update own seller record" on public.sellers for update using (auth.uid() = profile_id);
create policy "Admins can manage sellers" on public.sellers for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 9) Policies for seller_payment_methods
create policy "Seller payment methods are viewable when enabled" on public.seller_payment_methods for select using (is_enabled = true);
create policy "Sellers can manage their payment methods" on public.seller_payment_methods for all using (
  exists (select 1 from public.sellers s where s.id = seller_payment_methods.seller_id and s.profile_id = auth.uid())
) with check (
  exists (select 1 from public.sellers s where s.id = seller_payment_methods.seller_id and s.profile_id = auth.uid())
);

-- 10) Product policies: replace loose public policy with stricter rule
-- Remove old permissive policy if present (may fail harmlessly if not exists)
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable when published and seller active" on public.products for select using (
  status = 'published' AND (
    seller_id IS NULL OR exists (select 1 from public.sellers s where s.id = public.products.seller_id and s.status = 'active')
  )
);

-- 11) Order item policy for sellers
create policy "Sellers can view own order items" on public.order_items for select using (
  exists (select 1 from public.sellers s where s.id = public.order_items.seller_id and s.profile_id = auth.uid())
);

-- 12) Prevent self-purchase at DB level (optional safety net)
create or replace function public.prevent_self_purchase()
returns trigger as $$
declare
  buyer_id uuid;
  seller_profile uuid;
begin
  select user_id into buyer_id from public.orders where id = NEW.order_id;
  select s.profile_id into seller_profile from public.sellers s where s.id = NEW.seller_id;
  if buyer_id = seller_profile then
    raise exception 'Sellers cannot purchase their own products';
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger prevent_self_purchase_trigger
before insert on public.order_items
for each row execute procedure public.prevent_self_purchase();

-- 13) Seed: ensure at least one admin profile exists and create a sample seller for testing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM public.profiles LIMIT 1);
  END IF;
END$$;

DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.sellers WHERE profile_id = admin_id) THEN
      INSERT INTO public.sellers (profile_id, shop_name, shop_slug, description, is_verified, status)
      VALUES (admin_id, 'Admin Shop', 'admin-shop', 'Platform admin test shop', true, 'active');
      UPDATE public.profiles SET is_seller = true WHERE id = admin_id;
    END IF;
  END IF;
END$$;

-- Done migration
