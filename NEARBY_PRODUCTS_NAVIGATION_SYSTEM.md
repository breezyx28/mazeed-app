# Nearby Products & Store Navigation System - Technical Specification

## 📋 Overview

A location-based feature that shows customers nearby products from stores in their neighborhood, with integrated navigation to help them walk to physical store locations. Particularly useful for stores that don't offer delivery/shipping services.

---

## 🎯 Business Requirements

### Problem Statement
- Not all stores offer delivery or shipping services
- Customers are unaware of products available in nearby physical stores
- No easy way to discover and navigate to local shops
- Missing "local shopping" experience in the digital marketplace

### Solution
Enable customers to:
1. Discover products from nearby stores based on their interests
2. View personalized recommendations using favorite categories
3. Get walking directions to physical store locations
4. See real-time distance and estimated walking time

---

## 📐 System Architecture

### 1. Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Home Screen                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Nearby Products Section                          │  │
│  │  - Category tabs (based on user favorites)       │  │
│  │  - Horizontal product slider                     │  │
│  │  - Distance badges                               │  │
│  │  - "Navigate" buttons                            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
                    User clicks "Navigate"
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Navigation Page                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Leaflet Map                                      │  │
│  │  - Blue marker: User location                    │  │
│  │  - Red marker: Store location                    │  │
│  │  - Blue polyline: Walking route                  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Route Details                                    │  │
│  │  - Distance (km)                                 │  │
│  │  - Duration (minutes)                            │  │
│  │  - Turn-by-turn directions                      │  │
│  │  - Action buttons                                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### A. User Category Interactions Table

```sql
CREATE TABLE IF NOT EXISTS user_category_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'click', 'purchase')),
  interaction_count integer DEFAULT 1,
  last_interaction_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_category_interaction 
    UNIQUE(user_id, category_id, interaction_type)
);

CREATE INDEX idx_user_category_interactions_user 
  ON user_category_interactions(user_id);

CREATE INDEX idx_user_category_interactions_category 
  ON user_category_interactions(category_id);

CREATE INDEX idx_user_category_interactions_count 
  ON user_category_interactions(user_id, interaction_count DESC);
```

### B. Helper Functions

#### Get Nearby Products (Geospatial Query)

```sql
CREATE OR REPLACE FUNCTION get_nearby_products(
  p_user_lat double precision,
  p_user_lng double precision,
  p_category_id text,
  p_radius_km double precision DEFAULT 5,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  product_id text,
  product_name text,
  product_price numeric,
  product_image text,
  product_rating numeric,
  seller_id uuid,
  seller_name text,
  seller_address text,
  seller_lat double precision,
  seller_lng double precision,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.price as product_price,
    p.image as product_image,
    p.rating as product_rating,
    s.id as seller_id,
    s.shop_name as seller_name,
    (s.location->>'address')::text as seller_address,
    (s.location->>'lat')::double precision as seller_lat,
    (s.location->>'lng')::double precision as seller_lng,
    -- Haversine formula for distance calculation
    (
      6371 * acos(
        cos(radians(p_user_lat)) * 
        cos(radians((s.location->>'lat')::double precision)) * 
        cos(radians((s.location->>'lng')::double precision) - radians(p_user_lng)) + 
        sin(radians(p_user_lat)) * 
        sin(radians((s.location->>'lat')::double precision))
      )
    ) as distance_km
  FROM products p
  JOIN sellers s ON p.seller_id = s.id
  WHERE 
    p.category_id = p_category_id
    AND p.status = 'published'
    AND p.stock_quantity > 0
    AND s.location IS NOT NULL
    AND (s.location->>'lat') IS NOT NULL
    AND (s.location->>'lng') IS NOT NULL
    -- Filter by radius
    AND (
      6371 * acos(
        cos(radians(p_user_lat)) * 
        cos(radians((s.location->>'lat')::double precision)) * 
        cos(radians((s.location->>'lng')::double precision) - radians(p_user_lng)) + 
        sin(radians(p_user_lat)) * 
        sin(radians((s.location->>'lat')::double precision))
      )
    ) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

#### Track Category Interaction

```sql
CREATE OR REPLACE FUNCTION increment_category_interaction(
  p_user_id uuid,
  p_category_id text,
  p_interaction_type text
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_category_interactions (
    user_id,
    category_id,
    interaction_type,
    interaction_count,
    last_interaction_at
  ) VALUES (
    p_user_id,
    p_category_id,
    p_interaction_type,
    1,
    now()
  )
  ON CONFLICT (user_id, category_id, interaction_type)
  DO UPDATE SET
    interaction_count = user_category_interactions.interaction_count + 1,
    last_interaction_at = now();
END;
$$ LANGUAGE plpgsql;
```

#### Get User's Favorite Categories

```sql
CREATE OR REPLACE FUNCTION get_user_favorite_categories(
  p_user_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  category_id text,
  category_name text,
  category_name_ar text,
  total_interactions integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    c.name_ar as category_name_ar,
    SUM(uci.interaction_count)::integer as total_interactions
  FROM user_category_interactions uci
  JOIN categories c ON uci.category_id = c.id
  WHERE uci.user_id = p_user_id
  GROUP BY c.id, c.name, c.name_ar
  ORDER BY total_interactions DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 🗺️ Routing & Navigation

### Option 1: OSRM (Open Source Routing Machine) ⭐ **RECOMMENDED**

```typescript
interface RouteResponse {
  coordinates: [number, number][]; // [lat, lng][]
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
}

interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  maneuver: {
    type: string;
    modifier?: string;
  };
}

const getWalkingRoute = async (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteResponse> => {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/foot/` +
      `${start.lng},${start.lat};${end.lng},${end.lat}?` +
      `overview=full&geometries=geojson&steps=true&language=en`
    );
    
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error('Routing failed');
    }
    
    const route = data.routes[0];
    
    return {
      coordinates: route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      ),
      distance: route.distance,
      duration: route.duration,
      steps: route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.instruction || 
                    getManeuverText(step.maneuver),
        distance: step.distance,
        duration: step.duration,
        maneuver: step.maneuver
      }))
    };
  } catch (error) {
    console.error('Routing error:', error);
    
    // Fallback to straight line
    return {
      coordinates: [
        [start.lat, start.lng],
        [end.lat, end.lng]
      ],
      distance: calculateHaversineDistance(start, end) * 1000,
      duration: 0,
      steps: []
    };
  }
};

