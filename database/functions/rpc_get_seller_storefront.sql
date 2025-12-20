-- Function: rpc_get_seller_storefront(slug text)
-- Returns seller info and public products for given shop_slug

create or replace function public.rpc_get_seller_storefront(p_slug text)
returns table(
  seller_id uuid,
  profile_id uuid,
  shop_name text,
  shop_slug text,
  description text,
  logo_url text,
  product_id text,
  product_name text,
  product_price numeric,
  product_image text,
  product_status product_status
)
language sql
stable
as $$
  select s.id::uuid as seller_id, s.profile_id, s.shop_name, s.shop_slug, s.description, s.logo_url,
         p.id as product_id, p.name as product_name, p.price as product_price, p.image as product_image, p.status as product_status
  from public.sellers s
  left join public.products p on p.seller_id = s.id
  where s.shop_slug = p_slug
    and (p.id is null or (p.status = 'published' and s.status = 'active'));
$$;