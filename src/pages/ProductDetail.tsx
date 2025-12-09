import { useParams, useNavigate } from "react-router-dom";
import { products } from "@/data/products";
import { ArrowLeft, Heart, ShoppingCart, Star, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ProductBadge } from "@/components/ProductBadge";
import { CapacitorUtils } from "@/lib/capacitor-utils";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const product = products.find(p => p.id === id);
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isCtaCollapsed, setIsCtaCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const productImages = product.images || [product.image];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsCtaCollapsed(true);
      } else if (currentScrollY < lastScrollY) {
        setIsCtaCollapsed(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    setIsAdded(true);
    toast.success(`${product.name} تم إضافته للسلة`);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    toast.success('جاري التوجه للدفع...');
    navigate('/cart');
  };

  const handleShare = async () => {
    const result = await CapacitorUtils.share({
      title: product.name,
      text: `${product.description || 'منتج رائع'} - بسعر ${formatPrice(product.price)}`,
      url: window.location.href,
      dialogTitle: 'Share Product'
    });

    if (result === 'copied') {
      toast.success('تم نسخ الرابط');
    }
  };

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">{t('productDetails')}</h1>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-accent rounded-full transition-colors">
              <Heart className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto">
        {/* Product Image Gallery */}
        <div className="relative">
          <div className="relative aspect-square bg-muted">
            <motion.img 
              key={selectedImageIndex}
              src={productImages[selectedImageIndex]} 
              alt={product.name}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            {product.discount && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                -{product.discount}% OFF
              </div>
            )}
          </div>
          
          {/* Image Thumbnails */}
          {productImages.length > 1 && (
            <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {productImages.map((img, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index 
                      ? 'border-primary scale-105' 
                      : 'border-border opacity-60 hover:opacity-100'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 mt-6 pb-40">
          {/* Product Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">({product.reviews} reviews)</span>
              </div>
              
              {/* Product Badges */}
              {product.badges && product.badges.length > 0 && (
                <motion.div 
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {product.badges.map((badge) => (
                    <ProductBadge key={badge} type={badge} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">{t('description')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {product.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
            </p>
          </div>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">{t('color')}</h3>
              <div className="flex gap-3">
                {product.colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(index)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === index 
                        ? 'border-primary scale-110' 
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">{t('quantity')}</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-muted hover:bg-accent flex items-center justify-center font-semibold transition-colors"
              >
                -
              </button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-muted hover:bg-accent flex items-center justify-center font-semibold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Rating & Reviews Section */}
          <div className="mb-6 bg-card rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-lg mb-4">التقييمات والمراجعات</h3>
            
            {/* Overall Rating */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{product.rating}</div>
                <div className="flex items-center justify-center mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">{product.reviews} تقييم</div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const percentage = stars === 5 ? 65 : stars === 4 ? 25 : stars === 3 ? 8 : stars === 2 ? 2 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs w-3">{stars}</span>
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-yellow-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  name: "أحمد محمد",
                  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed",
                  rating: 5,
                  date: "منذ أسبوعين",
                  comment: "منتج ممتاز جداً! الجودة عالية والسعر مناسب. أنصح بالشراء بشدة.",
                  helpful: 12
                },
                {
                  id: 2,
                  name: "فاطمة علي",
                  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima",
                  rating: 4,
                  date: "منذ شهر",
                  comment: "جيد جداً ولكن التوصيل استغرق وقتاً أطول من المتوقع. المنتج نفسه رائع.",
                  helpful: 8
                },
                {
                  id: 3,
                  name: "محمود حسن",
                  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mahmoud",
                  rating: 5,
                  date: "منذ شهرين",
                  comment: "تجربة شراء ممتازة. المنتج كما في الوصف تماماً. شكراً لكم!",
                  helpful: 15
                }
              ].map((review, index) => (
                <motion.div 
                  key={review.id}
                  className="pb-4 border-b border-border last:border-0 last:pb-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <img 
                      src={review.avatar} 
                      alt={review.name}
                      className="w-10 h-10 rounded-full bg-muted"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{review.name}</span>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                        {review.comment}
                      </p>
                      <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                        <span>👍</span>
                        <span>مفيد ({review.helpful})</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Reviews Button */}
            <Button 
              variant="outline" 
              className="w-full mt-4 rounded-full"
              onClick={() => navigate(`/product/${id}/reviews`)}
            >
              عرض جميع التقييمات ({product.reviews})
            </Button>
          </div>

          {/* Price and CTA */}
          <motion.div 
            className="fixed bottom-20 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-40"
            animate={{
              y: isCtaCollapsed ? 100 : 0,
              opacity: isCtaCollapsed ? 0 : 1
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('totalPrice')}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{formatPrice(product.price * quantity)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice * quantity)}
                      </span>
                    )}
                  </div>
                </div>
                {product.discount && (
                  <div className="text-right">
                    <p className="text-sm text-green-600 font-semibold">توفر {product.discount}%</p>
                    <p className="text-xs text-muted-foreground">خصم حصري</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="flex-1"
                >
                  <Button 
                    variant="outline" 
                    onClick={handleAddToCart}
                    className="w-full h-12 rounded-full font-semibold gap-2 border-2"
                    disabled={isAdded}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-5 h-5" />
                        تم الإضافة
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {t('addToCart')}
                      </>
                    )}
                  </Button>
                </motion.div>
                
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="flex-1"
                >
                  <Button 
                    onClick={handleBuyNow}
                    className="w-full h-12 rounded-full font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    اشتري الآن
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