// Helper: Convert maneuver to readable text
const getManeuverText = (maneuver: any): string => {
  const { type, modifier } = maneuver;
  
  const maneuverMap: Record<string, string> = {
    'turn': `Turn ${modifier}`,
    'new name': 'Continue',
    'depart': 'Head',
    'arrive': 'Arrive at destination',
    'merge': 'Merge',
    'on ramp': 'Take the ramp',
    'off ramp': 'Take the exit',
    'fork': `Take ${modifier} fork`,
    'end of road': `Turn ${modifier}`,
    'continue': 'Continue straight',
    'roundabout': 'Enter roundabout',
    'rotary': 'Enter rotary',
    'roundabout turn': 'Exit roundabout'
  };
  
  return maneuverMap[type] || 'Continue';
};

// Helper: Calculate distance using Haversine formula
const calculateHaversineDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
    Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
```

**Why OSRM?**
- ✅ **Free** - No API key required
- ✅ **Fast** - Optimized for performance
- ✅ **Reliable** - Used by major companies
- ✅ **Global Coverage** - Works worldwide including Sudan
- ✅ **Walking Routes** - Supports pedestrian navigation
- ✅ **Turn-by-turn** - Provides detailed directions

---

## 🎨 UI Components

### 1. Nearby Products Section (Home Screen)

```typescript
// components/NearbyProducts.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface NearbyProduct {
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string;
  product_rating: number;
  seller_id: string;
  seller_name: string;
  seller_lat: number;
  seller_lng: number;
  distance_km: number;
}

