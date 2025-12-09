import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يرجى تسجيل الدخول أولاً");
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("فشل في تحميل العناوين");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    navigate("/payment-selection");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">تأكيد العنوان</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6">
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">لا توجد عناوين محفوظة</p>
            <Button
              onClick={() => navigate("/shipping-address")}
              className="rounded-full"
            >
              إضافة عنوان جديد
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {addresses.map((address, index) => (
                <motion.div
                  key={address.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAddress(index)}
                  className={`bg-card rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                    selectedAddress === index
                      ? "border-primary"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {address.type ?? "---"}
                        </h3>
                        {address.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            افتراضي
                          </span>
                        )}
                        {selectedAddress === index && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.street}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}
                        {address.state ? `, ${address.state}` : ""}
                      </p>
                      {address.phone_number && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {address.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/shipping-address")}
              className="w-full h-12 rounded-full mb-6"
            >
              إضافة عنوان جديد
            </Button>
          </>
        )}
      </div>

      {addresses.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4 z-40">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleConfirmLocation}
              className="w-full h-14 rounded-full font-semibold"
            >
              تأكيد العنوان والمتابعة
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
