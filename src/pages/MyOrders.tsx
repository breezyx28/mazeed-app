import { ArrowLeft, ArrowRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const MyOrders = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const orders = [
    {
      id: "#ORD-2024-001",
      date: "15 فبراير، 2024",
      status: "تم التسليم",
      total: "545 ريال",
      items: [
        { name: "سماعات لاسلكية", qty: 1, image: "🎧" },
        { name: "غطاء هاتف", qty: 2, image: "📱" },
      ],
    },
    {
      id: "#ORD-2024-002",
      date: "18 فبراير، 2024",
      status: "في الطريق",
      total: "337 ريال",
      items: [{ name: "ساعة ذكية", qty: 1, image: "⌚" }],
    },
    {
      id: "#ORD-2024-003",
      date: "20 فبراير، 2024",
      status: "قيد المعالجة",
      total: "879 ريال",
      items: [
        { name: "حامل لابتوب", qty: 1, image: "💻" },
        { name: "كابل USB-C", qty: 3, image: "🔌" },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "تم التسليم":
        return "bg-green-500/10 text-green-500";
      case "في الطريق":
        return "bg-blue-500/10 text-blue-500";
      case "قيد المعالجة":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <h1 className="text-xl font-bold">{t('myOrders')}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
                </div>
                <Badge className={`${getStatusColor(order.status)} border-0`}>
                  {order.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                      {item.image}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">الكمية: {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                <p className="font-bold text-lg">{order.total}</p>
              </div>

              <button className="w-full mt-3 h-10 bg-primary/10 text-primary rounded-full font-medium text-sm hover:bg-primary/20 transition-colors">
                تتبع الطلب
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
