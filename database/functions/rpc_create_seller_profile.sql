-- Function: rpc_create_seller_profile
-- Creates a seller profile linked to the calling user (auth.uid())

create or replace function public.rpc_create_seller_profile(
  shop_name text,
  shop_slug text,
  description text,
  location jsonb default null,
  opening_times jsonb default null,
  website text default null,
  logo_url text default null
)
returns public.sellers
language plpgsql
security definer
stable
as $$
declare
  uid uuid := auth.uid();
  s_id uuid;
begin
  if uid is null then
    raise exception 'authentication required' using hint = 'call as an authenticated user';
  end if;

  -- Ensure the user does not already have a seller
  if exists(select 1 from public.sellers where profile_id = uid) then
    raise exception 'seller profile already exists for this user';
  end if;

  insert into public.sellers (profile_id, shop_name, shop_slug, description, location, opening_times, website, logo_url, status)
  values (uid, shop_name, shop_slug, description, location, opening_times, website, logo_url, 'pending')
  returning * into s_id;

  -- Mark profile as seller
  update public.profiles set is_seller = true where id = uid;

  return (select * from public.sellers where id = s_id);
end;
$$;