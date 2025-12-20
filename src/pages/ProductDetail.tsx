import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Star, Check, Share2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ProductBadge } from "@/components/ProductBadge";
import { CapacitorUtils } from "@/lib/capacitor-utils";
import { WishlistButton } from "@/components/WishlistButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { AnalyticsService } from "@/services/AnalyticsService";
import { ReportProductDialog } from "@/components/ReportProductDialog";
import { Flag } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const { user, profile } = useAuth();
  const isArabic = i18n.language === 'ar';
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedColor, setSelectedColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isCtaCollapsed, setIsCtaCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [ratingStats, setRatingStats] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  // Helper for formatting relative time
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return t('time.justNow', 'الآن');
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}د`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}س`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}ي`;
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SD' : 'en-US');
  };

  // Track Interaction & Fetch DB Product if needed
  useEffect(() => {
    const initProduct = async () => {
      let currentProduct = null;
      
      // Fetch from Supabase
      if (id) {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*, sellers(*)')
          .eq('id', id)
          .single();
        
        if (data) {
          // Map DB keys to UI expected keys (camelCase or specific names)
          currentProduct = {
            ...data,
            offerType: data.offer_type,
            offerExpiry: data.offer_expiry,
            originalPrice: data.original_price,
            reviews: data.reviews_count || 0,
            rating: data.rating || 5,
            images: data.images || [data.image],
            sellerId: data.seller_id,
            badges: data.badges || [],
            is_deliverable: data.is_deliverable ?? true
          };
          setProduct(currentProduct);
        }
        setLoading(false);
      }

      // Record "view" interaction using professional tracking service
      const catId = currentProduct?.category_id || currentProduct?.categoryId;
      if (user && catId) {
        AnalyticsService.trackCategoryInteraction(user.id, catId, 'view');
      }

      // Fetch reviews
      fetchReviews();
    };

    const fetchReviews = async () => {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*, profiles(full_name, avatar_url)')
          .eq('product_id', id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setReviews(data || []);

        // Calculate breakdown from all ratings
        const { data: allRatings, error: statsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', id);
        
        if (!statsError && allRatings) {
          const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          allRatings.forEach(r => {
            const star = Math.round(r.rating);
            if (star >= 1 && star <= 5) {
              stats[star as keyof typeof stats]++;
            }
          });
          setRatingStats(stats);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    initProduct();
    // Reset image index when product changes
    setSelectedImageIndex(0);
  }, [id, user]);

  const productImages = product ? (product.images || [product.image]) : [];

  useEffect(() => {
    if (!product) return;
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
  }, [lastScrollY, product]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    const color = product.colors && product.colors.length > 0 ? product.colors[selectedColor] : undefined;
    addToCart(product.id, quantity, color);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleShare = async () => {
    if (!product) return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground">{t('common.loading', 'Loading product details...')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <h2 className="text-xl font-bold">{t('errors.productNotFound', 'Product not found')}</h2>
        <Button onClick={() => navigate(-1)}>{t('common.goBack', 'Go Back')}</Button>
      </div>
    );
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
            <WishlistButton productId={product.id} />
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
            
            {(product.sellers?.location || product.location) && (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full gap-2 border-primary text-primary hover:bg-primary/5"
                onClick={() => navigate(`/navigate/${product.id}`, { state: { product } })}
              >
                <MapPin className="w-4 h-4" />
                {t('nearbyProducts.navigate', 'Navigate')}
              </Button>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">{t('description')}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {product.description || ""}
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
            <h3 className="font-semibold text-lg mb-4">{t('reviewsAndRatings')}</h3>
            
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
                <div className="text-xs text-muted-foreground">{product.reviews} {t('reviews')}</div>
              </div>
              
              {/* Rating Breakdown */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingStats[stars as keyof typeof ratingStats] || 0;
                  const totalReviews = Object.values(ratingStats).reduce((a, b) => a + b, 0);
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  
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
                      <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(percentage)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {t('noReviewsYet', 'لا توجد مراجعات بعد')}
                </div>
              ) : (
                reviews.map((review, index) => (
                  <motion.div 
                    key={review.id}
                    className="pb-4 border-b border-border last:border-0 last:pb-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start gap-3">
                      <img 
                        src={review.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${review.profiles?.full_name}`} 
                        alt={review.profiles?.full_name}
                        className="w-10 h-10 rounded-full bg-muted object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm">{review.profiles?.full_name}</span>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(review.created_at)}</span>
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
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* View All Reviews Button */}
            <Button 
              variant="outline" 
              className="w-full mt-4 rounded-full"
              onClick={() => navigate(`/product/${id}/reviews`)}
            >
              {t('viewAllReviews')} ({product.reviews})
            </Button>
          </div>

          {/* Utility / Support Section */}
          <div className="pt-12 pb-8 border-t border-border/50 mt-12 flex flex-col items-center gap-5 text-center">
            <div className="flex flex-col items-center gap-2 max-w-[280px]">
              <div className="w-10 h-10 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground mb-1">
                <Flag className="w-5 h-5" />
              </div>
              <span className="text-sm font-black text-foreground/80 tracking-tight">
                {t('isSomethingWrong')}
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                {t('reportHelpDesc')}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full px-6 h-10 gap-2 text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border-dashed border-2 bg-transparent"
              onClick={() => {
                if (!user) {
                  toast.error(t('loginRequired', 'Please login to report issues'));
                  return;
                }
                setIsReportDialogOpen(true);
              }}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">{t('reportProduct')}</span>
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
                    <p className="text-sm text-green-600 font-semibold">
                      {isArabic ? `توفر ${product.discount}%` : `Save ${product.discount}%`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "خصم حصري" : "Exclusive Discount"}
                    </p>
                  </div>
                )}
              </div>
              
              {product.is_deliverable !== false ? (
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
                          {t('addedToCart')}
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
                      {t('buyNow')}
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30">
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed text-center font-medium">
                      {t('notDeliverableMessage')}
                    </p>
                  </div>
                  <Button 
                    className="w-full h-12 rounded-full font-semibold gap-2 bg-gradient-to-r from-primary to-primary/80"
                    onClick={() => navigate(`/navigate/${product.id}`, { state: { product } })}
                  >
                    <MapPin className="w-5 h-5" />
                    {t('visitStore')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ReportProductDialog 
        isOpen={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        productId={product.id}
        sellerId={product.seller_id || product.sellerId}
        userId={user?.id || ""}
        userName={profile?.full_name || user?.user_metadata?.full_name || ""}
      />
    </div>
  );
};

export default ProductDetail;
