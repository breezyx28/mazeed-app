import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function SellerDashboard() {
  const { sellerProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="container px-4 py-6 pb-24 space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold">{t('sellerDashboard')}</h1>
         <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
           {t('backToProfile')}
         </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="p-4 md:p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground">{t('totalSales')}</h3>
          <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2">$0.00</p>
        </div>
        <div className="p-4 md:p-6 bg-card rounded-xl border shadow-sm">
           <h3 className="text-xs md:text-sm font-medium text-muted-foreground">{t('activeOrders')}</h3>
           <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2">0</p>
        </div>
        <div className="p-4 md:p-6 bg-card rounded-xl border shadow-sm">
           <h3 className="text-xs md:text-sm font-medium text-muted-foreground">{t('products')}</h3>
           <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2">0</p>
        </div>
        <div className="p-4 md:p-6 bg-card rounded-xl border shadow-sm">
           <h3 className="text-xs md:text-sm font-medium text-muted-foreground">{t('storeViews')}</h3>
           <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2">0</p>
        </div>
      </div>
      
      <div className="p-6 md:p-12 text-center border-2 border-dashed rounded-xl bg-muted/50">
        <h3 className="text-lg font-semibold mb-2">{t('welcomeToStore', { name: sellerProfile?.shop_name })}</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-4">
          {t('sellerDashboardDevMessage')}
        </p>
        <div className="flex gap-4 justify-center">
            <Button variant="default" onClick={() => navigate("/seller/products/new")}>
              {t('addNewProduct')}
            </Button>
            <Button variant="outline" onClick={() => navigate("/seller/offers/new")}>
              {t('createOffer')}
            </Button>
        </div>
      </div>
    </div>
  );
}
