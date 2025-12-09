import { BadgeType, badgeConfigs } from "@/data/products";
import { useTranslation } from "react-i18next";

interface ProductBadgeProps {
  type: BadgeType;
  className?: string;
}

export const ProductBadge = ({ type, className = "" }: ProductBadgeProps) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const badgeConfig = badgeConfigs.find(b => b.type === type);
  
  if (!badgeConfig) return null;
  
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badgeConfig.colorClass} ${className}`}
    >
      <span>{badgeConfig.emoji}</span>
      <span>{isArabic ? badgeConfig.labelAr : badgeConfig.label}</span>
    </span>
  );
};
