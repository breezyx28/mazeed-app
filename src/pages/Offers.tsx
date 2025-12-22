import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { offerCategories, products } from "@/data/products";
import { motion } from "framer-motion";
import { useState } from "react";
import { AnimatedEmoji } from "@/components/AnimatedEmoji";

const Offers = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Get active offers (not expired)
  const activeOffers = offerCategories.filter(offer => {
    const offerProducts = products.filter(
      p => p.offerType === offer.id && 
      p.offerExpiry && 
      new Date(p.offerExpiry) > new Date()
    );
    return offerProducts.length > 0;
  });

  const handleOfferClick = (offerId: string) => {
    setSelectedOffer(offerId);
    // You can navigate to a filtered view or show products inline
    navigate(`/search?offer=${offerId}`);
  };

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
            <div>
              <h1 className="text-2xl font-bold">{t('offers')}</h1>
              <p className="text-xs text-muted-foreground">
                {activeOffers.length} {isArabic ? 'عرض نشط' : 'Active Offers'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Offers Grid */}
        <div className="grid grid-cols-2 gap-3">
          {activeOffers.map((offer, index) => {
            const offerProductCount = products.filter(
              p => p.offerType === offer.id && 
              p.offerExpiry && 
              new Date(p.offerExpiry) > new Date()
            ).length;

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
                {/* Product Count Badge */}
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {offerProductCount}
                </div>

                <div className="flex flex-col items-center gap-3">
                  {/* Emoji Icon */}
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    <AnimatedEmoji 
                      emoji={offer.emoji} 
                      size={64} 
                      hovered={hoveredId === offer.id}
                    />
                  </div>
                  
                  {/* Offer Name */}
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

        {/* Empty State */}
        {activeOffers.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <AnimatedEmoji emoji="🎁" size={64} />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isArabic ? 'لا توجد عروض نشطة' : 'No Active Offers'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isArabic ? 'تحقق مرة أخرى قريبًا للحصول على صفقات رائعة!' : 'Check back soon for amazing deals!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
