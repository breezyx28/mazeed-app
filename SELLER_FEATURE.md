# SELLER FEATURE 📦

> Purpose: Capture requirements, data model, UI, RLS and implementation plan for enabling users to become sellers while keeping the same user account.

---

## 1. Overview

- Short: Allow any registered user to opt-in to become a seller (sell products) while retaining buyer capabilities.
- Goals: Low friction onboarding, robust seller profile, store visibility, seller product management, seller orders and payouts, admin verification.
- Non-Goals (initial): Complex KYC flows, external payout integrations, multi-merchant marketplaces (unless requested).

## 2. Quick User Stories

- As a user, I can **opt-in** to become a seller using my existing account.
- As a seller, I can **create and manage products** and **view/fulfill orders** for items I sell.
- As a customer I can **visit a seller storefront** and buy products from sellers.
- As an admin, I can **approve/reject** seller registration and monitor seller activity.

## 3. Activation & Onboarding

- Option A (Fast): User toggles `Become a Seller`, provides basic shop info (shop name, description, contact), and is immediately active (subject to later review).
- Option B (Verified): User submits additional info (business address, tax id, bank details), then waits for admin approval (status: `pending` -> `active`/`rejected`).
- UX: Onboarding wizard (Profile -> Seller info -> Review -> Finish).

## 4. Seller Profile Fields (suggested)

- profile_id (FK to `profiles.id`)
- shop_name (text)
- shop_slug (text, unique)
- description (text)
- business_address (text)
- bank_details (jsonb) — masked in UI
- tax_id (text)
- is_verified (boolean)
- status (enum: `pending`, `active`, `suspended`, `rejected`)
- created_at, updated_at

## 5. Proposed DB Changes (draft)

- Create enum `seller_status` (pending, active, suspended, rejected)
- Create table `public.sellers` (id uuid, profile_id uuid unique fk to profiles, shop_name, shop_slug unique, description, bank_details jsonb, tax_id text, is_verified boolean default false, status seller_status default 'pending', timestamps)
- Add `seller_id uuid references public.sellers(id)` to `public.products` (nullable).
- Optionally: add `seller_id` to `public.order_items` to preserve seller attribution at purchase time.

### Example SQL (draft)

```sql
create type seller_status as enum ('pending','active','suspended','rejected');

create table public.sellers (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  shop_name text not null,
  shop_slug text unique,
  description text,
  business_address text,
  bank_details jsonb,
  tax_id text,
  is_verified boolean default false,
  status seller_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products add column seller_id uuid references public.sellers(id) on delete set null;

-- Optionally: record seller at order time
alter table public.order_items add column seller_id uuid;
```

## 6. RLS & Policies (high-level)

- `sellers`: select for public? Minimal public fields; update/insert allowed only to `auth.uid() = profile_id` or admins.
- `products`: allow sellers to insert/update/delete products when `seller_id` belongs to their seller row; public select returns seller info.
- `order_items`: sellers can view order items where `seller_id` = their seller id.
- Admin policies: admins can manage/approve sellers, view all products/orders.

## 7. API / RPC Endpoints (suggested)

- POST /rpc/create_seller_profile
- PATCH /rpc/update_seller_profile
- GET /rpc/get_seller_storefront (public)
- GET /rpc/get_seller_products
- POST /rpc/create_product (seller)
- PATCH /rpc/update_product (seller)
- GET /rpc/seller_orders
- POST /rpc/request_payout (seller)

## 8. UI / Pages (initial)

- Seller Onboarding (wizard)
- Seller Dashboard (overview: sales, orders, products, balance)
- Product Create/Edit modal/page for sellers
- Orders Inbox (per seller) with status updates
- Public seller storefront `/seller/:slug`
- Admin: Seller review/approve UI in admin panel

## 9. Acceptance Criteria

- A logged-in user can opt-in and create a seller profile.
- The seller can create/edit products and products are attributed to the seller.
- Sellers can view their orders (order items) and change fulfillment status.
- Admin can approve or suspend a seller; status affects product visibility if suspended.

## 10. Tests & Migration Plan (notes)

- Add migration SQL file with `create type seller_status` and `create table sellers` and `alter table products add column seller_id`.
- Add seed data: one sample seller and sample seller products.
- Add unit tests for RLS policies and integration tests for RPCs.

## 11. Open Questions (status: partial answers)

1. Registration activation: should seller accounts be **immediately active** (fast onboarding) or **start in `pending` for admin approval** (KYC later)?

   - Note: we can support both with a default policy; please specify preferred default.

