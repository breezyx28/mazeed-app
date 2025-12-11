import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const WishlistButton = ({ productId, className, size = "md" }: WishlistButtonProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(productId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    await toggleWishlist(productId);
    
    if (isFavorite) {
      toast.success("تم إزالته من المفضلة");
    } else {
      toast.success("تم إضافته للمفضلة");
    }
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "p-2 hover:bg-accent rounded-full transition-colors",
        className
      )}
    >
      <Heart 
        className={cn(
          sizeClasses[size],
          isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )} 
      />
    </button>
  );
};