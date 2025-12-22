import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AnalyticsService } from "@/services/AnalyticsService";
import { AnimatedEmoji } from "@/components/AnimatedEmoji";

const Categories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'categories' | 'offers'>('categories');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    // Record interaction
    if (user) {
      AnalyticsService.trackCategoryInteraction(user.id, categoryId, 'click');
    }
    // Navigate to search page with category filter
    navigate(`/search?category=${categoryId}`);
  };

  const handleOfferClick = (offerId: string) => {
    navigate(`/search?offer=${offerId}`);
  };

  // Fetch categories from database
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) {
        console.error(error);
        return [];
      }
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        nameAr: c.name_ar,
        emoji: c.emoji
      }));
    }
  });

  // Fetch offer categories from database
  const { data: dbOffers = [] } = useQuery({
    queryKey: ['offer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offer_categories').select('*');
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

  // Fetch products to count offers
  const { data: products = [] } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_offers(offer_category_id, expiry_date)')
        .eq('status', 'published');
      if (error) return [];
      return (data || []).map((p: any) => ({
        ...p,
        offers: p.product_offers || []
      }));
    }
  });

  const activeOffers = dbOffers.filter(offer => {
    const offerProducts = products.filter(p => {
      if (offer.id === 'under5000') return p.price < 5000;
      
      return p.offers.some((pOffer: any) => {
        const normalizedOfferType = pOffer.offer_category_id === 'flash-sale' ? 'flash' : pOffer.offer_category_id;
        if (normalizedOfferType !== offer.id) return false;
        if (pOffer.expiry_date) return new Date(pOffer.expiry_date) > new Date();
        return true;
      });
    });
    return offerProducts.length > 0;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card sticky top-0 z-40 border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ArrowLeft className={`w-6 h-6 ${isArabic ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-2xl font-bold">{activeTab === 'categories' ? t('categories') : t('offers')}</h1>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-md mx-auto px-4 pb-4">
          <div className="flex gap-2 bg-accent/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('categories')}
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === 'offers'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('offers')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Categories Tab Content */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-2 gap-3">
            {dbCategories.map((category: any, index: number) => (
              <motion.button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                onMouseEnter={() => setHoveredId(category.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary transition-all duration-300 hover:shadow-md group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    <AnimatedEmoji 
                      emoji={category.emoji} 
                      size={64} 
                      hovered={hoveredId === category.id} 
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-center">
                    {isArabic ? category.nameAr : category.name}
                  </h3>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Offers Tab Content */}
        {activeTab === 'offers' && (
          <div className="grid grid-cols-2 gap-3">
            {activeOffers.map((offer: any, index: number) => {
              const offerProductCount = products.filter(p => {
                if (offer.id === 'under5000') return p.price < 5000;
                
                return p.offers.some((pOffer: any) => {
                  const normalizedOfferType = pOffer.offer_category_id === 'flash-sale' ? 'flash' : pOffer.offer_category_id;
                  if (normalizedOfferType !== offer.id) return false;
                  if (pOffer.expiry_date) return new Date(pOffer.expiry_date) > new Date();
                  return true;
                });
              }).length;

              return (
                <motion.button
                  key={offer.id}
                  onClick={() => handleOfferClick(offer.id as string)}
                  onMouseEnter={() => setHoveredId(offer.id as string)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="bg-card rounded-2xl p-6 border border-border hover:border-primary transition-all duration-300 hover:shadow-md group relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {offerProductCount}
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      <AnimatedEmoji 
                        emoji={offer.emoji} 
                        size={64} 
                        hovered={hoveredId === offer.id}
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-semibold mb-1">
                        {isArabic ? offer.nameAr : offer.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {isArabic ? offer.descriptionAr : offer.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
