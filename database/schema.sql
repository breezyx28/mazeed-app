-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text DEFAULT 'home'::address_type,
  street text,
  city text NOT NULL,
  state text,
  zip_code text,
  country text DEFAULT 'Sudan'::text,
  phone_number text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.admin_audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  admin_id uuid,
  action text NOT NULL,
  target_table text,
  target_id text,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  quantity integer DEFAULT 1,
  selected_color text,
  selected_size text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.categories (
  id text NOT NULL,
  name text NOT NULL,
  name_ar text NOT NULL,
  emoji text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cms_banners (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT cms_banners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  discount_type text CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  value numeric NOT NULL,
  min_purchase_amount numeric DEFAULT 0,
  max_discount_amount numeric,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  usage_limit integer,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dynamic_pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT dynamic_pages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.favorites (
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT favorites_pkey PRIMARY KEY (user_id, product_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  url text NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.offer_categories (
  id text NOT NULL,
  name text NOT NULL,
  name_ar text NOT NULL,
  emoji text,
  description text,
  description_ar text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT offer_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id text,
  quantity integer NOT NULL,
  price_at_purchase numeric NOT NULL,
  selected_color text,
  selected_size text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  seller_id uuid,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  address_id uuid,
  status USER-DEFINED DEFAULT 'pending'::order_status,
  total_amount numeric NOT NULL,
  payment_method_id uuid,
  tracking_number text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id)
);
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  type USER-DEFINED NOT NULL,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_videos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id text NOT NULL,
  video_type USER-DEFINED NOT NULL DEFAULT 'uploaded'::video_type,
  video_url text NOT NULL,
  thumbnail_url text,
  caption text,
  link_title text,
  link_description text,
  link_image text,
  views integer DEFAULT 0,
  duration integer,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT product_videos_pkey PRIMARY KEY (id),
  CONSTRAINT fk_product_videos_product_id FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id text NOT NULL,
  category_id text,
  name text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  discount numeric CHECK (discount >= 0::numeric AND discount <= 100::numeric),
  image text NOT NULL,
  images ARRAY,
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  colors ARRAY,
  description text,
  badges ARRAY,
  offer_type text,
  offer_expiry timestamp with time zone,
  stock_quantity integer DEFAULT 100,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  seller_id uuid,
  status USER-DEFINED DEFAULT 'draft'::product_status,
  preferred_payment_codes ARRAY,
  sizes ARRAY DEFAULT '{}'::text[],
  material text,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_offer_type_fkey FOREIGN KEY (offer_type) REFERENCES public.offer_categories(id),
  CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  phone_number text,
  gender text,
  age integer,
  role USER-DEFINED DEFAULT 'customer'::user_role,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_seller boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.seller_payment_methods (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  seller_id uuid NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  type USER-DEFINED NOT NULL,
  details jsonb,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT seller_payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT seller_payment_methods_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id)
);
CREATE TABLE public.sellers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL UNIQUE,
  shop_name text NOT NULL,
  shop_slug text UNIQUE,
  description text,
  location jsonb,
  opening_times jsonb,
  website text,
  logo_url text,
  settings jsonb,
  is_verified boolean DEFAULT false,
  status USER-DEFINED DEFAULT 'pending'::seller_status,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  social_media jsonb,
  cover_url text,
  CONSTRAINT sellers_pkey PRIMARY KEY (id),
  CONSTRAINT sellers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  subject text NOT NULL,
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])),
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.system_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.ticket_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL,
  sender_id uuid,
  message text NOT NULL,
  is_staff_reply boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT ticket_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id),
  CONSTRAINT ticket_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);