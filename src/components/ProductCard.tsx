import { Heart } from "lucide-react";
import { Product } from "@/data/products";
import { Link } from "react-router-dom";
import { ProductBadge } from "./ProductBadge";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link to={`/product/${product.id}`}>
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-muted">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
            <Heart className="w-4 h-4" />
          </button>
          {product.discount && (
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              -{product.discount}%
            </div>
          )}
        </div>
        <div className="p-3">
          {/* Badges */}
          {product.badges && product.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.badges.slice(0, 2).map((badge) => (
                <ProductBadge key={badge} type={badge} />
              ))}
            </div>
          )}
          
          <h3 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              <span className="text-yellow-500 text-xs">★</span>
              <span className="text-xs text-muted-foreground ml-1">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
