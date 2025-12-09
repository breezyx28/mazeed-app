import { ArrowLeft, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

const ProductReviews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const product = products.find(p => p.id === id);

  // Mock user review state
  const [userReview, setUserReview] = useState({
    rating: 0,
    comment: "",
    hasReviewed: false,
    existingRating: 0,
    existingComment: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempComment, setTempComment] = useState("");
  const [tempRating, setTempRating] = useState(0);

  // Mock reviews data
  const allReviews = [
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
    },
    {
      id: 4,
      name: "سارة أحمد",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara",
      rating: 5,
      date: "منذ 3 أشهر",
      comment: "منتج رائع وجودة ممتازة. التوصيل كان سريع والتعبئة محترفة.",
      helpful: 20
    },
    {
      id: 5,
      name: "خالد عمر",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Khaled",
      rating: 4,
      date: "منذ 3 أشهر",
      comment: "جيد جداً، السعر مناسب والجودة جيدة. أنصح به.",
      helpful: 6
    }
  ];

  const handleSubmitReview = () => {
    if (tempRating === 0) {
      toast.error("الرجاء اختيار تقييم");
      return;
    }
    if (tempComment.trim() === "") {
      toast.error("الرجاء كتابة تعليق");
      return;
    }

    setUserReview({
      rating: tempRating,
      comment: tempComment,
      hasReviewed: true,
      existingRating: tempRating,
      existingComment: tempComment
    });
    setIsEditing(false);
    toast.success("تم إضافة تقييمك بنجاح!");
  };

  const handleEditReview = () => {
    setTempComment(userReview.existingComment);
    setTempRating(userReview.existingRating);
    setIsEditing(true);
  };

  const handleUpdateReview = () => {
    if (tempComment.trim() === "") {
      toast.error("الرجاء كتابة تعليق");
      return;
    }

    setUserReview({
      ...userReview,
      comment: tempComment,
      existingComment: tempComment
    });
    setIsEditing(false);
    toast.success("تم تحديث تقييمك بنجاح!");
  };

  const handleCancelEdit = () => {
    setTempComment("");
    setTempRating(0);
    setIsEditing(false);
  };

  if (!product) {
    return <div>Product not found</div>;
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
              <h1 className="text-xl font-bold">التقييمات والمراجعات</h1>
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
        </div>

        {/* User Review Form/Display */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          {!userReview.hasReviewed ? (
            // New Review Form
            <div>
              <h3 className="font-semibold mb-4">أضف تقييمك</h3>
              
              {/* Star Rating */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">التقييم</label>
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

              {/* Comment */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">التعليق</label>
                <Textarea
                  value={tempComment}
                  onChange={(e) => setTempComment(e.target.value)}
                  placeholder="شارك تجربتك مع هذا المنتج..."
                  className="min-h-[100px] resize-none"
                />
              </div>

              <Button 
                onClick={handleSubmitReview}
                className="w-full rounded-full"
              >
                إرسال التقييم
              </Button>
            </div>
          ) : !isEditing ? (
            // Display User's Review
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">تقييمك</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEditReview}
                  className="rounded-full"
                >
                  تعديل
                </Button>
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= userReview.existingRating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                  />
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {userReview.existingComment}
              </p>
            </div>
          ) : (
            // Edit Review Form
            <div>
              <h3 className="font-semibold mb-4">تعديل تقييمك</h3>
              
              {/* Display Rating (not editable) */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">التقييم (لا يمكن تعديله)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`w-8 h-8 ${star <= userReview.existingRating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
              </div>

              {/* Edit Comment */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">التعليق</label>
                <Textarea
                  value={tempComment}
                  onChange={(e) => setTempComment(e.target.value)}
                  placeholder="شارك تجربتك مع هذا المنتج..."
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1 rounded-full"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleUpdateReview}
                  className="flex-1 rounded-full"
                >
                  حفظ التعديلات
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* All Reviews */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">جميع التقييمات ({allReviews.length})</h3>
          
          {allReviews.map((review, index) => (
            <motion.div 
              key={review.id}
              className="bg-card rounded-2xl border border-border p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
      </div>
    </div>
  );
};

export default ProductReviews;
