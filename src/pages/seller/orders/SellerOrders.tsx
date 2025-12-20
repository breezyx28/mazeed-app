import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SellerOrders() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="container p-4 pb-24 mx-auto text-center py-12">
      <h1 className="text-2xl font-bold mb-4">{t('orders')}</h1>
      <p className="text-muted-foreground">{t('ordersManagementSoon')}</p>
    </div>
  );
}
