import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Cart = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const cartItems = [
    { product: products[0], quantity: 1 },
    { product: products[2], quantity: 2 },
  ];

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = 10;
  const total = subtotal + shipping;

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
          {cartItems.map((item, index) => (
            <div key={index} className="bg-card rounded-2xl p-4 flex gap-4">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-24 h-24 object-cover rounded-xl"
              />
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">{item.product.name}</h3>
                  <button className="text-destructive p-1">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {item.product.category}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">
                    ${item.product.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-3 bg-muted rounded-full px-3 py-1">
                    <button className="text-lg font-semibold">-</button>
                    <span className="font-semibold min-w-[1.5rem] text-center">
                      {item.quantity}
                    </span>
                    <button className="text-lg font-semibold">+</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-2xl p-4 mb-4">
          <h3 className="font-semibold mb-4">{t("orderSummary")}</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("shipping")}</span>
              <span className="font-semibold">${shipping.toFixed(2)}</span>
            </div>
            <div className="h-px bg-border"></div>
            <div className="flex justify-between">
              <span className="font-semibold">{t("total")}</span>
              <span className="font-bold text-lg">${total.toFixed(2)}</span>
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
