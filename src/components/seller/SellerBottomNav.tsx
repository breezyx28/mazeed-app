import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export const SellerBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { path: "/seller/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { path: "/seller/products", icon: Package, label: t("products") },
    { path: "/seller/orders", icon: ShoppingBag, label: t("orders") },
    { path: "/seller/settings", icon: Settings, label: t("settings") },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 shadow-lg"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-6 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-colors relative p-2 rounded-lg ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className="relative">
                <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
};
