import { useNavigate } from "react-router-dom";
import { Check, Download, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const orderDetails = {
    orderNumber: "KS-2024-001234",
    date: new Date().toLocaleDateString("ar-SA"),
    total: 428.0,
    items: [
      { name: "Beats Solo Pro", quantity: 1, price: 299.0 },
      { name: "Nike Air Max", quantity: 2, price: 129.0 },
    ],
    shipping: 10.0,
    address: "شارع الملك فهد، حي العليا، الرياض",
  };

  const downloadInvoice = () => {
    // Generate and download invoice
    const invoiceData = `
فاتورة الطلب
رقم الطلب: ${orderDetails.orderNumber}
التاريخ: ${orderDetails.date}
العنوان: ${orderDetails.address}

المنتجات:
${orderDetails.items
  .map((item) => `${item.name} x${item.quantity} - $${item.price}`)
  .join("\n")}

الشحن: $${orderDetails.shipping}
المجموع: $${orderDetails.total}
    `;

    const blob = new Blob([invoiceData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${orderDetails.orderNumber}.txt`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mb-20"
      >
        <div className="bg-card rounded-3xl p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold mb-2">تم تأكيد الطلب!</h1>
          <p className="text-muted-foreground mb-6">
            شكراً لك، تم استلام طلبك بنجاح
          </p>

          <div className="bg-muted rounded-2xl p-4 mb-6 text-right">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الطلب:</span>
                <span className="font-semibold">
                  {orderDetails.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">التاريخ:</span>
                <span>{orderDetails.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع:</span>
                <span className="font-bold">${orderDetails.total}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={downloadInvoice}
              variant="outline"
              className="w-full h-12 rounded-full gap-2"
            >
              <Download className="w-5 h-5" />
              تحميل الفاتورة
            </Button>

            <Button
              onClick={() => navigate("/my-orders")}
              variant="outline"
              className="w-full h-12 rounded-full"
            >
              عرض طلباتي
            </Button>

            <Button
              onClick={() => navigate("/")}
              className="w-full h-12 rounded-full gap-2"
            >
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
