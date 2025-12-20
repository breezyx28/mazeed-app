# Application Blueprint: Mazeed Store

## 1. Application Overview
- **App Type**: Hybrid E-commerce Application (Mobile & Web)
- **Core Purpose**: A multi-category retail marketplace supporting offers, flash deals, and categorized product listings.
- **Target Platforms**: 
  - **Web**: Responsive SPA (Single Page Application)
  - **Mobile**: Android (via Capacitor) & iOS (Codebase prepared)
- **High-Level Architecture**: Client-side React application with specific mobile bridges for native functionality. connects to **Supabase** for Authentication and User Data, while currently serving Product Data from a static local layer (hybrid data approach).

## 2. Technology Stack

### Frontend
- **Framework**: React 19 (RC) with Vite
- **Language**: TypeScript
- **UI Libraries**: 
  - **Shadcn UI**: (Radix Primitives + Tailwind) for core components
  - **Tailwind CSS**: Utility-first styling
  - **Lucide React**: Iconography
  - **Framer Motion**: Animations and transitions
  - **Embla Carousel**: Touch-friendly sliders
- **State Management**: 
  - **React Query (@tanstack/react-query)**: Server state management (prepared).
  - **Context API**: Global UI state (Auth, Notifications, Settings).
- **Routing**: `react-router-dom` with a custom `PageTransition` wrapper.
- **Internationalization**: `i18next` & `react-i18next` (Supports Arabic/English + RTL/LTR).

### Backend / Services
- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Maps/Location**: OpenStreetMap (Leaflet + React Leaflet) with a custom proxy for Nominatim.
- **Mobile Runtime**: Capacitor (v7)

## 3. Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # Shadcn atomic components (Button, Input, Sheet, etc.)
│   └── [Feature].tsx    # specific components (ProductCard, Navbar, etc.)
├── context/             # Global State Providers
│   ├── AuthContext.tsx         # User session & profile logic
│   ├── NotificationContext.tsx # Notification state
│   └── SettingsContext.tsx     # App settings (theme, etc.)
├── data/                # Static Data Sources (Products, Categories)
├── hooks/               # Custom React Hooks
│   ├── useWishlist.ts   # Wishlist logic (Local + Supabase sync)
│   └── use-toast.ts     # Toast notification logic
├── lib/                 # Utilities and SDK Initializations
│   ├── supabase.ts      # Supabase Client Instance
│   └── capacitor-utils.ts # Native bridge helpers
├── pages/               # Route Components (Screens)
│   ├── Home.tsx
│   ├── ProductDetail.tsx
│   └── [Others].tsx
└── index.css            # Global Styles & Tailwind Directives
```

## 4. Design System

### Layout System
- **Navigation**:
  - **Mobile**: Bottom Navigation Bar (`BottomNav.tsx`) visible on main screens, hidden on auth/detail screens.
  - **Transitions**: `AnimatePresence` handles page transitions.
- **Container**: responsive `max-w-md mx-auto` pattern used often to simulate mobile-app feel on desktop interact.

### UI Components (Shadcn-based)
- **Philosophy**: Atomic, copy-pasteable components living in `src/components/ui`.
- **Key Components**:
  - `Sheet.tsx` / `Drawer.tsx`: For mobile-friendly menus and filters.
  - `Card.tsx`: Foundation for Product and Info cards.
  - `Buttom.tsx`: Standardized interactable with variants (default, outline, ghost).

### Typography
- **Font Families**:
  - **Arabic**: 'Cairo', sans-serif
  - **English**: 'Roboto', sans-serif
- **Switching**: Handled globally in `index.css` based on `[dir="ltr"]` vs `[dir="rtl"]`.

### Color System
- **Strategy**: HSL-based CSS Variables defined in `index.css`.
- **Palette**:
  - **Primary**: Orange/Gold (`--primary: 38 92% 50%`)
  - **Background**: Off-white (`--background: 0 0% 98%`)
  - **Card**: White (`--card: 0 0% 100%`)
  - **Dark Mode**: Fully supported via `.dark` class overrides.

## 5. Styling Strategy
- **Functions**: `tailwind-merge` and `clsx` (`cn` utility) used to allow easy class overriding on components.
- **Method**: 100% Tailwind CSS classes. No CSS modules or Styled Components.
- **Animations**: `tailwindcss-animate` plugin for simple effects, `framer-motion` for complex page transitions and interaction gestures.

## 6. Authentication Flow
- **Providers**:
  - **Email/Password**: Standard flow.
  - **Google OAuth**: Implemented with platform detection (Web vs Native Deep Link).
- **Session**: Managed by `AuthContext` observing `supabase.auth.onAuthStateChange`.
- **Profile**: Custom `profiles` table in Supabase syncs user metadata (avatar, name) upon login.
- **Protection**: `ProtectedRoute` wrapper component redirects unauthenticated users to `/login`.

## 7. Data & API Layer
- **Architecture**: Hybrid Approach.
  - **User Data (Wishlist, Profile)**: Fetched directly from Supabase in Hooks/Context.
  - **Product Data**: Currently served from static files (`@/data/products.ts`).
- **Data Fetching**:
  - **Read**: `useEffect` invoking Supabase SDK methods.
  - **Write**: Methods exposed via Context (e.g., `loginWithEmail`, `addToWishlist`).
  - **Synchronization**: `useWishlist` hook implements an Optimistic UI pattern—updates LocalStorage immediately, then syncs with Supabase if online/authed.

## 8. Storage & Media Handling
- **Media**: Primarily using external URLs (Unsplash) for current product data.
- **Local Storage**:
  - `mazeed-auth`: Supabase session token.
  - `mazeed-wishlist`: Local non-authed wishlist persistence.

## 9. Platform-Specific Logic
- **Capacitor**: Used for Native Building.
- **Deep Linking**: `useDeepLinking.ts` handles generic app-opening links.
- **Auth Redirects**: Special logic in `AuthContext` to handle `mazeedapp://` scheme for Google Auth on Android.
- **Plugins**: Camera, Haptics, Share, Local Notifications, Geolocation.

