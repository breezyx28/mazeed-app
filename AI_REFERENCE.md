# Konsau Clone UI - AI Reference Guide

## Project Overview
A modern e-commerce mobile-first React application built with TypeScript, featuring a clean UI design similar to popular shopping apps. The app focuses on product browsing, cart management, and user profile functionality.

## Tech Stack
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 6.30.1
- **Styling**: Tailwind CSS 3.4.17 + shadcn/ui components
- **Animations**: Framer Motion
- **Internationalization**: React i18next
- **Maps**: Leaflet + React Leaflet
- **State Management**: React Query (@tanstack/react-query)
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: Radix UI primitives

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (50+ components)
│   ├── BottomNav.tsx         # Main navigation component
│   ├── NavLink.tsx           # Custom NavLink wrapper
│   └── ProductCard.tsx       # Product display component
├── data/
│   └── products.ts           # Mock product data & types
├── hooks/
│   ├── use-mobile.tsx        # Mobile detection hook
│   └── use-toast.ts          # Toast notifications
├── lib/
│   └── utils.ts              # Utility functions (cn, etc.)
├── pages/                    # All page components
└── App.tsx                   # Main app with routing
```

## Key Features & Pages

### Core Pages
1. **Home** (`/`) - Product grid with categories, special offers
2. **ProductDetail** (`/product/:id`) - Detailed product view with variants
3. **Cart** (`/cart`) - Shopping cart with quantity management
4. **SearchPage** (`/search`) - Product search with filters
5. **Profile** (`/profile`) - User profile dashboard
6. **Login** (`/login`) - Authentication with email/phone/SSO
7. **Register** (`/register`) - User registration with full form

### Profile Sub-pages
- EditProfile, ShippingAddress, PaymentMethods
- MyOrders, Wishlist, Notifications, Settings

## Data Models

### Product Interface
```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  colors?: string[];
  description?: string;
}
```

### Categories
- All, Electronics, Fashion, Home, Sports
- Additional categories: Clothes, Bags, Shoes, Watch

## Design System

### Color Scheme (HSL)
- **Light Mode**: Clean whites and grays
  - Background: `0 0% 98%`
  - Card: `0 0% 100%`
  - Primary: `0 0% 10%`
  - Muted: `0 0% 96%`

- **Dark Mode**: Dark grays and whites
  - Background: `0 0% 10%`
  - Card: `0 0% 15%`
  - Primary: `0 0% 98%`

### Layout Patterns
- **Mobile-first**: Max-width 448px (max-w-md)
- **RTL Support**: Arabic language with right-to-left layout
- **Sticky headers**: All pages use sticky navigation
- **Bottom navigation**: Fixed bottom nav with 4 main sections and 3D icons
- **Card-based UI**: Rounded corners (0.75rem radius)
- **Grid layouts**: 2-column product grids
- **Page transitions**: Smooth animations between routes

## Component Patterns

### Navigation
- **BottomNav**: Fixed bottom navigation with 3D icons and animations
- **NavLink**: Custom wrapper for React Router NavLink
- **Header patterns**: Consistent back button + title + action
- **LanguageSwitcher**: Toggle between Arabic and English
- **PageTransition**: Animated route transitions

### Product Display
- **ProductCard**: Reusable product component with image, rating, price
- **Wishlist integration**: Heart icons on all product cards
- **Discount badges**: Prominent discount display
- **Color variants**: Color picker for products with variants

### Interactive Elements
- **Quantity selectors**: Plus/minus buttons with current count
- **Filter sheets**: Bottom sheet for search filters
- **Toast notifications**: Success/error feedback
- **Loading states**: Skeleton components available
- **3D Icons**: Enhanced icons with shadow, glow, and hover effects
- **Map Integration**: Interactive Leaflet maps for location selection
- **Animated Forms**: Login/register forms with smooth animations

## State Management Patterns

### React Query Usage
- QueryClient setup in App.tsx
- Ready for API integration
- Caching and background updates

### Local State Patterns
- useState for UI state (modals, selections)
- Form state with React Hook Form
- Cart state (currently mock data)

## Styling Conventions

### Tailwind Classes
- **Spacing**: Consistent padding/margin (px-4, py-4, gap-3)
- **Rounded corners**: rounded-2xl for cards, rounded-full for buttons
- **Transitions**: hover:bg-accent transition-colors
- **Typography**: text-xl font-bold for headings

### Component Styling
- **Cards**: `bg-card rounded-2xl p-4`
- **Buttons**: `rounded-full` with consistent heights
- **Icons**: Lucide icons with w-5 h-5 or w-6 h-6
- **Grids**: `grid grid-cols-2 gap-3`

## Mock Data Structure

### Products Array (8 items)
- Electronics: Beats Solo Pro, Bose Headphones, Canon Camera, Apple Watch
- Fashion: Nike Air Max, Adidas Running Shoes, Denim Jacket
- Accessories: Leather Bag

### Sample Product
```typescript
{
  id: "1",
  name: "Beats Solo Pro",
  price: 299.00,
  originalPrice: 349.00,
  discount: 30,
  image: "https://images.unsplash.com/...",
  rating: 4.8,
  reviews: 345,
  category: "Electronics",
  colors: ["#000000", "#FFFFFF", "#FF0000"],
  description: "High-performance wireless headphones..."
}
```

## Development Patterns

### File Naming
- PascalCase for components: `ProductCard.tsx`
- camelCase for utilities: `use-mobile.tsx`
- kebab-case for UI components: `alert-dialog.tsx`

### Import Patterns
- Absolute imports with `@/` alias
- UI components from `@/components/ui/`
- Lucide icons: `import { Icon } from "lucide-react"`

### TypeScript Usage
- Strict typing enabled
- Interface definitions for all data models
- Props interfaces for all components

## Key Dependencies

### UI & Styling
- `@radix-ui/*` - Accessible UI primitives
- `tailwindcss` - Utility-first CSS
- `class-variance-authority` - Component variants
- `tailwind-merge` - Class merging utility
- `framer-motion` - Animation library

### Functionality
- `react-router-dom` - Client-side routing
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `date-fns` - Date utilities
- `react-i18next` - Internationalization
- `i18next-browser-languagedetector` - Language detection
- `leaflet` - Interactive maps
- `react-leaflet` - React wrapper for Leaflet

### Development
- `@vitejs/plugin-react-swc` - Fast React refresh
- `typescript` - Type checking
- `eslint` - Code linting
- `lovable-tagger` - Development tagging

## Common Tasks for AI

### Adding New Products
1. Add to `products` array in `src/data/products.ts`
2. Follow existing Product interface
3. Use Unsplash images with 400x400 crop

### Adding Translations
1. Add new keys to `src/i18n/index.ts` in both `ar` and `en` objects
2. Use `useTranslation()` hook in components
3. Call `t('key')` to get translated text

### Creating New Pages
1. Create in `src/pages/` directory
2. Add route to `App.tsx`
3. Follow mobile-first layout patterns
4. Include sticky header and bottom padding

### Styling New Components
1. Use existing Tailwind patterns
2. Follow card-based design system
3. Ensure mobile responsiveness
4. Add hover states and transitions

### State Management
1. Use React Query for server state
2. Local state with useState/useReducer
3. Form state with React Hook Form
4. Toast notifications for feedback

### Adding Animations
1. Import `motion` from `framer-motion`
2. Replace HTML elements with `motion.div`, `motion.button`, etc.
3. Add `initial`, `animate`, `exit` props for transitions
4. Use `whileHover` and `whileTap` for interactions

## Performance Considerations
- Mobile-first responsive design
- Image optimization with proper sizing
- Lazy loading ready (React.lazy)
- Bundle splitting with Vite
- CSS-in-JS avoided for performance

## Accessibility Features
- Radix UI components are accessible by default
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Focus management in modals/sheets

## New Features Added

### Authentication System
- Login page with email/phone/SSO options
- Register page with full user information
- Animated forms with validation
- Social login integration (Google, Facebook)

### Internationalization
- Arabic as primary language
- English as secondary language
- RTL layout support
- Cairo font for Arabic, Roboto for English
- Language switcher component

### Enhanced UI/UX
- Framer Motion animations throughout
- 3D icons with shadow and glow effects
- Page transitions between routes
- Interactive map integration for addresses
- Improved bottom navigation with animations

### Map Integration
- Leaflet maps in shipping address page
- Click to select location functionality
- Search location input
- Marker placement and confirmation

This reference provides the foundation for understanding and extending the Konsau Clone UI application efficiently with modern features and Arabic localization.

## Recent Updates (November 2025)

### Offers & Categories System
- **Offer Types**: 7 categorized offers (Kids, Eid, Winter, Jewelry, Flash, New Trends, Under 5000 SDG)
- **Categories**: 12 product categories with emoji icons
- **Badge System**: 8 badge types with WhatsApp-style emojis and color coding
- **Currency**: All prices converted to SDG (Sudanese Pound)
- **Product Count**: Expanded to 21 products across all categories

### New Components
- **ProductBadge**: Displays product badges with emojis and localized labels
- **OfferSection**: Horizontal scrollable slider for offer-specific products

### New Pages
- **Categories** (`/categories`): 2-column grid of clickable category cards
- **Offers** (`/offers`): 2-column grid of active offer cards with product counts

### Enhanced Features
- **Home Page**: Dynamic offer sections with horizontal sliders
- **Search Page**: URL parameter support for category and offer filtering
- **Product Card**: Badge display and SDG price formatting
- **Bottom Navigation**: Added Categories and Offers (5 items total)

### Data Structures
```typescript
// Offer Types
type OfferType = 'kids' | 'eid' | 'winter' | 'jewelry' | 'flash' | 'newTrend' | 'under5000' | null;

// Badge Types
type BadgeType = 'freeShipment' | 'discount' | 'winter' | 'eid' | 'new' | 'flash' | 'kids' | 'jewelry';

// Extended Product Interface
interface Product {
  // ... existing fields
  badges?: BadgeType[];
  offerType?: OfferType;
  offerExpiry?: string; // ISO date string
}
```

### Offer Categories
- Kids Wear Offers 👶
- Eid Offers 🌙
- Under 5000 SDG 💰
- Winter Offers ❄️
- Jewelry Offers 💎
- Flash Deals ⚡
- New Trends ✨

### Product Categories
- All 🛍️
- Kids Wear 👶
- Women's Fashion 👗
- Men's Fashion 👔
- Jewelry 💍
- Electronics 📱
- Home & Living 🏠
- Sports ⚽
- Bags 👜
- Shoes 👟
- Watches ⌚
- Beauty 💄