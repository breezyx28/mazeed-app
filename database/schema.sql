-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ENUMS
create type user_role as enum ('admin', 'customer');
create type order_status as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
create type payment_type as enum ('card', 'cod', 'wallet');
create type address_type as enum ('home', 'work', 'other');

-- 2. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  phone_number text,
  gender text,
  age integer,
  role user_role default 'customer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CATEGORIES
create table public.categories (
  id text primary key, -- using text ids from data file (e.g., 'Electronics')
  name text not null,
  name_ar text not null,
  emoji text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. OFFER CATEGORIES
create table public.offer_categories (
  id text primary key, -- e.g., 'kids', 'eid'
  name text not null,
  name_ar text not null,
  emoji text,
  description text,
  description_ar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PRODUCTS
create table public.products (
  id text primary key, -- using text ids from data file (e.g., '1', '2')
  category_id text references public.categories(id) on delete set null,
  name text not null,
  price numeric not null,
  original_price numeric,
  discount numeric,
  image text not null, -- main image
  images text[], -- additional images
  rating numeric default 0,
  reviews_count integer default 0,
  colors text[],
  description text,
  badges text[], -- array of strings: 'freeShipment', 'discount', etc.
  offer_type text references public.offer_categories(id) on delete set null,
  offer_expiry timestamp with time zone,
  stock_quantity integer default 100,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ADDRESSES
create table public.addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type address_type default 'home',
  street text not null,
  city text not null,
  state text,
  zip_code text,
  country text default 'Sudan',
  phone_number text,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. PAYMENT METHODS
create table public.payment_methods (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique not null, -- e.g., 'visa', 'mpesa'
  type payment_type not null,
  is_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. ORDERS
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  address_id uuid references public.addresses(id) on delete set null,
  status order_status default 'pending',
  total_amount numeric not null,
  payment_method_id uuid references public.payment_methods(id),
  tracking_number text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. ORDER ITEMS
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id text references public.products(id) on delete set null,
  quantity integer not null,
  price_at_purchase numeric not null,
  selected_color text,
  selected_size text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. INVOICES
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  url text not null,
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. CART ITEMS
create table public.cart_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  quantity integer default 1,
  selected_color text,
  selected_size text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id, selected_color, selected_size)
);

-- 12. REVIEWS
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. FAVORITES
create table public.favorites (
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, product_id)
);

-- 14. NOTIFICATIONS
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info', -- 'order', 'promo', 'system'
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. CMS BANNERS
create table public.cms_banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  image_url text not null,
  link_url text,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. COUPONS
create table public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  discount_type text check (discount_type in ('percentage', 'fixed')),
  value numeric not null,
  min_purchase_amount numeric default 0,
  max_discount_amount numeric,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  usage_limit integer,
  used_count integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 17. SUPPORT TICKETS
create table public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 18. TICKET MESSAGES
create table public.ticket_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null, -- Null if system message
  message text not null,
  is_staff_reply boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 19. ADMIN AUDIT LOGS
create table public.admin_audit_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null, -- e.g., 'create_product', 'update_order'
  target_table text,
  target_id text,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 20. DYNAMIC PAGES
create table public.dynamic_pages (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  content text, -- HTML or Markdown
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 21. SYSTEM SETTINGS
create table public.system_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table categories enable row level security;
alter table offer_categories enable row level security;
alter table products enable row level security;
alter table addresses enable row level security;
alter table payment_methods enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table invoices enable row level security;
alter table cart_items enable row level security;
alter table reviews enable row level security;
alter table favorites enable row level security;
alter table notifications enable row level security;
alter table cms_banners enable row level security;
alter table coupons enable row level security;
alter table support_tickets enable row level security;
alter table ticket_messages enable row level security;
alter table admin_audit_logs enable row level security;
alter table dynamic_pages enable row level security;
alter table system_settings enable row level security;

-- Profiles: Public read, User update own
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Categories/Products/Offers: Public read, Admin write
create policy "Categories are viewable by everyone" on categories for select using (true);
create policy "Offer Categories are viewable by everyone" on offer_categories for select using (true);
create policy "Products are viewable by everyone" on products for select using (true);

-- Addresses: User read/write own
create policy "Users can view own addresses" on addresses for select using (auth.uid() = user_id);
create policy "Users can insert own addresses" on addresses for insert with check (auth.uid() = user_id);
create policy "Users can update own addresses" on addresses for update using (auth.uid() = user_id);
create policy "Users can delete own addresses" on addresses for delete using (auth.uid() = user_id);

-- Orders: User read own, Admin read all
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on orders for insert with check (auth.uid() = user_id);

-- Cart: User read/write own
create policy "Users can view own cart" on cart_items for select using (auth.uid() = user_id);
create policy "Users can manage own cart" on cart_items for all using (auth.uid() = user_id);

-- Favorites: User read/write own
create policy "Users can view own favorites" on favorites for select using (auth.uid() = user_id);
create policy "Users can manage own favorites" on favorites for all using (auth.uid() = user_id);

-- CMS Banners: Public read, Admin write
create policy "Banners are viewable by everyone" on cms_banners for select using (true);

-- Dynamic Pages: Public read (if published), Admin write
create policy "Published pages are viewable by everyone" on dynamic_pages for select using (is_published = true);

-- Coupons: Public read (if active), Admin write
create policy "Active coupons are viewable by everyone" on coupons for select using (is_active = true);

-- Support Tickets: User read/write own
create policy "Users can view own tickets" on support_tickets for select using (auth.uid() = user_id);
create policy "Users can create tickets" on support_tickets for insert with check (auth.uid() = user_id);
create policy "Users can update own tickets" on support_tickets for update using (auth.uid() = user_id);

-- Ticket Messages: User read/write own (linked to ticket)
create policy "Users can view messages for own tickets" on ticket_messages for select using (
  exists (select 1 from support_tickets where id = ticket_messages.ticket_id and user_id = auth.uid())
);
create policy "Users can create messages for own tickets" on ticket_messages for insert with check (
  exists (select 1 from support_tickets where id = ticket_messages.ticket_id and user_id = auth.uid())
);

-- Admin Audit Logs: Admin read only (No public access)
-- (Implicitly denied for public/users by default RLS)

-- System Settings: Public read (some), Admin write
create policy "Settings are viewable by everyone" on system_settings for select using (true);

-- TRIGGERS

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEED DATA

-- Categories
insert into public.categories (id, name, name_ar, emoji) values
('all', 'All', 'الكل', '🛍️'),
('Kids', 'Kids Wear', 'ملابس الأطفال', '👶'),
('Clothes', 'Women''s Fashion', 'أزياء النساء', '👗'),
('MenClothes', 'Men''s Fashion', 'أزياء الرجال', '👔'),
('Jewelry', 'Jewelry', 'المجوهرات', '💍'),
('Electronics', 'Electronics', 'الإلكترونيات', '📱'),
('Home', 'Home & Living', 'المنزل والمعيشة', '🏠'),
('Sports', 'Sports', 'الرياضة', '⚽'),
('Bags', 'Bags', 'الحقائب', '👜'),
('Shoes', 'Shoes', 'الأحذية', '👟'),
('Watch', 'Watches', 'الساعات', '⌚'),
('Beauty', 'Beauty', 'الجمال', '💄');

-- Offer Categories
insert into public.offer_categories (id, name, name_ar, emoji, description, description_ar) values
('kids', 'Kids Wear Offers', 'عروض ملابس الأطفال', '👶', 'Special deals on kids clothing and accessories', 'عروض خاصة على ملابس وإكسسوارات الأطفال'),
('eid', 'Eid Offers', 'عروض العيد', '🌙', 'Exclusive Eid collection with amazing discounts', 'مجموعة العيد الحصرية مع خصومات مذهلة'),
('under5000', 'Under 5000 SDG', 'أقل من 5000 جنيه', '💰', 'Great products under 5000 SDG', 'منتجات رائعة بأقل من 5000 جنيه'),
('winter', 'Winter Offers', 'عروض الشتاء', '❄️', 'Stay warm with our winter collection', 'ابق دافئًا مع مجموعة الشتاء لدينا'),
('jewelry', 'Jewelry Offers', 'عروض المجوهرات', '💎', 'Shine bright with our jewelry deals', 'تألق مع عروض المجوهرات لدينا'),
('flash', 'Flash Deals', 'صفقات سريعة', '⚡', 'Limited time flash deals - grab them fast!', 'صفقات سريعة لفترة محدودة - احصل عليها بسرعة!'),
('newTrend', 'New Trends', 'أحدث الصيحات', '✨', 'Discover the latest trending products', 'اكتشف أحدث المنتجات الرائجة');

-- Products (Sample from products.ts)
insert into public.products (id, name, price, original_price, discount, image, images, rating, reviews_count, category_id, colors, description, badges, offer_type, offer_expiry) values
('1', 'Beats Solo Pro', 134550, 157050, 30, 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'], 4.8, 345, 'Electronics', ARRAY['#000000', '#FFFFFF', '#FF0000'], 'High-performance wireless headphones with active noise cancelling', ARRAY['discount', 'flash'], 'flash', '2025-12-31'),
('2', 'Bose Headphones', 89550, 112050, 25, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop'], 4.5, 234, 'Electronics', ARRAY['#000000', '#808080'], 'Premium sound quality with superior comfort', ARRAY['discount', 'freeShipment'], 'newTrend', '2025-12-31'),
('3', 'Canon EOS Camera', 404550, 449550, 20, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop'], 4.9, 189, 'Electronics', ARRAY['#000000'], 'Professional DSLR camera with 24MP sensor', ARRAY['discount'], null, null),
('4', 'Apple Watch Series 8', 179550, null, null, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop'], 4.8, 891, 'Watch', ARRAY['#C0C0C0', '#FFD700', '#000000'], 'Advanced health and fitness features with always-on display', ARRAY['new'], 'newTrend', '2025-12-31'),
('5', 'Nike Air Max', 58050, 71550, 40, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'], 4.7, 567, 'Shoes', ARRAY['#000000', '#FFFFFF', '#FF0000'], 'Classic sneakers with iconic Air Max cushioning', ARRAY['discount', 'flash'], 'flash', '2025-12-31'),
('7', 'Kids Winter Jacket', 35550, 44550, 20, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop'], 4.6, 234, 'Kids', ARRAY['#FF69B4', '#87CEEB', '#FFD700'], 'Warm and cozy winter jacket for kids', ARRAY['discount', 'winter', 'kids'], 'kids', '2025-12-31'),
('10', 'Gold Necklace', 225000, 270000, 15, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop', ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop'], 4.9, 445, 'Jewelry', ARRAY['#FFD700'], 'Elegant 18K gold necklace', ARRAY['discount', 'jewelry'], 'jewelry', '2025-12-31');

-- System Settings
insert into public.system_settings (key, value, description) values
('site_info', '{"name": "Mazeed Store", "contact_email": "support@mazeed.com", "contact_phone": "+249912345678"}', 'General site information'),
('privacy_policy', '{"content": "Standard privacy policy..."}', 'Privacy Policy text'),
('terms_conditions', '{"content": "Standard terms..."}', 'Terms and Conditions text');

-- Payment Methods
insert into public.payment_methods (name, code, type, is_enabled) values
('Cash on Delivery', 'cod', 'cod', true),
('Visa / Mastercard', 'card', 'card', true),
('Bankak', 'bankak', 'wallet', true);
