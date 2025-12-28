-- Migration: Allow sellers to create offer categories (2025-12-28)

alter table public.offer_categories enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_categories'
      and policyname = 'Offer categories are viewable by everyone'
  ) then
    create policy "Offer categories are viewable by everyone"
      on public.offer_categories for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_categories'
      and policyname = 'Sellers can create offer categories'
  ) then
    create policy "Sellers can create offer categories"
      on public.offer_categories for insert
      with check (
        exists (
          select 1
          from public.sellers s
          where s.profile_id = auth.uid()
        )
      );
  end if;
end $$;