2. Single-shop vs multi-shop: **CONFIRMED** — each user can have **only one store** (1:1 `profiles` -> `sellers`).

3. Buying own items: clarify desired UX:

   - (A) Prevent purchase of own products but still show them in listings, or
   - (B) Hide own products entirely from this user's customer-facing view.

4. Payment methods: do you want **per-store** methods (managed on `sellers`) and optionally allow **per-product overrides**? Please confirm.

5. Payouts & commissions: do we track seller balances/commissions now, or defer to a later phase?

6. Video uploads: allow **direct upload to Supabase Storage** and/or external links? (both possible)

7. Product & order statuses: confirm canonical lists you want initially (defaults proposed below):
   - Product statuses: `draft`, `published`, `sold`, `out_of_stock`.
   - Order statuses (seller-facing): `pending`, `processing`, `shipped`, `delivered`, `cancelled`.

---

## 12. Changelog

- v0.1: Scaffold created — awaiting pieces from product owner.
- v0.2: Added detailed owner-provided Seller Abilities and clarifying questions (2025-12-18)
- v0.3: Confirmed single-shop-per-user model (2025-12-18)
- v0.4: Finalized activation, ownership, payment and upload choices; added draft migration and RLS plan (2025-12-18)
- v0.5: Created migration SQL and seeds; added RLS policies and DB trigger to prevent self-purchase. Products hidden until seller `status = 'active'` and `product.status = 'published'` (2025-12-18)

---

## 13. Owner-provided Seller Abilities (user details)

The product owner provided the following requirements (verbatim + organized):

1. New incoming users can register as a seller directly on the registration page: after creating basic info as a normal customer, there must be a tab/button asking the user to continue as **Customer** or **Seller**.

   - If they choose Customer, they proceed as normal.
   - If they choose Seller, the user is taken to a **separate seller information page** (seller info to be defined later).

2. A seller can also be created within an existing customer profile via the **Edit Profile** page by showing a button named **Be a Seller** that opens the same seller information page mentioned above (see item 1).

3. The seller _shares_ the same customer profile page but shows **extra information** about the seller (fields and UI will be defined later).

4. Sellers must have their own table linked to the customer (`profiles`) table, and the `profiles` table should have an `is_seller` boolean flag to identify sellers.

5. Seller login: a seller logs in normally using the same credentials; after login they start as a customer session and can **switch to Seller mode** from the profile menu (a toggle/button).

6. Seller UI must be **separated from customer UI**: seller-specific routes and a dedicated folder in the codebase (e.g., `src/pages/seller/*` and `src/components/seller/*`), while reusing shared components where appropriate to keep separation of concerns.

7. Business rule: a seller **cannot buy his own items**. When switching to seller mode they must not be able to purchase their own products; also they should **not see their own items** in the customer-facing buy flow (clarify desired behavior below).

8. Seller capabilities (summary): statistics, inventory management, order tracking, invoices, product control, sharing, upload product videos, and all features needed from the customer version but for sellers.

9. Seller login note: sellers login as customers and then **switch** to seller profile from the profile page to access their mini dashboard (repeat of item 5 for emphasis).

10. Seller profile fields to include: store name, location, opening times, website, bio/description, store logo. Seller store supports multiple categories (electronics, clothes, accessories ...), badges, and **controls payment methods** (add, delete, update).

11. Notifications: seller and customer notifications are unified (single notification stream), not separated.

12. Product control preferences: sellers can fully control their product data before posting (all product schema fields), change product status (e.g., sold, free), select preferred payment methods per product, and change order statuses (e.g., onsite-only pickup, delivery unavailable, etc.).

## 14. Implications & Updates to Design

Based on the above, update proposals and constraints:

- Profiles table: add `is_seller boolean default false` so existing users become sellers by enabling this flag.
- Sellers table: keep a dedicated `public.sellers` table (1:1 to `profiles`) with seller-specific metadata (shop_name, shop_slug, settings, payment methods, location, opening times, logo, etc.).
- Products: add `seller_id` (nullable) referencing `public.sellers(id)` and keep ownership attribution on `order_items` (store seller_id at time of purchase).
- Routes/UI: create `src/pages/seller/*`, `src/components/seller/*`, protected by seller-only route guards that check `profile.is_seller` and seller `status == 'active'`.
- Permissions: sellers can manage only products where `product.seller_id = seller.id` and can view order items for those products.
- Buying restriction: implement a check at purchase time to prevent ordering if the buyer's `profile.id` equals the `product.seller.profile_id` (disallow buying own products). Clarify if sellers should also be hidden from customer product listings.
- Notifications: reuse existing notification system; add seller-specific notification types when needed (e.g., new order, payout processed).
- Seller onboarding: add flows in registration and profile edit as specified.

