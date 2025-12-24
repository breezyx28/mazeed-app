import { Product } from "@/data/products";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Check } from "lucide-react";
import { ProductBadge } from "./ProductBadge";
import { WishlistButton } from "./WishlistButton";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AnalyticsService } from "@/services/AnalyticsService";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const isArabic = i18n.language === 'ar';
  
  // Check if product is already in cart
  const isInCart = cartItems.some(item => item.product_id === product.id);

  const handleClick = () => {
    const catId = (product as any).category_id || (product as any).categoryId;
    if (user && catId) {
      AnalyticsService.trackCategoryInteraction(user.id, catId, 'click');
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };


    return (
      <div
        className="h-full"
      >
        <Link to={`/product/${product.id}`} className="group block h-full" onClick={handleClick}>
          <div className="bg-card h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 flex flex-col">
            {/* Image Container */}
            <div className="relative aspect-[1/1.2] bg-muted overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              
              {/* Glassmorphism Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 z-20">
                <WishlistButton 
                  productId={product.id} 
                  size="sm" 
                  className="bg-white/80 backdrop-blur-xl shadow-lg border-none hover:bg-white scale-90 group-hover:scale-100 transition-all duration-300" 
                />
              </div>
              
              {/* Status Badges Overlay (Top-Left) */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
                {product.discount && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-2xl text-[10px] font-black shadow-[0_4px_12px_rgba(239,68,68,0.3)] flex items-center gap-1"
                  >
                    <span>🔥</span>
                    <span>{product.discount}% {isArabic ? "خصم" : "OFF"}</span>
                  </motion.div>
                )}
                
                {product.is_deliverable === false && (
                  <div className="bg-amber-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl text-[9px] font-black shadow-md flex items-center gap-1 border border-white/20 whitespace-nowrap">
                    <span className="text-[11px]">📍</span>
                    <span className="uppercase tracking-tight">{isArabic ? "استلام من المتجر" : "Store Pickup"}</span>
                  </div>
                )}
              </div>

              {/* Tags Overlay (Bottom) - Always visible now for better UX */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 z-10">
                {product.badges?.slice(0, 1).map((badge) => (
                  <ProductBadge 
                    key={badge} 
                    type={badge} 
                    className="backdrop-blur-xl bg-white/70 dark:bg-black/60 border-none px-3 font-black text-[9px] uppercase tracking-wider shadow-sm"
                  />
                ))}
              </div>
            </div>
          
            {/* Content Container */}
            <div className="p-4 sm:p-5 flex flex-col flex-1">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                    <span className="text-yellow-500 text-[10px]">★</span>
                    <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-500">{product.rating}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-bold opacity-60">
                    {product.reviews} {isArabic ? "تقييم" : "REVIEWS"}
                  </span>
                </div>
                
                <h3 className="font-black text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                  {product.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/30">
                <div className="w-full flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                    {isArabic ? "السعر" : "Price"}
                  </span>
                  <div className="w-full flex gap-2">
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-black text-lg text-primary tracking-tight leading-none">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[11px] text-muted-foreground line-through opacity-40 font-bold decoration-red-500/30">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>

                      <div className="w-full flex-1">
                      <button 
                      className="w-full h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 group/btn shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (isAddingToCart || isInCart) return;
                        
                        setIsAddingToCart(true);
                        try {
                          await addToCart(product.id);
                        } finally {
                          setIsAddingToCart(false);
                        }
                      }}
                      disabled={isAddingToCart || isInCart}
                    >
                      {isInCart ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90" />
                      )}
                    </button>

                      </div>
                </div>
                
               
                  </div>
          
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };
