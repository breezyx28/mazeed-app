import { Product } from "@/data/products";
import { Link } from "react-router-dom";
import { ProductBadge } from "./ProductBadge";
import { WishlistButton } from "./WishlistButton";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { t } = useTranslation();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/product/${product.id}`} className="group block">
        <div className="bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50">
          <div className="relative aspect-[4/5] bg-muted overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Action Buttons */}
            <div className="absolute top-3 right-3 z-10">
              <WishlistButton 
                productId={product.id} 
                size="sm" 
                className="bg-white/90 backdrop-blur-md shadow-md hover:bg-white scale-90 group-hover:scale-100 transition-transform" 
              />
            </div>
            
            {/* Discount Badge */}
            {product.discount && (
              <div className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-1 rounded-xl text-[11px] font-black shadow-lg">
                {product.discount}%
              </div>
            )}

            {/* Tags Overlay (Bottom) */}
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 max-w-[80%] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {product.badges?.slice(0, 1).map((badge) => (
                <ProductBadge key={badge} type={badge} className="shadow-sm backdrop-blur-md bg-white/70 border-none scale-75 origin-left" />
              ))}
            </div>
          </div>
          
          <div className="p-4">
            {/* Primary Tags */}
            <div className="flex flex-wrap gap-1 mb-2 min-h-[22px]">
              {product.badges?.slice(0, 2).map((badge) => (
                <ProductBadge key={badge} type={badge} className="scale-90 origin-left" />
              ))}
            </div>
            
            <h3 className="font-bold text-sm mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-lg">
                <span className="text-yellow-500 text-[10px]">★</span>
                <span className="text-xs font-bold text-yellow-700">{product.rating}</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                ({product.reviews})
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="font-black text-lg text-primary tracking-tight">
                  {formatPrice(product.price)}
                </span>
              </div>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-muted-foreground line-through opacity-60 font-medium">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
