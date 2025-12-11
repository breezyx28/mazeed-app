import { ArrowLeft, ArrowRight, Heart, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useWishlist } from "@/hooks/useWishlist";
import { useMemo } from "react";

const Wishlist = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { wishlistItems: wishlistData, isLoading, removeFromWishlist } = useWishlist();

  const wishlistItems = useMemo(() => {
    return wishlistData
      .map(item => products.find(product => product.id === item.product_id))
      .filter(Boolean);
  }, [wishlistData]);

  const handleRemoveFromWishlist = async (productId: string) => {
    await removeFromWishlist(productId);
    toast.success("تم إزالته من المفضلة");
  };

  const addToCart = (name: string) => {
    toast.success(`تم إضافة ${name} إلى السلة!`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <h1 className="text-xl font-bold">{t('wishlist')}</h1>
          <span className="ml-auto text-sm text-muted-foreground">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `${wishlistItems.length} عنصر`
            )}
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">جاري تحميل المفضلة...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">قائمة المفضلة فارغة</h2>
            <p className="text-muted-foreground mb-6">ابدأ بإضافة العناصر التي تحبها!</p>
            <Button onClick={() => navigate("/")} className="rounded-full">
              متابعة التسوق
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromWishlist(item.id)}
                        className="p-2 -mt-2 -mr-2 hover:bg-accent rounded-full transition-colors"
                      >
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-lg">{item.price} ريال</span>
                      {item.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {item.originalPrice} ريال
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => addToCart(item.name)}
                      size="sm"
                      className="w-full rounded-full"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t('addToCart')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
