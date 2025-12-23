import {
  Home,
  Search,
  ShoppingCart,
  User,
  Grid,
  Tag,
  Video,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useTranslation } from "react-i18next";
import { Icon3D } from "@/components/3DIcon";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { useCart } from "@/context/CartContext";

export const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { cartItems } = useCart();

  const navItems = [
    { path: "/", icon: Home, label: t("home") },
    { path: "/categories", icon: Grid, label: t("categories") },
    { path: "/reels", icon: Video, label: t("reels") },
    { path: "/cart", icon: ShoppingCart, label: t("cart"), badge: cartItems.length > 0 ? cartItems.length : undefined },
    { path: "/profile", icon: Settings, label: t("settings") },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-6 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-2 transition-colors relative"
            >
              <div className="relative">
                <Icon3D icon={item.icon} isActive={isActive} />
                {item.badge !== undefined && (
                  <motion.span
                    key={`badge-${item.badge}`}
                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                  </motion.span>
                )}
              </div>
              <motion.span
                className={`text-xs font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
              >
                {item.label}
              </motion.span>
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
};
