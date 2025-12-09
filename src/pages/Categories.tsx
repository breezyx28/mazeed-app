import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { categories } from "@/data/products";
import { motion } from "framer-motion";

const Categories = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to search page with category filter
    navigate(`/search?category=${categoryId}`);
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
            <h1 className="text-2xl font-bold">{t('categories')}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Categories Grid */}
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
                {/* Emoji Icon */}
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                  {category.emoji}
                </div>
                
                {/* Category Name */}
                <h3 className="text-sm font-semibold text-center">
                  {isArabic ? category.nameAr : category.name}
                </h3>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
