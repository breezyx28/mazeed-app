-- Migration: Enhance product variants and order items to support multiple product options
-- Date: 2025-12-19

-- 1. Add material field to order_items (to match products table)
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS selected_material text;

-- 2. Add a flexible JSON field for any additional product specifications
-- This allows for future extensibility without schema changes
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_specifications jsonb DEFAULT '{}'::jsonb;

-- 3. Add a snapshot of the product at time of purchase
-- This preserves the exact product details even if the product is later modified or deleted
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS product_snapshot jsonb;

-- 4. Create an index on product_specifications for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_specifications 
ON public.order_items USING gin(product_specifications);

-- 5. Add a helper function to validate product specifications match available options
CREATE OR REPLACE FUNCTION validate_product_specifications(
    p_product_id text,
    p_color text,
    p_size text,
    p_material text
) RETURNS boolean AS $$
DECLARE
    product_record RECORD;
BEGIN
    -- Get the product details
    SELECT colors, sizes, material INTO product_record
    FROM public.products
    WHERE id = p_product_id;
    
    -- If product not found, return false
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Validate color if provided
    IF p_color IS NOT NULL AND product_record.colors IS NOT NULL THEN
        IF NOT (p_color = ANY(product_record.colors)) THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Validate size if provided
    IF p_size IS NOT NULL AND product_record.sizes IS NOT NULL THEN
        IF NOT (p_size = ANY(product_record.sizes)) THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Material validation (assuming single material per product variant)
    -- You might want to extend products table to have materials array
    IF p_material IS NOT NULL AND product_record.material IS NOT NULL THEN
        IF p_material != product_record.material THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 6. Add materials array to products table for products with multiple material options
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS materials text[] DEFAULT '{}';

-- 7. Create a view for easy order item details with full specifications
CREATE OR REPLACE VIEW order_items_detailed AS
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    p.name as product_name,
    p.image as product_image,
    oi.quantity,
    oi.price_at_purchase,
    oi.selected_color,
    oi.selected_size,
    oi.selected_material,
    oi.product_specifications,
    oi.product_snapshot,
    oi.seller_id,
    s.shop_name as seller_shop_name,
    oi.created_at,
    -- Construct a human-readable specification string
    CONCAT_WS(', ',
        CASE WHEN oi.selected_color IS NOT NULL THEN 'Color: ' || oi.selected_color END,
        CASE WHEN oi.selected_size IS NOT NULL THEN 'Size: ' || oi.selected_size END,
        CASE WHEN oi.selected_material IS NOT NULL THEN 'Material: ' || oi.selected_material END
    ) as specifications_summary
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
LEFT JOIN public.sellers s ON oi.seller_id = s.id;

-- 8. Add comment documentation
COMMENT ON COLUMN public.order_items.selected_color IS 'The color variant selected by the customer';
COMMENT ON COLUMN public.order_items.selected_size IS 'The size variant selected by the customer';
COMMENT ON COLUMN public.order_items.selected_material IS 'The material variant selected by the customer';
COMMENT ON COLUMN public.order_items.product_specifications IS 'Additional product specifications in JSON format for extensibility';
COMMENT ON COLUMN public.order_items.product_snapshot IS 'Complete snapshot of the product at time of purchase, including all available options';
COMMENT ON COLUMN public.products.materials IS 'Array of available materials for this product (e.g., ["plastic", "rubber", "steel", "leather"])';
