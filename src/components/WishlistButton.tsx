import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion } from "framer-motion";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const WishlistButton = ({ productId, className, size = "md" }: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);
  
  // Use optimistic state if available, otherwise use actual state
  const isFavorite = optimisticFavorite !== null ? optimisticFavorite : isInWishlist(productId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    const wasInWishlist = isInWishlist(productId);
    
    // Optimistic update - immediately toggle the UI
    setOptimisticFavorite(!wasInWishlist);
    
    try {
      await toggleWishlist(productId);
      
      // Clear optimistic state after successful API call
      setOptimisticFavorite(null);
      
      if (wasInWishlist) {
        toast.success(t("removedFromWishlist"));
      } else {
        toast.success(t("addedToWishlist"));
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticFavorite(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "p-2 hover:bg-accent rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
    >
      <motion.div
        animate={{
          scale: isFavorite ? [1, 1.3, 1] : 1,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut"
        }}
      >
        <Heart 
          className={cn(
            sizeClasses[size],
            isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
          )} 
        />
      </motion.div>
    </motion.button>
  );
};