## 15. Clarifying Questions (please confirm)

1. Registration flow: do you want **immediate activation** when a user selects "Seller" at registration, or should new sellers start in `pending` state requiring admin approval before going `active` (KYC later)?

2. Single-shop vs multi-shop: should each user have **only one store** (1:1 profiles->sellers), or should we allow **multiple stores per user** (1:many)? Your notes suggest a single seller record per user, but confirm.

3. Buying own items: when you wrote "seller cannot buy his own items when switching to customer account, also he cannot see his items also", did you mean:

   - (A) Sellers should be **prevented** from purchasing their own products but may still _see_ them in listings; or
   - (B) Sellers should be **hidden** from seeing their own products in the customer view entirely; or
   - (C) Something else — please specify desired exact UX.

4. Payment methods: you said sellers can control payment methods (add/delete/update). Are these **per-store** methods (managed in `sellers` table), per-product overrides, or both?

5. Product visibility when seller suspended: Should seller products be automatically hidden from public listings when `seller.status != 'active'`?

6. Admin flows: what level of admin control do you want initially? (e.g., approve/reject seller accounts, suspend, set commission rate, adjust payouts.)

7. Payouts & commissions: do you want to track seller balances/commissions in scope of this change or defer to a later phase?

8. Video uploads: do you want to allow direct uploads (store in Supabase storage) or external links only for product videos (or both)?

9. Product and order statuses: please provide the canonical list you'd like to support initially (e.g., draft, published, sold, out_of_stock; for orders: pending, processing, shipped, delivered, cancelled).

---

## 16. Next steps

- After you confirm the clarifications above, I will:
  1. Update `SELLER_FEATURE.md` with your confirmations and finalize the schema changes.
  2. Draft the SQL migration(s) and RLS policy suggestions aligned with `schema.sql` style.
  3. Propose the initial UI routes and component stubs and update the todo list to start the implementation work.

---

_How to use this file:_ Send your seller-related pieces (one small piece per message). I will append, organize, and then produce SQL migrations, RLS policies, and UI implementation tasks from it.

---

## 17. Confirmations (owner answers)

- Registration activation: **Start as `pending` + admin approval** (confirmed).
- Single-shop model: **One store per user** (confirmed).
- Buying own items: **Option A** — prevent purchase of own products but allow viewing in listings.
- Payment methods: **Per-store** payment methods with **optional per-product** overrides.
- Video uploads: **Support both** direct uploads to Supabase Storage and external links.
- Product statuses: `draft`, `published`, `sold`, `out_of_stock`, `archived` (chosen by architect).
- Order statuses: `pending`, `processing`, `shipped`, `delivered`, `cancelled`, `returned` (chosen by architect).

## 18. Draft Migration & RLS Plan (v0.1)

(Short summary; full draft SQL + policy suggestions are below for review.)

- Add `is_seller boolean` on `profiles`.
- Create `seller_status` enum + `sellers` table (1:1 to profiles) with metadata (shop_name, slug, location, opening_times, logo, settings, status).
- Add `seller_payment_methods` table to allow sellers to manage methods.
- Add `product_status` enum and `products.seller_id`, `products.status`, `products.preferred_payment_codes`.
- Add `order_items.seller_id` and an optional DB trigger to prevent self-purchase; enforce also at application level.
- RLS: restrict seller management to seller owner (auth.uid() = profiles.id) or admins; public product selects only for `status='published'` and `seller.status='active'`.

### Full migration SQL (concise block)

```sql
-- Add flag to profiles
alter table public.profiles add column is_seller boolean default false;

-- Enums and tables
create type seller_status as enum ('pending','active','suspended','rejected');
create type product_status as enum ('draft','published','sold','out_of_stock','archived');

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

-- Products & order items
alter table public.products add column seller_id uuid references public.sellers(id) on delete set null;
alter table public.products add column status product_status default 'draft';
alter table public.products add column preferred_payment_codes text[];

alter table public.order_items add column seller_id uuid;

-- Optional DB trigger to prevent self-purchase (also enforce in app)
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
```

## 19. Next actions (requires your confirmation)

1. Shall I create the migration SQL file under `database/migrations/` and add a small seed for an admin profile and a sample seller? (yes/no)
2. After your 'yes', I'll implement RLS policies and draft RPC endpoints and client methods — and then propose the UI routes and component stubs.

---

_File created by GitHub Copilot (Raptor mini (Preview)) on 2025-12-18_