## 10. Environment & Configuration
- **Environments**: `.env` file manages keys.
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Proxy**: `vite.config.ts` proxies `/nominatim` requests to avoid CORS issues on Web.

## 11. Reusable Patterns & Conventions
- **Hooks**: Logic separation (e.g., `useWishlist` handles both storage and API, exposing simple methods to UI).
- **Components**: Props interface always includes `className` for styling flexibility.
- **Feature Flags**: (Implicit) Static data used where backend isn't ready.

## 12. Strengths of Current Architecture
- **Mobile-First UX**: The layout and component choices (Drawers, BottomNav, Touch Sliders) feel native.
- **Modular Design System**: Updating a core color or button style propagates instantly.
- **Optimistic Performance**: The app feels instant because of local-first strategies (wishlist) and static product data.
- **Scalable Auth**: Supabase Auth handles the heavy lifting of security/sessions.

## 13. Limitations & Constraints
- **Static Catalog**: Product layout is currently hardcoded; moving to a dynamic DB requires refactoring `Home.tsx` and specific data hooks.
- **Search Logic**: Currently client-side filtering of the static list. Moving to backend search will require API changes.
- **SSR**: It is a Client-Side SPA. SEO might be limited compared to Next.js (though `react-helmet` or similar could mitigate).

## 14. How to Rebuild This App for a Different Idea
**Scenario**: You want to build a "Food Delivery App" or "Service Booking App" using this codebase.

1.  **Reuse (Keep 90%)**:
    -   Keep `src/components/ui` (The entire design system).
    -   Keep `src/context/AuthContext` (The auth flow is generic).
    -   Keep `src/lib/*` (Supabase and Capacitor setup).
    -   Keep `src/index.css` (Just change the HSL color variables for new branding).

2.  **Rename/Configure**:
    -   `tailwind.config.ts`: Change primary colors.
    -   `src/i18n`: Update `locales` with new text (e.g., "Order Food" instead of "Add to Cart").

3.  **Replace (The Business Logic)**:
    -   **Data**: Replace `src/data/products.ts` with your new data model (e.g., `data/restaurants.ts`).
    -   **Pages**: 
        -   Modify `Home.tsx` to display Restaurants instead of Products.
        -   Modify `ProductDetail.tsx` -> `MenuItemDetail.tsx`.
    -   **Navigation**: Update `BottomNav.tsx` icons/labels.

4.  **Backend Transition**:
    -   When ready for real data, replace the `import { products }` lines with a useQuery hook that fetches from a new Supabase table (e.g., `supabase.from('menu_items').select('*')`).
