import { Heart, Search, ShoppingCart, Bell } from "lucide-react";
import { products, offerCategories } from "@/data/products";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { OfferSection } from "@/components/OfferSection";
import { useNotifications } from "@/context/NotificationContext";

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();

  // Get active offer types that have products
  const activeOfferTypes = offerCategories
    .map(offer => offer.id)
    .filter(offerType => {
      const offerProducts = products.filter(
        p => p.offerType === offerType && 
        p.offerExpiry && 
        new Date(p.offerExpiry) > new Date()
      );
      return offerProducts.length > 0;
    });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card sticky top-0 z-40 border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{t('hello')}</h1>
              <p className="text-sm text-muted-foreground">{t('welcomeBack')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/notifications")} 
                className="p-2 hover:bg-accent rounded-full transition-colors relative"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button className="p-2 hover:bg-accent rounded-full transition-colors">
                <Heart className="w-6 h-6" />
              </button>
              <button onClick={() => navigate("/cart")} className="p-2 hover:bg-accent rounded-full transition-colors relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <button
            onClick={() => navigate("/search")}
            className="w-full h-12 bg-muted rounded-full flex items-center px-4 gap-3 hover:bg-accent transition-colors"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">{t('searchProducts')}</span>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4">
        {/* Ads Slider */}
        <div className="py-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {[
              'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=200&fit=crop',
              'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=200&fit=crop',
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=200&fit=crop'
            ].map((image, index) => (
              <motion.div 
                key={index} 
                className="flex-shrink-0 w-80 h-32 rounded-2xl overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <img src={image} alt={`عرض ${index + 1}`} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dynamic Offer Sections */}
        {activeOfferTypes.map((offerType) => (
          <OfferSection
            key={offerType}
            offerType={offerType}
            products={products}
            maxItems={6}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
