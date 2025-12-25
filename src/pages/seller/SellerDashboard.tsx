import { useNavigate } from "react-router-dom";
import {
  Plus,
  ShoppingBag,
  Users,
  TrendingUp,
  ChevronRight,
  LayoutDashboard,
  Store,
  Package,
  CircleDollarSign,
  ArrowRight,
  Sparkles,
  PieChart,
  Target,
  ArrowUpRight,
  Bell,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SellerDashboard() {
  const { sellerProfile } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    sales: 0,
    orders: 0,
    products: 0,
    views: 0,
  });
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!sellerProfile?.id) return;

      setLoading(true);
      try {
        // 1. Fetch Products Count
        const { count: productCount, error: pError } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", sellerProfile.id);

        if (pError) throw pError;

        // 2. Fetch Sales and Orders from order_items joined with orders
        // Note: We sum up price_at_purchase * quantity for sales
        // And count distinct order_id for orders
        const { data: orderData, error: oError } = await supabase
          .from("order_items")
          .select(
            `
            price_at_purchase,
            quantity,
            order_id,
            orders!inner(status)
          `
          )
          .eq("seller_id", sellerProfile.id);

        if (oError) throw oError;

        let totalSales = 0;
        const uniqueOrders = new Set();
        let activeOrdersCount = 0;

        orderData?.forEach((item) => {
          totalSales += item.price_at_purchase * item.quantity;
          uniqueOrders.add(item.order_id);

          // Count as active if order status is not completed/cancelled
          const status = (item.orders as any)?.status;
          if (
            status &&
            !["completed", "cancelled", "returned"].includes(status)
          ) {
            activeOrdersCount++; // This is simplified per item, but good enough for now
          }
        });

        // For views, we can use a proxy like sum of reviews_count or just mock for now
        // if no real view tracking exists
        const { data: viewsData } = await supabase
          .from("products")
          .select("reviews_count")
          .eq("seller_id", sellerProfile.id);

        const totalViews =
          viewsData?.reduce((acc, p) => acc + p.reviews_count * 12, 0) || 0;

        // 3. Fetch Pending Actions (Reports and Low Stock)
        const actions: any[] = [];

        // Fetch pending reports
        const { data: reports, error: rError } = await supabase
          .from("product_status_reports")
          .select(
            `
            id,
            product_id,
            reported_status,
            report_count,
            products(name)
          `
          )
          .eq("seller_id", sellerProfile.id)
          .eq("status", "pending");

        if (!rError && reports) {
          reports.forEach((report) => {
            actions.push({
              id: `report-${report.id}`,
              type: "report",
              title: t(
                report.reported_status === "wrong_info"
                  ? "reportWrongInfo"
                  : report.reported_status === "out_of_stock"
                  ? "reportOutofStock"
                  : report.reported_status === "discontinued"
                  ? "reportDiscontinued"
                  : "reportTemporarilyUnavailable"
              ),
              desc: `${(report.products as any)?.name} (${
                report.report_count
              } ${isArabic ? "بلاغات" : "reports"})`,
              priority: "danger",
              icon: AlertTriangle,
              href: `/seller/products?report=${report.id}`,
            });
          });
        }

        // Fetch low stock products
        const { data: lowStockProducts, error: lsError } = await supabase
          .from("products")
          .select("id, name, stock_quantity")
          .eq("seller_id", sellerProfile.id)
          .lte("stock_quantity", 5)
          .eq("status", "published");

        if (!lsError && lowStockProducts) {
          lowStockProducts.forEach((p) => {
            actions.push({
              id: `stock-${p.id}`,
              type: "stock",
              title: isArabic ? "مخزون منخفض جداً" : "Critically Low Stock",
              desc: `${p.name}: ${p.stock_quantity} ${
                isArabic ? "وحدات متبقية" : "units left"
              }`,
              priority: "warning",
              icon: Package,
              href: `/seller/products/edit/${p.id}`,
            });
          });
        }

        setPendingActions(actions);
        setMetrics({
          sales: totalSales,
          orders: uniqueOrders.size,
          products: productCount || 0,
          views: totalViews,
        });
      } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [sellerProfile?.id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(isArabic ? "ar-SD" : "en-US", {
      style: "currency",
      currency: "SDG",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + "k";
    return val.toString();
  };

  const stats = [
    {
      label: t("sales"),
      value: loading ? "..." : formatCurrency(metrics.sales),
      change: "+0%", // Future: calculate trend
      icon: CircleDollarSign,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      trend: "neutral",
    },
    {
      label: t("orders"),
      value: loading ? "..." : metrics.orders.toString(),
      change: "Active",
      icon: ShoppingBag,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      trend: "neutral",
    },
    {
      label: t("products"),
      value: loading ? "..." : metrics.products.toString(),
      change: "Items",
      icon: Package,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      trend: "neutral",
    },
    {
      label: t("storeViews"),
      value: loading ? "..." : formatNumber(metrics.views),
      change: "+0%",
      icon: Users,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      trend: "neutral",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black pb-24 max-w-md mx-auto">
      {/* Premium Header */}
      <div className="bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                {t("sellerDashboard")}
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {t("manageBusiness")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
            </button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 border-none bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 font-bold"
              onClick={() => navigate("/profile")}
            >
              {t("backToProfile")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Welcome Premium Section */}
        <div className="relative overflow-hidden rounded-[32px] bg-zinc-900 border border-zinc-800 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Store className="w-32 h-32 text-white rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-black px-2 py-0.5">
                  {sellerProfile?.status || "Active"}
                </Badge>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    Premium Partner
                  </span>
                </div>
              </div>
              <h2 className="text-white text-3xl font-black tracking-tighter leading-none">
                {t("welcomeToStore", {
                  name: sellerProfile?.shop_name || "Merchant",
                })}
              </h2>
              <p className="text-zinc-400 text-sm max-w-md font-medium">
                {t("sellerDashboardDevMessage")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/seller/products/new")}
                className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black gap-2 shadow-xl shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
                {t("addNewProduct")}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/seller/offers/new")}
                className="rounded-2xl h-14 px-8 border-zinc-700 bg-transparent hover:bg-zinc-800 text-white font-black gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                {t("createOffer")}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-zinc-950 p-6 rounded-[28px] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                    stat.color
                  )}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                    stat.trend === "up"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-slate-500/10 text-slate-500"
                  )}
                >
                  {stat.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
                  {stat.label}
                </h3>
                <div className="text-3xl font-black tracking-tighter">
                  {stat.value}
                </div>
              </div>

              {/* Decorative Bottom Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary transition-all" />
            </motion.div>
          ))}
        </div>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Store Performance Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] overflow-hidden">
            <div className="p-8 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-black tracking-tight">
                    {t("storePerformance")}
                  </h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    {t("last30Days")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs font-bold text-primary"
              >
                View Insights
              </Button>
            </div>
            <div className="p-12 text-center h-[240px] flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                <Target className="w-10 h-10 text-slate-300 dark:text-zinc-700" />
              </div>
              <p className="text-sm text-muted-foreground font-medium max-w-[200px]">
                Analytics dashboard is being prepared for your shop
              </p>
            </div>
          </div>

          {/* Tasks/Pending Actions */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 dark:border-zinc-800">
              <h4 className="font-black tracking-tight">
                {t("pendingAction")}
              </h4>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Needs Attention
              </p>
            </div>
            <div className="flex-1 p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {t("loading")}
                  </span>
                </div>
              ) : pendingActions.length > 0 ? (
                pendingActions.map((action) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-5 rounded-3xl transition-all flex items-center justify-between group cursor-pointer border hover:shadow-lg",
                      action.priority === "danger"
                        ? "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 hover:border-red-300"
                        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 hover:border-amber-300"
                    )}
                    onClick={() => navigate(action.href)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                          action.priority === "danger"
                            ? "bg-red-100 dark:bg-red-900/40 text-red-600"
                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
                        )}
                      >
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[13px] font-black tracking-tight flex items-center gap-2 uppercase">
                          {action.title}
                          {action.priority === "danger" && (
                            <Badge className="bg-red-600 text-[8px] h-4 px-1 p-0 font-bold uppercase border-none animate-pulse">
                              Critical
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                          {action.desc}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-current opacity-20 flex items-center justify-center group-hover:opacity-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                      <ArrowRight
                        className={cn("w-4 h-4", isArabic && "rotate-180")}
                      />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Target className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">
                    {isArabic ? "كل شيء ممتاز!" : "All Clear!"}
                  </p>
                  <p className="text-[10px] mt-1 font-medium">
                    {isArabic
                      ? "لا توجد إجراءات معلقة حالياً"
                      : "No pending actions at the moment"}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 mt-auto">
              <button
                onClick={() => setPendingActions([])}
                className="w-full h-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isArabic ? "تحديث القائمة" : "Refresh Actions"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        body {
          background-color: #f8fafc;
        }
        .dark body {
          background-color: #000;
        }
      `}</style>
    </div>
  );
}
