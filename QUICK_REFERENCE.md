# Mazeed Store - Quick Reference Guide

## 🎯 Navigation Structure

```
Bottom Navigation (5 items):
├── 🏠 Home
├── 🔲 Categories → /categories
├── 🏷️ Offers → /offers
├── 🛒 Cart
└── 👤 Profile
```

## 📄 Page Structure

### Home Page (`/`)
```
Header (Search + Icons)
├── Ads Slider (horizontal)
└── Dynamic Offer Sections
    ├── Flash Deals ⚡ (horizontal slider)
    ├── Kids Wear 👶 (horizontal slider)
    ├── Eid Offers 🌙 (horizontal slider)
    ├── Winter Offers ❄️ (horizontal slider)
    ├── Jewelry Offers 💎 (horizontal slider)
    ├── New Trends ✨ (horizontal slider)
    └── Under 5000 SDG 💰 (horizontal slider)
```

### Categories Page (`/categories`)
```
Header (Back + Title)
└── 2-Column Grid
    ├── Kids Wear 👶
    ├── Women's Fashion 👗
    ├── Men's Fashion 👔
    ├── Jewelry 💍
    ├── Electronics 📱
    ├── Home & Living 🏠
    ├── Sports ⚽
    ├── Bags 👜
    ├── Shoes 👟
    ├── Watches ⌚
    └── Beauty 💄
```

### Offers Page (`/offers`)
```
Header (Back + Title + Active Count)
└── 2-Column Grid
    ├── Kids Wear Offers 👶 [count badge]
    ├── Eid Offers 🌙 [count badge]
    ├── Under 5000 SDG 💰 [count badge]
    ├── Winter Offers ❄️ [count badge]
    ├── Jewelry Offers 💎 [count badge]
    ├── Flash Deals ⚡ [count badge]
    └── New Trends ✨ [count badge]
```

### Search Page (`/search`)
```
Header (Search Bar + Filter)
├── Category Pills (horizontal scroll)
├── Results Count
└── Product Grid (2 columns)

Supports URL Parameters:
- ?category=Kids
- ?offer=flash
```

## 🏷️ Badge System

```typescript
Badges (up to 2 shown per product):
├── 🚚 Free Shipping (green)
├── 🏷️ Discount (red)
├── ❄️ Winter (blue)
├── 🌙 Eid (purple)
├── ✨ New (yellow)
├── ⚡ Flash (orange)
├── 👶 Kids (pink)
└── 💎 Jewelry (indigo)
```

## 💰 Price Format

```typescript
// Old (USD)
$299.00

// New (SDG)
134,550 SDG

// Formatting Function
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-SD', {
    style: 'currency',
    currency: 'SDG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
```

## 🗂️ File Structure

```
src/
├── components/
│   ├── ProductBadge.tsx (NEW)
│   ├── OfferSection.tsx (NEW)
│   ├── ProductCard.tsx (UPDATED - badges + SDG)
│   └── BottomNav.tsx (UPDATED - 5 items)
├── pages/
│   ├── Categories.tsx (NEW)
│   ├── Offers.tsx (NEW)
│   ├── Home.tsx (UPDATED - offer sections)
│   └── SearchPage.tsx (UPDATED - URL params)
├── data/
│   └── products.ts (UPDATED - 21 products, SDG, badges)
└── i18n/
    └── index.ts (UPDATED - new translations)
```

## 🔄 Data Flow

### Viewing Offers
```
User Journey:
1. Home → See offer section
2. Click "More" → Navigate to /offers
3. Click offer card → Navigate to /search?offer=flash
4. View filtered products
```

### Viewing Categories
```
User Journey:
1. Bottom Nav → Click Categories
2. View category grid
3. Click category card → Navigate to /search?category=Kids
4. View filtered products
```

## 📊 Product Example

```typescript
{
  id: "7",
  name: "Kids Winter Jacket",
  price: 35550, // SDG
  originalPrice: 44550,
  discount: 20,
  image: "https://...",
  rating: 4.6,
  reviews: 234,
  category: "Kids",
  colors: ["#FF69B4", "#87CEEB", "#FFD700"],
  description: "Warm and cozy winter jacket for kids",
  badges: ['discount', 'winter', 'kids'], // NEW
  offerType: 'kids', // NEW
  offerExpiry: '2025-12-31' // NEW
}
```

## 🌐 Localization

All text supports Arabic (RTL) and English (LTR):

```typescript
// Offer Names
{
  name: "Kids Wear Offers",
  nameAr: "عروض ملابس الأطفال"
}

// Badge Labels
{
  label: 'Free Shipping',
  labelAr: 'شحن مجاني'
}

// Category Names
{
  name: "Kids Wear",
  nameAr: "ملابس الأطفال"
}
```

## 🎨 Design Tokens

### Colors
- Green: Free Shipping
- Red: Discount
- Blue: Winter
- Purple: Eid
- Yellow: New
- Orange: Flash
- Pink: Kids
- Indigo: Jewelry

### Layout
- Max Width: 448px (max-w-md)
- Grid: 2 columns
- Gap: 0.75rem (gap-3)
- Padding: 1rem (px-4)
- Border Radius: 1rem (rounded-2xl)

### Animations
- Hover Scale: 1.02
- Tap Scale: 0.98
- Duration: 0.2s - 0.3s
- Easing: Spring (Framer Motion)

## 🚀 Quick Commands

```bash
# Start dev server
bun run dev

# View in browser
http://localhost:5173

# Test pages
http://localhost:5173/categories
http://localhost:5173/offers
http://localhost:5173/search?category=Kids
http://localhost:5173/search?offer=flash
```

## ✅ Testing Checklist

- [ ] Home page shows all active offer sections
- [ ] Categories page displays 11 category cards (excluding "All")
- [ ] Offers page shows 7 offer cards with product counts
- [ ] Clicking category navigates to filtered search
- [ ] Clicking offer navigates to filtered search
- [ ] Product cards show badges (max 2)
- [ ] Prices display in SDG format
- [ ] Expired offers are filtered out
- [ ] Bottom nav highlights active page
- [ ] RTL/LTR switching works correctly
- [ ] Horizontal sliders scroll smoothly
- [ ] Animations are smooth on mobile

---

**Last Updated**: November 26, 2025
