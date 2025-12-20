# Product Variants & Order Specifications Implementation Guide

## Overview
This document explains how to manage product variants (color, size, material) and ensure customers receive exactly what they ordered.

## Database Schema Changes

### Enhanced Fields in `order_items` Table:
1. **`selected_color`** (text) - Already exists
2. **`selected_size`** (text) - Already exists  
3. **`selected_material`** (text) - NEW - Stores the selected material
4. **`product_specifications`** (jsonb) - NEW - Flexible JSON for any additional specs
5. **`product_snapshot`** (jsonb) - NEW - Complete product data at time of purchase

### Enhanced Fields in `products` Table:
1. **`colors`** (text[]) - Already exists - Array of available colors
2. **`sizes`** (text[]) - Already exists - Array of available sizes
3. **`material`** (text) - Already exists - Single material (legacy)
4. **`materials`** (text[]) - NEW - Array of available materials for multi-material products

## Example: Apple Watch 10 with Multiple Variants

### Product Setup (in `products` table):
```json
{
  "id": "apple-watch-10",
  "name": "Apple Watch 10",
  "price": 450000,
  "colors": ["#000000", "#FFFFFF", "#FF0000", "#0000FF", ...], // 15 colors
  "sizes": ["41mm", "45mm"], // 2 sizes
  "materials": ["plastic", "rubber", "steel", "leather"], // 4 materials
  "stock_quantity": 100
}
```

### When Customer Places Order:

#### Frontend Flow:
1. Customer selects:
   - Color: "#FF0000" (Red)
   - Size: "45mm"
   - Material: "steel"

2. Add to cart with specifications:
```typescript
const cartItem = {
  product_id: "apple-watch-10",
  quantity: 1,
  selected_color: "#FF0000",
  selected_size: "45mm",
  selected_material: "steel",
  product_specifications: {
    color_name: "Red",
    size_display: "45mm",
    material_display: "Stainless Steel"
  }
};
```

#### Backend: Creating Order Item
```sql
INSERT INTO public.order_items (
  order_id,
  product_id,
  quantity,
  price_at_purchase,
  selected_color,
  selected_size,
  selected_material,
  product_specifications,
  product_snapshot,
  seller_id
) VALUES (
  'order-uuid',
  'apple-watch-10',
  1,
  450000,
  '#FF0000',
  '45mm',
  'steel',
  '{"color_name": "Red", "size_display": "45mm", "material_display": "Stainless Steel"}'::jsonb,
  '{"name": "Apple Watch 10", "colors": [...], "sizes": [...], "materials": [...]}'::jsonb,
  'seller-uuid'
);
```

## Implementation in Code

### 1. Product Detail Page Component

```typescript
// ProductDetail.tsx
import { useState } from 'react';

interface ProductVariant {
  color?: string;
  size?: string;
  material?: string;
}

export function ProductDetail({ product }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>({});
  
  const handleAddToCart = async () => {
    // Validate all required selections
    if (product.colors?.length > 0 && !selectedVariant.color) {
      toast.error('Please select a color');
      return;
    }
    if (product.sizes?.length > 0 && !selectedVariant.size) {
      toast.error('Please select a size');
      return;
    }
    if (product.materials?.length > 0 && !selectedVariant.material) {
      toast.error('Please select a material');
      return;
    }
    
    await addToCart({
      product_id: product.id,
      quantity: 1,
      selected_color: selectedVariant.color,
      selected_size: selectedVariant.size,
      selected_material: selectedVariant.material,
      product_specifications: {
        color_name: getColorName(selectedVariant.color),
        size_display: selectedVariant.size,
        material_display: selectedVariant.material
      }
    });
  };
  
  return (
    <div>
      {/* Color Selection */}
      {product.colors?.length > 0 && (
        <div>
          <h3>Select Color</h3>
          {product.colors.map(color => (
            <button
              key={color}
              onClick={() => setSelectedVariant({...selectedVariant, color})}
              className={selectedVariant.color === color ? 'selected' : ''}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
      
      {/* Size Selection */}
      {product.sizes?.length > 0 && (
        <div>
          <h3>Select Size</h3>
          {product.sizes.map(size => (
            <button
              key={size}
              onClick={() => setSelectedVariant({...selectedVariant, size})}
              className={selectedVariant.size === size ? 'selected' : ''}
            >
              {size}
            </button>
          ))}
        </div>
      )}
      
      {/* Material Selection */}
      {product.materials?.length > 0 && (
        <div>
          <h3>Select Material</h3>
          {product.materials.map(material => (
            <button
              key={material}
              onClick={() => setSelectedVariant({...selectedVariant, material})}
              className={selectedVariant.material === material ? 'selected' : ''}
            >
              {material}
            </button>
          ))}
        </div>
      )}
      
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

### 2. Cart Item Display

```typescript
// CartItem.tsx
export function CartItem({ item }) {
  return (
    <div className="cart-item">
      <img src={item.product.image} alt={item.product.name} />
      <div>
        <h3>{item.product.name}</h3>
        <div className="specifications">
          {item.selected_color && (
            <span>Color: <div style={{backgroundColor: item.selected_color}} /></span>
          )}
          {item.selected_size && <span>Size: {item.selected_size}</span>}
          {item.selected_material && <span>Material: {item.selected_material}</span>}
        </div>
        <p>Quantity: {item.quantity}</p>
        <p>Price: {item.price_at_purchase} SDG</p>
      </div>
    </div>
  );
}
```

### 3. Seller Order View

```typescript
// SellerOrderItem.tsx
export function SellerOrderItem({ orderItem }) {
  return (
    <div className="order-item">
      <h4>{orderItem.product_name}</h4>
      <div className="customer-selections">
        <h5>Customer Specifications:</h5>
        <ul>
          {orderItem.selected_color && (
            <li>
              Color: 
              <div 
                className="color-swatch" 
                style={{backgroundColor: orderItem.selected_color}}
              />
              {orderItem.product_specifications?.color_name}
            </li>
          )}
          {orderItem.selected_size && (
            <li>Size: {orderItem.selected_size}</li>
          )}
          {orderItem.selected_material && (
            <li>Material: {orderItem.selected_material}</li>
          )}
        </ul>
      </div>
      <p>Quantity: {orderItem.quantity}</p>
      <p>Price: {orderItem.price_at_purchase} SDG</p>
    </div>
  );
}
```

### 4. Database Query for Seller Orders

```typescript
// lib/orders.ts
export async function getSellerOrders(sellerId: string) {
  const { data, error } = await supabase
    .from('order_items_detailed') // Using the view we created
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
    
  return { data, error };
}
```

## Benefits of This Approach

1. **Exact Specifications**: Sellers see exactly what the customer ordered
2. **Historical Accuracy**: `product_snapshot` preserves product details even if product is deleted
3. **Flexibility**: `product_specifications` allows storing additional metadata
4. **Validation**: Helper function ensures customers can't select invalid combinations
5. **Easy Queries**: The `order_items_detailed` view provides all information in one query

## Migration Steps

1. Run the migration SQL in Supabase SQL Editor
2. Update TypeScript types to include new fields
3. Update Product Editor to support materials array
4. Update Product Detail page to show variant selectors
5. Update Cart to display selected specifications
6. Update Seller Order view to show customer selections

## Testing Checklist

- [ ] Product with only colors works
- [ ] Product with colors + sizes works
- [ ] Product with colors + sizes + materials works
- [ ] Product with no variants works
- [ ] Cart displays all selected specifications
- [ ] Order confirmation shows specifications
- [ ] Seller sees exact customer selections
- [ ] Product snapshot preserves data if product deleted
