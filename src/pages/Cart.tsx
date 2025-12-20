import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";

const Cart = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cartItems, subtotal, total, shipping, updateQuantity, removeFromCart, isLoading } = useCart();

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">{t("myCart")}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 mb-14">
        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-3xl border border-dashed">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-muted-foreground mb-4">{t("cartEmpty")}</p>
              <Button onClick={() => navigate('/')} variant="outline" className="rounded-full">
                {t("startShopping")}
              </Button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl p-4 flex gap-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive p-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {item.product.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">
                      {item.product.price.toLocaleString()} SDG
                    </span>
                    <div className="flex items-center gap-3 bg-muted rounded-full px-3 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-lg font-semibold"
                      >
                        -
                      </button>
                      <span className="font-semibold min-w-[1.5rem] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-lg font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-2xl p-4 mb-4">
          <h3 className="font-semibold mb-4">{t("orderSummary")}</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span className="font-semibold">{subtotal.toLocaleString()} SDG</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("shipping")}</span>
              <span className="font-semibold">{shipping.toLocaleString()} SDG</span>
            </div>
            <div className="h-px bg-border"></div>
            <div className="flex justify-between">
              <span className="font-semibold">{t("total")}</span>
              <span className="font-bold text-lg">{total.toLocaleString()} SDG</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4 z-40">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={() => navigate('/checkout')}
            className="w-full h-14 rounded-full text-base font-semibold"
          >
            {t("proceedToCheckout")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
