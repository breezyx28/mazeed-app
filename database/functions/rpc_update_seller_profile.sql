-- Function: rpc_update_seller_profile
-- Updates the seller profile for the calling user (auth.uid())

create or replace function public.rpc_update_seller_profile(
  p_shop_name text,
  p_shop_slug text,
  p_description text,
  p_location jsonb,
  p_opening_times jsonb,
  p_website text,
  p_logo_url text,
  p_social_media jsonb default null
)
returns public.sellers
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
  s public.sellers%rowtype;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  select * into s from public.sellers where profile_id = uid;
  if not found then
    raise exception 'seller profile not found for this user';
  end if;

  update public.sellers set
    shop_name = coalesce(p_shop_name, shop_name),
    shop_slug = coalesce(p_shop_slug, shop_slug),
    description = coalesce(p_description, description),
    location = coalesce(p_location, location),
    opening_times = coalesce(p_opening_times, opening_times),
    website = coalesce(p_website, website),
    logo_url = coalesce(p_logo_url, logo_url),
    social_media = coalesce(p_social_media, social_media),
    updated_at = timezone('utc'::text, now())
  where id = s.id;

  return (select * from public.sellers where id = s.id);
end;
$$;