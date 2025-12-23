import { Heart, Search, ShoppingCart, Bell } from "lucide-react";
import { OfferType } from "@/data/products";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { OfferSection } from "@/components/OfferSection";
import { useNotifications } from "@/context/NotificationContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { NearbyProducts } from "@/components/NearbyProducts";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { AnimatedEmoji } from "@/components/AnimatedEmoji";

const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { unreadCount } = useNotifications();
  const { cartItems } = useCart();
  const { user } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_offers(offer_category_id, expiry_date)')
        .eq('status', 'published');
      
      if (error) {
        console.error(error);
        return [];
      }
      
      return (data || []).map((p: any) => ({
        ...p,
        offers: p.product_offers || [],
        originalPrice: p.original_price,
        reviews: p.reviews_count || 0,
        sellerId: p.seller_id,
        images: p.images || [p.image]
      }));
    }
  });

  const { data: offerCategories = [] } = useQuery({
    queryKey: ['offer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_categories')
        .select('*');
      
      if (error) {
        console.error(error);
        return [];
      }
      
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        nameAr: c.name_ar,
        emoji: c.emoji,
        description: c.description,
        descriptionAr: c.description_ar
      }));
    }
  });

  const displayProducts = products.filter((p: any) => !user || p.sellerId !== user.id);

  // Get active offer types that have products
  const activeOfferTypes = offerCategories
    .map(offer => offer.id)
    .filter(offerType => {
      const offerProducts = displayProducts.filter(p => {
        // Handle "Under 5000" special case
        if (offerType === 'under5000') {
          return p.price < 5000;
        }

        // Check if any of the product's offers match this type
        return p.offers.some((offer: any) => {
          // Map server "flash-sale" to local "flash"
          const normalizedOfferType = offer.offer_category_id === 'flash-sale' ? 'flash' : offer.offer_category_id;
          
          if (normalizedOfferType !== offerType) return false;

          // If expiry exists, check it. If null, assume it's still active.
          if (offer.expiry_date) {
            return new Date(offer.expiry_date) > new Date();
          }
          return true;
        });
      });
      return offerProducts.length > 0;
    });

    console.log('displayProducts: ',displayProducts);
    

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Premium Header */}
      <header className="bg-card/70 backdrop-blur-xl sticky top-0 z-50 border-b border-border/40">
        <div className="max-w-md mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-0.5">
                {t('welcomeBack')}
              </span>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                {t('hello')} <AnimatedEmoji emoji="👋" size={32} className="animate-bounce-slow" />
              </h1>
            </div>
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => navigate("/notifications")} 
                className="w-10 h-10 bg-accent/50 hover:bg-accent rounded-full transition-all flex items-center justify-center relative border border-border/20"
              >
                <Bell className="w-5 h-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-black border-2 border-card shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => navigate("/wishlist")} 
                className="w-10 h-10 bg-accent/50 hover:bg-accent rounded-full transition-all flex items-center justify-center border border-border/20"
              >
                <Heart className="w-5 h-5 text-foreground" />
              </button>
              <button 
                onClick={() => navigate("/cart")} 
                className="w-10 h-10 bg-primary hover:bg-primary/90 rounded-full transition-all flex items-center justify-center relative shadow-lg shadow-primary/20 border border-primary/20"
              >
                <ShoppingCart className="w-5 h-5 text-primary-foreground" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-primary rounded-full text-[10px] flex items-center justify-center font-black border-2 border-primary shadow-sm animate-in zoom-in duration-300">
                    {cartItems.length > 9 ? '9+' : cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar - More Premium */}
          <button
            onClick={() => navigate("/search")}
            className="w-full h-12 bg-accent/50 border border-border/30 rounded-2xl flex items-center px-4 gap-3 hover:bg-accent hover:border-primary/20 transition-all shadow-inner group"
          >
            <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-muted-foreground font-medium text-sm">{t('searchProducts')}</span>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-5">
        {/* Ads Slider - More Premium */}
        <div className="py-6">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x mask-fade-right">
            {[
              {
                url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop',
                title: 'Summer Sale',
                subtitle: 'Up to 50% Off'
              },
              {
                url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
                title: 'New Collection',
                subtitle: 'Fresh Trends'
              },
              {
                url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
                title: 'Exclusive Deals',
                subtitle: 'Shop Now'
              }
            ].map((ad, index) => (
              <motion.div 
                key={index} 
                className="flex-shrink-0 w-[320px] h-40 rounded-[2.5rem] overflow-hidden relative group snap-center shadow-xl shadow-black/5"
                whileHover={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <img src={ad.url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent p-6 flex flex-col justify-end">
                  <h3 className="text-white font-black text-xl leading-tight">{ad.title}</h3>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">{ad.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Nearby Products Section - New Feature Integrated */}
        <section className="mt-4 mb-10">
          <NearbyProducts />
        </section>

        {/* Dynamic Offer Sections (Sliders) - Grouped by user request */}
        {isLoading ? (
          <div className="space-y-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-muted rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-5 bg-muted rounded-md"></div>
                    <div className="w-48 h-3 bg-muted rounded-md opacity-50"></div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-44 h-64 bg-muted rounded-3xl"></div>
                  <div className="w-44 h-64 bg-muted rounded-3xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeOfferTypes.map((offerType) => {
              const category = offerCategories.find(c => c.id === offerType);
              return (
                <OfferSection
                  key={offerType}
                  offerType={offerType}
                  products={displayProducts}
                  category={category}
                />
              );
            })}
          </>
        )}

        {/* Fallback Grid if no specific offers found */}
        {!isLoading && activeOfferTypes.length === 0 && (
          <div className="py-12 mt-4">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-xl font-black tracking-tight">{t('popularProducts')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {displayProducts.map((p) => (
                 <ProductCard 
                    key={p.id}
                    product={p as any} 
                 />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
