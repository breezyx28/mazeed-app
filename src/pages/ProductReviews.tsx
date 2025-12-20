import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ProductReviews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // User review state
  const [userReview, setUserReview] = useState<any>(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [tempComment, setTempComment] = useState("");
  const [tempRating, setTempRating] = useState(0);

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

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setReviewsLoading(true);

    try {
      // 1. Fetch Product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productData) {
        setProduct({
          ...productData,
          reviews: productData.reviews_count || 0,
          rating: productData.rating || 5
        });
      }

      // 2. Fetch All Reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // 3. Check if current user has reviewed
      if (user && reviewsData) {
        const userRev = reviewsData.find(r => r.user_id === user.id);
        if (userRev) {
          setUserReview(userRev);
          setHasReviewed(true);
          setTempComment(userRev.comment);
          setTempRating(userRev.rating);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews page data:', error);
    } finally {
      setLoading(false);
      setReviewsLoading(false);
    }
  }, [id, user, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error(t('loginFirst', 'الرجاء تسجيل الدخول أولاً'));
      return;
    }
    if (tempRating === 0) {
      toast.error(isArabic ? "الرجاء اختيار تقييم" : "Please select a rating");
      return;
    }
    if (tempComment.trim() === "") {
      toast.error(isArabic ? "الرجاء كتابة تعليق" : "Please write a comment");
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: id,
          user_id: user.id,
          rating: tempRating,
          comment: tempComment
        });

      if (error) throw error;
      
      toast.success(isArabic ? "تم إضافة تقييمك بنجاح!" : "Review submitted successfully!");
      fetchData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('errors.submitFailed', 'فشل في إرسال التقييم'));
    }
  };

  const handleEditReview = () => {
    setTempComment(userReview.comment);
    setTempRating(userReview.rating);
    setIsEditing(true);
  };

  const handleUpdateReview = async () => {
    if (tempComment.trim() === "") {
      toast.error(isArabic ? "الرجاء كتابة تعليق" : "Please write a comment");
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          comment: tempComment,
          rating: tempRating
        })
        .eq('id', userReview.id);

      if (error) throw error;

      toast.success(isArabic ? "تم تحديث تقييمك بنجاح!" : "Review updated successfully!");
      fetchData();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error(t('errors.updateFailed', 'فشل في تحديث التقييم'));
    }
  };

  const handleCancelEdit = () => {
    setTempComment(userReview?.comment || "");
    setTempRating(userReview?.rating || 0);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-4">{t('errors.productNotFound', 'المنتج غير موجود')}</h2>
        <Button onClick={() => navigate(-1)}>{t('common.goBack', 'الرجوع')}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ArrowLeft className={`w-6 h-6 ${isArabic ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{isArabic ? "التقييمات والمراجعات" : "Ratings and Reviews"}</h1>
              <p className="text-xs text-muted-foreground">{product.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Overall Rating Summary */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">{Number(product.rating || 0).toFixed(1)}</div>
              <div className="flex items-center justify-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground">{reviews.length} {isArabic ? "تقييم" : "reviews"}</div>
            </div>
            
            {/* Rating Breakdown */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter(r => Math.round(r.rating) === stars).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
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
        </div>

        {/* User Review Form/Display */}
        {user && (
          <div className="bg-card rounded-2xl border border-border p-4 mb-6">
            {!hasReviewed ? (
              <div>
                <h3 className="font-semibold mb-4">{isArabic ? "أضف تقييمك" : "Add your review"}</h3>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">{isArabic ? "التقييم" : "Rating"}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setTempRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`w-8 h-8 ${star <= tempRating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">{isArabic ? "التعليق" : "Comment"}</label>
                  <Textarea
                    value={tempComment}
                    onChange={(e) => setTempComment(e.target.value)}
                    placeholder={isArabic ? "شارك تجربتك مع هذا المنتج..." : "Share your experience..."}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <Button 
                  onClick={handleSubmitReview}
                  className="w-full rounded-full"
                >
                  {isArabic ? "إرسال التقييم" : "Submit Review"}
                </Button>
              </div>
            ) : !isEditing ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{isArabic ? "تقييمك" : "Your Review"}</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleEditReview}
                    className="rounded-full"
                  >
                    {isArabic ? "تعديل" : "Edit"}
                  </Button>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= userReview.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {userReview.comment}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-4">{isArabic ? "تعديل تقييمك" : "Edit your review"}</h3>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">{isArabic ? "التقييم" : "Rating"}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setTempRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star 
                          key={star}
                          className={`w-8 h-8 ${star <= tempRating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">{isArabic ? "التعليق" : "Comment"}</label>
                  <Textarea
                    value={tempComment}
                    onChange={(e) => setTempComment(e.target.value)}
                    placeholder={isArabic ? "شارك تجربتك مع هذا المنتج..." : "Share your experience..."}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1 rounded-full"
                  >
                    {isArabic ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button 
                    onClick={handleUpdateReview}
                    className="flex-1 rounded-full"
                  >
                    {isArabic ? "حفظ التعديلات" : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Reviews */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">{isArabic ? "جميع التقييمات" : "All Reviews"} ({reviews.length})</h3>
          
          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noReviewsYet', 'لا توجد مراجعات بعد')}
            </div>
          ) : (
            reviews.map((review, index) => (
              <motion.div 
                key={review.id}
                className="bg-card rounded-2xl border border-border p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.profiles?.avatar_url} />
                    <AvatarFallback>{review.profiles?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
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
      </div>
    </div>
  );
};

export default ProductReviews;
