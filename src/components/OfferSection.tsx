import { Product, OfferType, offerCategories } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface OfferSectionProps {
  offerType: OfferType;
  products: Product[];
  maxItems?: number;
}

export const OfferSection = ({ offerType, products, maxItems = 6 }: OfferSectionProps) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  if (!offerType) return null;
  
  const offerCategory = offerCategories.find(o => o.id === offerType);
  if (!offerCategory) return null;
  
  const filteredProducts = products
    .filter(p => p.offerType === offerType && p.offerExpiry && new Date(p.offerExpiry) > new Date())
    .slice(0, maxItems);
  
  if (filteredProducts.length === 0) return null;
  
  return (
    <motion.section 
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{offerCategory.emoji}</span>
          <div>
            <h2 className="text-xl font-bold">
              {isArabic ? offerCategory.nameAr : offerCategory.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isArabic ? offerCategory.descriptionAr : offerCategory.description}
            </p>
          </div>
        </div>
        <Link 
          to="/offers" 
          className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
        >
          <span>{isArabic ? 'المزيد' : 'More'}</span>
          <ChevronRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
        </Link>
      </div>
      
      {/* Horizontal Scrollable Products */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {filteredProducts.map((product) => (
          <motion.div 
            key={product.id} 
            className="flex-shrink-0 w-48"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
