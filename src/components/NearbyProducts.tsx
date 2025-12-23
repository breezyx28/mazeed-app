import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, ArrowRight, Map as MapIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { locationService, Location } from '@/services/locationService';
import { LocationPermissionDialog } from './LocationPermissionDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnimatedEmoji } from './AnimatedEmoji';

interface NearbyProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  distance_km: number;
  shop_name: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  name_ar: string;
  emoji: string;
}

export const NearbyProducts: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [location, setLocation] = useState<Location | null>(null);
  const [showPermission, setShowPermission] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<NearbyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);

  // 1. Initial Load: Check for cached location and fetch categories
  useEffect(() => {
    const init = async () => {
      // Fetch categories first
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData) setCategories(catData);

      // Check cache
      try {
        const cached = await locationService.getCurrentLocation();
        setLocation(cached);
      } catch (err) {
        // If no cache or error, we'll ask when they interact
      }
    };
    init();
  }, []);

  // 2. Fetch products when location or category changes
  useEffect(() => {
    if (!location) return;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const rpcName = selectedCategory === 'all' ? 'get_all_nearby_products' : 'get_nearby_products';
        const rpcParams = {
          p_user_lat: location.lat,
          p_user_lng: location.lng,
          p_radius_km: 10, // 10km radius
          p_limit: 15
        };

        if (selectedCategory !== 'all') {
          (rpcParams as any).p_category_id = selectedCategory;
        }

        const { data, error: rpcError } = await supabase.rpc(rpcName, rpcParams);

        if (rpcError) throw rpcError;
        setProducts(data || []);
      } catch (err: any) {
        console.error('Fetch Nearby Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [location, selectedCategory]);

  const handleRequestLocation = async () => {
    setShowPermission(false);
    try {
      setLoading(true);
      const pos = await locationService.getCurrentLocation();
      setLocation(pos);
    } catch (err) {
      setError('Location access denied');
    } finally {
      setLoading(false);
    }
  };

  if (!location && !loading && !showPermission) {
    return (
      <div className="py-6 px-1">
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-6 border border-primary/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="text-primary w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t('nearbyProducts.discoverTitle', 'Discover Nearby')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('nearbyProducts.discoverDesc', 'See what products are available in stores around you right now.')}
              </p>
            </div>
            <Button onClick={() => setShowPermission(true)} className="rounded-full px-8 shadow-md hover:shadow-lg transition-all">
              {t('nearbyProducts.enableButton', 'Enable Location')}
            </Button>
          </div>
        </div>
        <LocationPermissionDialog 
          open={showPermission} 
          onOpenChange={setShowPermission} 
          onConfirm={handleRequestLocation} 
        />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Navigation className="text-white w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">{t('nearbyProducts.title', 'Nearby You')}</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-primary gap-1" onClick={() => navigate('/nearby-map')}>
          {t('common.viewAll', 'View All')}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Categories Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          className="rounded-full whitespace-nowrap"
          onClick={() => setSelectedCategory('all')}
        >
          {t('common.all', 'All')}
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            className="rounded-full whitespace-nowrap gap-1.5"
            onClick={() => setSelectedCategory(cat.id)}
            onMouseEnter={() => setHoveredCatId(cat.id)}
            onMouseLeave={() => setHoveredCatId(null)}
          >
            <AnimatedEmoji emoji={cat.emoji} size={20} hovered={hoveredCatId === cat.id} />
            {i18n.language === 'ar' ? cat.name_ar : cat.name}
          </Button>
        ))}
      </div>

      {/* Products Slider */}
      <div className="relative min-h-[220px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('common.searching', 'Searching nearby...')}</p>
          </div>
        ) : products.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex-shrink-0 w-64 bg-card rounded-2xl border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all active:scale-95"
                >
                  <div className="relative aspect-square">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <Badge className="absolute top-2 left-2 bg-black/60 backdrop-blur-md border-none gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-secondary" />
                      {locationService.formatDistance(product.distance_km * 1000)}
                    </Badge>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium truncate">{product.shop_name}</p>
                    <h4 className="font-bold text-sm line-clamp-1">{product.name}</h4>
                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="font-bold text-primary">{product.price.toLocaleString()} {t('currency', 'SDG')}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/navigate/${product.id}`, { state: { product } });
                        }}
                        className="bg-primary/10 p-1.5 rounded-lg text-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6 gap-3 bg-muted/30 rounded-3xl border border-dashed">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <MapIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{t('nearbyProducts.noResults', 'No stores nearby')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('nearbyProducts.noResultsDesc', 'Try expanding your search or checking another category.')}
              </p>
            </div>
          </div>
        )}
      </div>

      <LocationPermissionDialog 
        open={showPermission} 
        onOpenChange={setShowPermission} 
        onConfirm={handleRequestLocation} 
      />
    </div>
  );
};
