import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShoppingBag, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SellerOrders() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black">
      {/* Sticky Top Nav */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className={cn("w-5 h-5", isArabic && "rotate-180")} />
            </Button>
            <div>
              <h1 className="text-xl font-black tracking-tighter">{t('orders')}</h1>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Order Management</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-20 space-y-8 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[40px] p-12 text-center space-y-6 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
             <ShoppingBag className="w-48 h-48 text-primary" />
          </div>

          <div className="w-20 h-20 rounded-[28px] bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          
          <div className="relative z-10 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter italic uppercase">{t('ordersManagementSoon')}</h2>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              We're currently building a powerful order management system to help you track and fulfill customer requests with ease.
            </p>
          </div>

          <Button 
            onClick={() => navigate('/seller/dashboard')}
            className="rounded-full px-8 h-14 font-black text-base gap-3 shadow-xl shadow-primary/20 transition-transform active:scale-95"
          >
            <Layout className="w-5 h-5" />
            {isArabic ? 'العودة للوحة التحكم' : 'Return to Dashboard'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
