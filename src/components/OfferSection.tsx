import { Product, OfferType, offerCategories } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimatedEmoji } from "./AnimatedEmoji";

interface OfferSectionProps {
  offerType: string;
  products: Product[];
  category?: any;
  maxItems?: number;
}

export const OfferSection = ({ offerType, products, category, maxItems = 3 }: OfferSectionProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  if (!offerType) return null;
  
  // Use passed category or fallback to mocked data only if necessary
  const offerCategory = category || offerCategories.find(o => o.id === offerType);
  if (!offerCategory) return null;
  
  // Adjusted filter: prioritize offerType, and handle cases where products might not have expiry set yet
  const filteredProducts = products
    .filter(p => {
      // Handle "Under 5000" special case
      if (offerType === 'under5000') {
        return (p as any).price < 5000;
      }

      const offers = (p as any).offers || [];
      return offers.some((offer: any) => {
        // Map server "flash-sale" to local "flash"
        const normalizedOfferType = offer.offer_category_id === 'flash-sale' ? 'flash' : offer.offer_category_id;
        
        if (normalizedOfferType !== offerType) return false;
        
        // If there's an expiry date, check it. Otherwise, assume it's active.
        if (offer.expiry_date) {
          return new Date(offer.expiry_date) > new Date();
        }
        return true;
      });
    })
    .slice(0, maxItems);
  
  if (filteredProducts.length === 0) return null;
  
  return (
    <motion.section 
      className="mb-10 last:mb-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center bg-primary/5 border border-primary/10 rounded-2xl shadow-inner overflow-hidden">
            <AnimatedEmoji emoji={offerCategory.emoji} size={40} />
          </div>
          <div className="flex flex-col flex-1 gap-0.5">
            <h2 className="text-lg font-black tracking-tight leading-tight">
              {isArabic ? offerCategory.nameAr : offerCategory.name}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-muted-foreground font-medium line-clamp-1">
                {isArabic ? offerCategory.descriptionAr : offerCategory.description}
              </p>
              <Link 
                to={`/search?offer=${offerType}`} 
                className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold text-primary hover:underline"
              >
                <span>{isArabic ? 'عرض المزيد' : 'View More'}</span>
                <ChevronRight className={`w-2.5 h-2.5 ${isArabic ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Horizontal Scrollable Products */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4">
        {filteredProducts.map((product) => (
          <div 
            key={product.id} 
            className="flex-shrink-0 w-[240px]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </motion.section>
  );
};
