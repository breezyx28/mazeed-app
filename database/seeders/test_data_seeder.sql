-- ============================================================================
-- MAZEED MARKETPLACE - TEST DATA SEEDER
-- ============================================================================
-- Purpose: Populate database with realistic test data for development
-- Location: Sudan (Khartoum, Omdurman, Bahri)
-- Language: Arabic & English
-- Date: 2025-12-20
-- ============================================================================

-- IMPORTANT: Run this AFTER all migrations are applied
-- This seeder assumes you have at least one user created via Supabase Auth

-- ============================================================================
-- 1. CATEGORIES
-- ============================================================================

INSERT INTO public.categories (id, name, name_ar, emoji, image_url) VALUES
('electronics', 'Electronics', 'إلكترونيات', '📱', 'https://images.unsplash.com/photo-1498049794561-7780e7231661'),
('fashion', 'Fashion', 'أزياء', '👔', 'https://images.unsplash.com/photo-1445205170230-053b83016050'),
('home', 'Home & Garden', 'منزل وحديقة', '🏠', 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1'),
('sports', 'Sports', 'رياضة', '⚽', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211'),
('beauty', 'Beauty & Health', 'جمال وصحة', '💄', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348'),
('books', 'Books', 'كتب', '📚', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d'),
('toys', 'Toys & Games', 'ألعاب', '🎮', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f'),
('food', 'Food & Beverages', 'طعام ومشروبات', '🍔', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'),
('automotive', 'Automotive', 'سيارات', '🚗', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7'),
('jewelry', 'Jewelry', 'مجوهرات', '💍', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. OFFER CATEGORIES
-- ============================================================================

INSERT INTO public.offer_categories (id, name, name_ar, emoji, description, description_ar) VALUES
('flash-sale', 'Flash Sale', 'تخفيضات سريعة', '⚡', 'Limited time offers', 'عروض لفترة محدودة'),
('seasonal', 'Seasonal Sale', 'تخفيضات موسمية', '🎉', 'Seasonal discounts', 'خصومات موسمية'),
('clearance', 'Clearance', 'تصفية', '🏷️', 'Clearance sale', 'تصفية المخزون'),
('bundle', 'Bundle Deal', 'عرض حزمة', '📦', 'Buy more save more', 'اشتري أكثر ووفر أكثر'),
('new-arrival', 'New Arrival', 'وصول جديد', '✨', 'Newly arrived products', 'منتجات وصلت حديثاً')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. PAYMENT METHODS
-- ============================================================================
-- Enum values: card, cod, wallet

INSERT INTO public.payment_methods (name, code, type, is_enabled) VALUES
('Cash on Delivery', 'cod', 'cod', true),
('Bank Transfer', 'bank_transfer', 'wallet', true),
('Mobile Money (Zain Cash)', 'zain_cash', 'wallet', true),
('Mobile Money (MTN)', 'mtn_money', 'wallet', true),
('Credit Card', 'credit_card', 'card', true),
('Debit Card', 'debit_card', 'card', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 5. TEST USERS & SELLERS (AUTH + PROFILES + SELLERS)
-- ============================================================================
-- We must insert into auth.users first to satisfy the profiles_id_fkey constraint

DO $$
DECLARE
  v_seller1_id uuid := '11111111-1111-1111-1111-111111111111';
  v_seller2_id uuid := '22222222-2222-2222-2222-222222222222';
  v_seller3_id uuid := '33333333-3333-3333-3333-333333333333';
  v_seller4_id uuid := '44444444-4444-4444-4444-444444444444';
  v_seller5_id uuid := '55555555-5555-5555-5555-555555555555';
  v_customer_id uuid := '99999999-9999-9999-9999-999999999999';
BEGIN
  -- 5.1 CREATE AUTH USERS (Internal Supabase Table)
  -- This allows the profile foreign key to work
  INSERT INTO auth.users (id, email, email_confirmed_at, aud, role)
  VALUES 
    (v_seller1_id, 'seller1@mazeed.com', now(), 'authenticated', 'authenticated'),
    (v_seller2_id, 'seller2@mazeed.com', now(), 'authenticated', 'authenticated'),
    (v_seller3_id, 'seller3@mazeed.com', now(), 'authenticated', 'authenticated'),
    (v_seller4_id, 'seller4@mazeed.com', now(), 'authenticated', 'authenticated'),
    (v_seller5_id, 'seller5@mazeed.com', now(), 'authenticated', 'authenticated'),
    (v_customer_id, 'customer@mazeed.com', now(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- 5.2 CREATE PROFILES
  -- Role must be 'customer' (or 'admin') per your enum list
  INSERT INTO public.profiles (id, full_name, phone_number, role, is_seller) VALUES
    (v_seller1_id, 'محمد أحمد التجاني', '+249911111111', 'customer', true),
    (v_seller2_id, 'فاطمة عبدالله', '+249922222222', 'customer', true),
    (v_seller3_id, 'عمر حسن محمود', '+249933333333', 'customer', true),
    (v_seller4_id, 'خالد إبراهيم', '+249944444444', 'customer', true),
    (v_seller5_id, 'سارة محمد', '+249955555555', 'customer', true),
    (v_customer_id, 'أحمد محمد علي', '+249912345678', 'customer', false)
  ON CONFLICT (id) DO NOTHING;

  -- 5.3 CREATE SELLER STORE RECORDS
  -- Seller 1: Electronics (Khartoum)
  INSERT INTO public.sellers (profile_id, shop_name, shop_slug, description, location, opening_times, is_verified, status, social_media) VALUES
  (v_seller1_id, 'Tech Hub Khartoum', 'tech-hub-khartoum', 'Your one-stop shop for all electronics in Khartoum',
   '{"address": "شارع الجامعة، الخرطوم", "lat": 15.5007, "lng": 32.5599}'::jsonb,
   '{"monday": {"open": "09:00", "close": "21:00"}, "tuesday": {"open": "09:00", "close": "21:00"}, "wednesday": {"open": "09:00", "close": "21:00"}, "thursday": {"open": "09:00", "close": "21:00"}, "friday": {"open": "14:00", "close": "21:00"}, "saturday": {"open": "09:00", "close": "21:00"}, "sunday": {"open": "09:00", "close": "21:00"}}'::jsonb,
   true, 'active',
   '{"facebook": "https://facebook.com/techhubkhartoum", "instagram": "https://instagram.com/techhubkhartoum"}'::jsonb)
  ON CONFLICT (profile_id) DO NOTHING;
  
  -- Seller 2: Fashion (Omdurman)
  INSERT INTO public.sellers (profile_id, shop_name, shop_slug, description, location, opening_times, is_verified, status) VALUES
  (v_seller2_id, 'Elegant Fashion أم درمان', 'elegant-fashion-omdurman', 'Latest fashion trends for men and women',
   '{"address": "سوق أم درمان، أم درمان", "lat": 15.6446, "lng": 32.4777}'::jsonb,
   '{"is24_7": false, "monday": {"open": "10:00", "close": "20:00"}, "tuesday": {"open": "10:00", "close": "20:00"}, "wednesday": {"open": "10:00", "close": "20:00"}, "thursday": {"open": "10:00", "close": "20:00"}, "friday": {"open": "15:00", "close": "20:00"}, "saturday": {"open": "10:00", "close": "20:00"}, "sunday": {"open": "10:00", "close": "20:00"}}'::jsonb,
   true, 'active')
  ON CONFLICT (profile_id) DO NOTHING;
  
  -- Seller 3: Home (Bahri)
  INSERT INTO public.sellers (profile_id, shop_name, shop_slug, description, location, opening_times, is_verified, status) VALUES
  (v_seller3_id, 'Home Essentials بحري', 'home-essentials-bahri', 'Everything you need for your home',
   '{"address": "شارع النيل، بحري", "lat": 15.5892, "lng": 32.5363}'::jsonb,
   '{"is24_7": false, "monday": {"open": "08:00", "close": "19:00"}, "tuesday": {"open": "08:00", "close": "19:00"}, "wednesday": {"open": "08:00", "close": "19:00"}, "thursday": {"open": "08:00", "close": "19:00"}, "friday": {"open": "14:00", "close": "19:00"}, "saturday": {"open": "08:00", "close": "19:00"}, "sunday": {"open": "08:00", "close": "19:00"}}'::jsonb,
   true, 'active')
  ON CONFLICT (profile_id) DO NOTHING;
  
  -- Seller 4: Sports (Khartoum 2)
  INSERT INTO public.sellers (profile_id, shop_name, shop_slug, description, location, opening_times, is_verified, status) VALUES
  (v_seller4_id, 'Sports Zone الخرطوم', 'sports-zone-khartoum', 'Professional sports equipment and apparel',
   '{"address": "شارع الستين، الخرطوم 2", "lat": 15.5518, "lng": 32.5324}'::jsonb,
   '{"is24_7": false, "monday": {"open": "09:00", "close": "21:00"}, "tuesday": {"open": "09:00", "close": "21:00"}, "wednesday": {"open": "09:00", "close": "21:00"}, "thursday": {"open": "09:00", "close": "21:00"}, "friday": {"open": "14:00", "close": "21:00"}, "saturday": {"open": "09:00", "close": "21:00"}, "sunday": {"open": "09:00", "close": "21:00"}}'::jsonb,
   true, 'active')
  ON CONFLICT (profile_id) DO NOTHING;
  
  -- Seller 5: Beauty (Khartoum)
  INSERT INTO public.sellers (profile_id, shop_name, shop_slug, description, location, opening_times, is_verified, status) VALUES
  (v_seller5_id, 'Beauty Paradise الخرطوم', 'beauty-paradise-khartoum', 'Premium beauty and cosmetics products',
   '{"address": "شارع الأربعين، الخرطوم", "lat": 15.5177, "lng": 32.5341}'::jsonb,
   '{"is24_7": false, "monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "15:00", "close": "22:00"}, "saturday": {"open": "10:00", "close": "22:00"}, "sunday": {"open": "10:00", "close": "22:00"}}'::jsonb,
   true, 'active')
  ON CONFLICT (profile_id) DO NOTHING;
END $$;

-- ============================================================================
-- 6. PRODUCTS
-- ============================================================================

-- Electronics Products (Seller 1)
INSERT INTO public.products (id, category_id, name, price, original_price, discount, image, images, rating, reviews_count, colors, sizes, materials, description, badges, offer_type, stock_quantity, is_featured, seller_id, status, preferred_payment_codes)
SELECT 
  'apple-watch-10', 'electronics', 'Apple Watch Series 10', 450000, 500000, 10,
  'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9',
  ARRAY['https://images.unsplash.com/photo-1434494878577-86c23bcb06b9', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a'],
  4.8, 156,
  ARRAY['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#FFD700', '#C0C0C0', '#FF69B4', '#00FF00', '#800080', '#FFA500', '#00FFFF', '#FF1493', '#1E90FF', '#32CD32', '#FF4500'],
  ARRAY['41mm', '45mm'],
  ARRAY['aluminum', 'stainless-steel', 'titanium'],
  'Latest Apple Watch with advanced health monitoring features. Perfect for fitness enthusiasts and tech lovers.',
  ARRAY['New Arrival', 'Best Seller'],
  'flash-sale', 50, true,
  (SELECT id FROM public.sellers WHERE shop_slug = 'tech-hub-khartoum'),
  'published',
  ARRAY['cod', 'bank_transfer', 'credit_card']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'apple-watch-10');

INSERT INTO public.products (id, category_id, name, price, original_price, discount, image, rating, reviews_count, colors, description, badges, stock_quantity, is_featured, seller_id, status, preferred_payment_codes)
SELECT 
  'samsung-galaxy-s24', 'electronics', 'Samsung Galaxy S24 Ultra', 850000, 950000, 10,
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c',
  4.9, 203,
  ARRAY['#000000', '#C0C0C0', '#FFD700'],
  'Flagship Samsung smartphone with S Pen and incredible camera system.',
  ARRAY['Best Seller', 'In Stock'],
  30, true,
  (SELECT id FROM public.sellers WHERE shop_slug = 'tech-hub-khartoum'),
  'published',
  ARRAY['cod', 'bank_transfer', 'zain_cash', 'credit_card']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'samsung-galaxy-s24');

INSERT INTO public.products (id, category_id, name, price, original_price, image, rating, reviews_count, description, stock_quantity, seller_id, status, preferred_payment_codes)
SELECT 
  'sony-headphones', 'electronics', 'Sony WH-1000XM5 Headphones', 120000, NULL,
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
  4.7, 89,
  'Industry-leading noise cancellation with premium sound quality.',
  45, 
  (SELECT id FROM public.sellers WHERE shop_slug = 'tech-hub-khartoum'),
  'published',
  ARRAY['cod', 'bank_transfer']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'sony-headphones');

-- Fashion Products (Seller 2)
INSERT INTO public.products (id, category_id, name, price, image, rating, reviews_count, colors, sizes, materials, description, badges, stock_quantity, is_featured, seller_id, status)
SELECT 
  'mens-casual-shirt', 'fashion', 'قميص رجالي كاجوال', 25000,
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
  4.5, 67,
  ARRAY['#FFFFFF', '#000000', '#0000FF', '#808080'],
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['cotton', 'polyester'],
  'Comfortable casual shirt perfect for everyday wear.',
  ARRAY['In Stock'],
  100,
  false,
  (SELECT id FROM public.sellers WHERE shop_slug = 'elegant-fashion-omdurman'),
  'published'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'mens-casual-shirt');

INSERT INTO public.products (id, category_id, name, price, original_price, discount, image, rating, reviews_count, colors, sizes, description, badges, offer_type, stock_quantity, seller_id, status)
SELECT 
  'womens-abaya', 'fashion', 'عباية نسائية فاخرة', 80000, 100000, 20,
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
  4.9, 145,
  ARRAY['#000000', '#8B4513', '#000080'],
  ARRAY['S', 'M', 'L', 'XL'],
  'Elegant abaya with beautiful embroidery and premium fabric.',
  ARRAY['Best Seller', 'Limited Edition'],
  'seasonal',
  25,
  (SELECT id FROM public.sellers WHERE shop_slug = 'elegant-fashion-omdurman'),
  'published'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'womens-abaya');

-- Home Products (Seller 3)
INSERT INTO public.products (id, category_id, name, price, image, rating, reviews_count, description, stock_quantity, seller_id, status)
SELECT 
  'coffee-maker', 'home', 'ماكينة قهوة احترافية', 45000,
  'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6',
  4.6, 78,
  'Professional coffee maker for perfect brew every time.',
  60,
  (SELECT id FROM public.sellers WHERE shop_slug = 'home-essentials-bahri'),
  'published'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'coffee-maker');

INSERT INTO public.products (id, category_id, name, price, image, rating, reviews_count, colors, description, badges, stock_quantity, is_featured, seller_id, status)
SELECT 
  'luxury-bedding-set', 'home', 'طقم سرير فاخر', 95000,
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
  4.8, 92,
  ARRAY['#FFFFFF', '#F5F5DC', '#D3D3D3', '#FFE4E1'],
  'Premium quality bedding set with Egyptian cotton.',
  ARRAY['In Stock', 'Best Seller'],
  40,
  true,
  (SELECT id FROM public.sellers WHERE shop_slug = 'home-essentials-bahri'),
  'published'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'luxury-bedding-set');

-- Sports Products (Seller 4)
INSERT INTO public.products (id, category_id, name, price, image, rating, reviews_count, sizes, description, badges, stock_quantity, seller_id, status)
SELECT 
  'nike-running-shoes', 'sports', 'Nike Air Zoom Running Shoes', 75000,
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
  4.7, 134,
  ARRAY['39', '40', '41', '42', '43', '44', '45'],
  'Professional running shoes with superior cushioning and support.',
  ARRAY['New Arrival', 'In Stock'],
  55,
  (SELECT id FROM public.sellers WHERE shop_slug = 'sports-zone-khartoum'),
  'published'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'nike-running-shoes');

INSERT INTO public.products (id, category_id, name, price, image, rating, reviews_count, description, stock_quantity, seller_id, status)
SELECT 
  'yoga-mat', 'sports', 'حصيرة يوغا احترافية', 15000,
  'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f',
  4.5, 56,
  'Non-slip yoga mat perfect for all types of exercises.',
  80,
  (SELECT id FROM public.sellers WHERE shop_slug = 'sports-zone-khartoum'),
  'published'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'yoga-mat');

-- Beauty Products (Seller 5)
INSERT INTO public.products (id, category_id, name, price, original_price, discount, image, rating, reviews_count, description, badges, offer_type, stock_quantity, is_featured, seller_id, status)
SELECT 
  'skincare-set', 'beauty', 'طقم العناية بالبشرة', 120000, 150000, 20,
  'https://images.unsplash.com/photo-1556228720-195a672e8a03',
  4.9, 187,
  'Complete skincare routine with natural ingredients.',
  ARRAY['Best Seller', 'Limited Edition'],
  'bundle',
  35,
  true,
  (SELECT id FROM public.sellers WHERE shop_slug = 'beauty-paradise-khartoum'),
  'published'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'skincare-set');

INSERT INTO public.products (id, category_id, name, price, image, rating, reviews_count, description, badges, stock_quantity, seller_id, status)
SELECT 
  'perfume-collection', 'beauty', 'مجموعة عطور فاخرة', 200000,
  'https://images.unsplash.com/photo-1541643600914-78b084683601',
  4.8, 98,
  'Luxury perfume collection with long-lasting fragrances.',
  ARRAY['In Stock'],
  20,
  (SELECT id FROM public.sellers WHERE shop_slug = 'beauty-paradise-khartoum'),
  'published'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE id = 'perfume-collection');

-- ============================================================================
-- 7. CMS BANNERS
-- ============================================================================

INSERT INTO public.cms_banners (title, image_url, link_url, is_active, display_order) VALUES
('عروض رمضان الكبرى', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da', '/offers/ramadan', true, 1),
('خصم 50% على الإلكترونيات', 'https://images.unsplash.com/photo-1607082349566-187342175e2f', '/category/electronics', true, 2),
('أزياء العيد الجديدة', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04', '/category/fashion', true, 3);

-- ============================================================================
-- 8. USER CATEGORY INTERACTIONS (Sample Data)
-- ============================================================================

-- This will be populated automatically as users browse
-- Adding some sample data for testing nearby products feature

DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Get first customer user
  SELECT id INTO test_user_id FROM public.profiles WHERE role = 'customer' LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Simulate user browsing electronics
    INSERT INTO public.user_category_interactions (user_id, category_id, interaction_type, interaction_count)
    VALUES (test_user_id, 'electronics', 'view', 25),
           (test_user_id, 'electronics', 'click', 15),
           (test_user_id, 'electronics', 'purchase', 3),
           -- Fashion
           (test_user_id, 'fashion', 'view', 18),
           (test_user_id, 'fashion', 'click', 10),
           (test_user_id, 'fashion', 'purchase', 2),
           -- Sports
           (test_user_id, 'sports', 'view', 12),
           (test_user_id, 'sports', 'click', 7),
           -- Beauty
           (test_user_id, 'beauty', 'view', 8),
           (test_user_id, 'beauty', 'click', 4)
    ON CONFLICT (user_id, category_id, interaction_type) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- 9. SYSTEM SETTINGS
-- ============================================================================

INSERT INTO public.system_settings (key, value, description) VALUES
('app_name', '{"en": "Mazeed", "ar": "مزيد"}'::jsonb, 'Application name'),
('currency', '{"code": "SDG", "symbol": "ج.س", "name": "Sudanese Pound"}'::jsonb, 'Default currency'),
('tax_rate', '{"rate": 0, "enabled": false}'::jsonb, 'Tax configuration'),
('shipping_fee', '{"default": 5000, "free_threshold": 100000}'::jsonb, 'Shipping fee settings'),
('maintenance_mode', '{"enabled": false}'::jsonb, 'Maintenance mode status')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- 10. DYNAMIC PAGES
-- ============================================================================

INSERT INTO public.dynamic_pages (slug, title, content, is_published) VALUES
('about-us', 'About Mazeed', 'Mazeed is Sudan''s premier online marketplace connecting buyers and sellers across the country.', true),
('privacy-policy', 'Privacy Policy', 'Your privacy is important to us. This policy outlines how we collect and use your data.', true),
('terms-of-service', 'Terms of Service', 'By using Mazeed, you agree to these terms and conditions.', true),
('shipping-policy', 'Shipping Policy', 'Learn about our shipping options and delivery times.', true),
('return-policy', 'Return Policy', 'Our return policy ensures customer satisfaction with easy returns within 14 days.', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEEDER COMPLETE
-- ============================================================================

-- Verify data
SELECT 
  (SELECT COUNT(*) FROM public.categories) as categories,
  (SELECT COUNT(*) FROM public.sellers) as sellers,
  (SELECT COUNT(*) FROM public.products) as products,
  (SELECT COUNT(*) FROM public.payment_methods) as payment_methods,
  (SELECT COUNT(*) FROM public.cms_banners) as banners,
  (SELECT COUNT(*) FROM public.offer_categories) as offer_categories;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Seeder completed successfully!';
  RAISE NOTICE '📊 Database populated with test data';
  RAISE NOTICE '🏪 5 sellers created in Khartoum area';
  RAISE NOTICE '📦 12+ products across multiple categories';
  RAISE NOTICE '🗺️ All sellers have location data for nearby products feature';
  RAISE NOTICE '💡 Ready for testing!';
END $$;
