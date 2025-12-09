import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { categories, offerCategories, products } from "@/data/products";
import { motion } from "framer-motion";
import { useState } from "react";

const Categories = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<'categories' | 'offers'>('categories');

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to search page with category filter
    navigate(`/search?category=${categoryId}`);
  };

  const handleOfferClick = (offerId: string) => {
    navigate(`/search?offer=${offerId}`);
  };

  // Get active offers (not expired)
  const activeOffers = offerCategories.filter(offer => {
    const offerProducts = products.filter(
      p => p.offerType === offer.id && 
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
            {categories.filter(cat => cat.id !== 'all').map((category, index) => (
              <motion.button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary transition-all duration-300 hover:shadow-md group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {category.emoji}
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
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                      {offer.emoji}
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