export function NearbyProducts() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [favoriteCategories, setFavoriteCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [nearbyProducts, setNearbyProducts] = useState<NearbyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get user location
  useEffect(() => {
    getUserLocation();
  }, []);
  
  // Get favorite categories
  useEffect(() => {
    if (user) {
      loadFavoriteCategories();
    }
  }, [user]);
  
  // Load nearby products when category or location changes
  useEffect(() => {
    if (userLocation && selectedCategory) {
      loadNearbyProducts();
    }
  }, [userLocation, selectedCategory]);
  
  const getUserLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });
      
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      
      // Cache location
      localStorage.setItem('lastKnownLocation', JSON.stringify({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Location error:', error);
      
      // Try to use cached location
      const cached = localStorage.getItem('lastKnownLocation');
      if (cached) {
        const { lat, lng, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 3600000) { // 1 hour
          setUserLocation({ lat, lng });
        }
      }
    }
  };
  
  const loadFavoriteCategories = async () => {
    const { data, error } = await supabase.rpc('get_user_favorite_categories', {
      p_user_id: user.id,
      p_limit: 5
    });
    
    if (!error && data && data.length > 0) {
      setFavoriteCategories(data);
      setSelectedCategory(data[0].category_id);
    }
  };
  
  const loadNearbyProducts = async () => {
    if (!userLocation || !selectedCategory) return;
    
    setLoading(true);
    
    const { data, error } = await supabase.rpc('get_nearby_products', {
      p_user_lat: userLocation.lat,
      p_user_lng: userLocation.lng,
      p_category_id: selectedCategory,
      p_radius_km: 5,
      p_limit: 20
    });
    
    if (!error) {
      setNearbyProducts(data || []);
    }
    
    setLoading(false);
  };
  
  if (!userLocation || favoriteCategories.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center justify-between px-4">
        <div>
          <h2 className="text-xl font-bold">{t('nearbyProducts')}</h2>
          <p className="text-sm text-muted-foreground">{t('basedOnInterests')}</p>
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-2 px-4 overflow-x-auto">
        {favoriteCategories.map((category) => (
          <button
            key={category.category_id}
            onClick={() => setSelectedCategory(category.category_id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              selectedCategory === category.category_id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {category.category_name}
          </button>
        ))}
      </div>
      
      {/* Products Slider */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 px-4">
          {loading ? (
            <div className="flex items-center justify-center w-full py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : nearbyProducts.length > 0 ? (
            nearbyProducts.map((product) => (
              <NearbyProductCard
                key={product.product_id}
                product={product}
                onNavigate={() => navigateToStore(product)}
              />
            ))
          ) : (
            <div className="w-full text-center py-8 text-muted-foreground">
              {t('noNearbyProducts')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function NearbyProductCard({ product, onNavigate }: any) {
  const { t } = useTranslation();
  
  return (
    <div className="flex-shrink-0 w-64 bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="relative h-48">
        <img 
          src={product.product_image} 
          alt={product.product_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-semibold">
          {product.distance_km.toFixed(1)} km
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        <h3 className="font-semibold truncate">{product.product_name}</h3>
        <p className="text-sm text-muted-foreground truncate">
          📍 {product.seller_name}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold">{product.product_price} SDG</span>
          {product.product_rating > 0 && (
            <span className="text-sm">⭐ {product.product_rating}</span>
          )}
        </div>
        <button
          onClick={onNavigate}
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition"
        >
          🧭 {t('navigate')}
        </button>
      </div>
    </div>
  );
}
```

### 2. Navigation Page

```typescript
// pages/NavigateToStore.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

// Custom marker icons
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function NavigateToStore() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [storeLocation, setStoreLocation] = useState<{lat: number, lng: number} | null>(null);
  const [storeName, setStoreName] = useState('');
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    initializeNavigation();
  }, [productId]);
  
  const initializeNavigation = async () => {
    try {
      // Get user location
      const position = await getUserLocation();
      setUserLocation(position);
      
      // Get product and store details
      const { data: product } = await supabase
        .from('products')
        .select('*, sellers(*)')
        .eq('id', productId)
        .single();
      
      if (product && product.sellers) {
        const storeLoc = {
          lat: product.sellers.location.lat,
          lng: product.sellers.location.lng
        };
        setStoreLocation(storeLoc);
        setStoreName(product.sellers.shop_name);
        
        // Get route
        const routeData = await getWalkingRoute(position, storeLoc);
        setRoute(routeData);
      }
    } catch (error) {
      console.error('Navigation initialization error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const openInMaps = () => {
    if (!storeLocation) return;
    
    // Open in Google Maps or Apple Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${storeLocation.lat},${storeLocation.lng}&travelmode=walking`;
    window.open(url, '_blank');
  };
  
  if (loading || !userLocation || !storeLocation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  
  const center: [number, number] = [
    (userLocation.lat + storeLocation.lat) / 2,
    (userLocation.lng + storeLocation.lng) / 2
  ];
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold">{storeName}</h1>
          {route && (
            <p className="text-sm text-muted-foreground">
              {(route.distance / 1000).toFixed(1)} km • {Math.round(route.duration / 60)} min walk
            </p>
          )}
        </div>
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User Location */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>{t('yourLocation')}</Popup>
          </Marker>
          
          {/* Store Location */}
          <Marker position={[storeLocation.lat, storeLocation.lng]} icon={storeIcon}>
            <Popup>{storeName}</Popup>
          </Marker>
          
          {/* Route */}
          {route && route.coordinates && (
            <Polyline
              positions={route.coordinates}
              color="#4285F4"
              weight={5}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Bottom Actions */}
      <div className="bg-card border-t p-4 space-y-3">
        {route && route.steps && route.steps.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-2">
            {route.steps.slice(0, 3).map((step: any, i: number) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{i + 1}.</span> {step.instruction}
                {step.distance > 0 && (
                  <span className="text-muted-foreground ml-2">
                    ({step.distance}m)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        <Button onClick={openInMaps} className="w-full" size="lg">
          <ExternalLink className="mr-2 h-5 w-5" />
          {t('openInMaps')}
        </Button>
      </div>
    </div>
  );
}
```

---

## 🔄 User Behavior Tracking

### Track Interactions

```typescript
// lib/analytics.ts
import { supabase } from './supabase';

export const trackCategoryInteraction = async (
  userId: string,
  categoryId: string,
  type: 'view' | 'click' | 'purchase'
) => {
  try {
    await supabase.rpc('increment_category_interaction', {
      p_user_id: userId,
      p_category_id: categoryId,
      p_interaction_type: type
    });
  } catch (error) {
    console.error('Failed to track interaction:', error);
  }
};

// Usage examples:
// When user views a product
trackCategoryInteraction(userId, product.category_id, 'view');

// When user clicks on a product
trackCategoryInteraction(userId, product.category_id, 'click');

// When user purchases a product
trackCategoryInteraction(userId, product.category_id, 'purchase');
```

---

## 🔐 Privacy & Permissions

### Location Permission Flow

```typescript
// components/LocationPermissionDialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export function LocationPermissionDialog({ onAllow, onDeny }: any) {
  const [open, setOpen] = useState(true);
  
  const handleAllow = () => {
    setOpen(false);
    onAllow();
  };
  
  const handleDeny = () => {
    setOpen(false);
    onDeny();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Enable Location Services</DialogTitle>
          <DialogDescription className="text-center">
            We need your location to show nearby stores and help you navigate to them.
            Your location is never shared with sellers without your permission.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleAllow} className="w-full">
            Allow Location Access
          </Button>
          <Button onClick={handleDeny} variant="outline" className="w-full">
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📱 Responsive Design

### Mobile-First Approach

```css
/* Optimized for mobile devices */
.nearby-products-slider {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.product-card {
  scroll-snap-align: start;
  min-width: 16rem; /* 256px */
}

/* Map container */
.navigation-map {
  height: calc(100vh - 200px);
  touch-action: pan-x pan-y;
}

/* Bottom sheet */
.route-details {
  max-height: 40vh;
  overflow-y: auto;
}
```

---

## 🚀 Implementation Roadmap

### Week 1: Foundation & Database
- [x] Create technical specification document
- [ ] Database schema migration
- [ ] RPC functions (nearby products, favorite categories)
- [ ] Behavior tracking integration
- [ ] Test geospatial queries

### Week 2: UI Components
- [ ] Location permission dialog
- [ ] Nearby Products section component
- [ ] Category tabs with favorites
- [ ] Product cards with distance badges
- [ ] Loading and error states

### Week 3: Navigation & Mapping
- [ ] Navigation page layout
- [ ] Leaflet map integration
- [ ] Custom marker icons
- [ ] OSRM routing integration
- [ ] Polyline route rendering
- [ ] Turn-by-turn directions display

### Week 4: Polish & Testing
- [ ] Error handling and fallbacks
- [ ] Offline support (cached locations)
- [ ] Performance optimization
- [ ] Analytics tracking
- [ ] User acceptance testing
- [ ] Localization (Arabic/English)

---

## 📊 Success Metrics

1. **Adoption Rate**: % of users who enable location services
2. **Engagement**: Products viewed via nearby section
3. **Navigation Usage**: % of users who use navigation feature
4. **Conversion**: Purchases from nearby products
5. **Distance**: Average distance users willing to travel
6. **Completion**: Store visits (if trackable via follow-up)

---

## ⚠️ Technical Considerations

### Performance
- Cache user location (5-minute TTL)
- Debounce location updates
- Lazy load product images
- Pagination for large result sets

### Reliability
- Fallback to straight-line if routing fails
- Graceful degradation without location
- Handle GPS inaccuracy
- Offline mode with cached data

### Privacy
- Clear permission explanations
- Never share location without consent
- Allow location disable anytime
- Comply with privacy regulations

### Scalability
- Index geospatial queries
- CDN for map tiles
- Rate limit API calls
- Monitor routing API usage

---

## 🎯 Future Enhancements

1. **Real-time Navigation** - Live position updates during walk
2. **Alternative Routes** - Show multiple route options
3. **Store Hours** - Don't show closed stores
4. **Delivery Toggle** - Filter by delivery availability
5. **AR Navigation** - Augmented reality directions
6. **Social Features** - Share routes with friends
7. **Rewards** - Points for visiting stores
8. **Voice Guidance** - Turn-by-turn voice instructions

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-20  
**Status**: Ready for Implementation
