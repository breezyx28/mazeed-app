import { ArrowRight, ArrowLeft, Bell, CreditCard, Heart, MapPin, Settings, ShoppingBag, User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = i18n.language === 'ar';
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        toast.success(t('profileUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    // Clear any stored user data here
    localStorage.removeItem('user');
    sessionStorage.clear();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { icon: User, label: t('editProfile'), href: "/edit-profile" },
    { icon: MapPin, label: t('shippingAddress'), href: "/shipping-address" },
    { icon: CreditCard, label: t('paymentMethods'), href: "/payment-methods" },
    { icon: ShoppingBag, label: t('myOrders'), href: "/my-orders" },
    { icon: Heart, label: t('wishlist'), href: "/wishlist" },
    { icon: Bell, label: t('notifications'), href: "/notifications" },
    { icon: Settings, label: t('settings'), href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{t('profile')}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4">
        {/* Profile Info */}
        <div className="bg-card rounded-2xl p-6 mt-6 flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">أحمد محمد</h2>
            <p className="text-sm text-muted-foreground">ahmed.mohamed@email.com</p>
          </div>
          <button className="text-primary font-medium text-sm">{t('edit')}</button>
        </div>

        {/* Menu Items */}
        <div className="mt-6 space-y-2">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={() => navigate(item.href)}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent transition-colors group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent-foreground/10 transition-colors">
                <item.icon className="w-5 h-5" />
              </div>
              <span className="flex-1 font-medium text-right">{item.label}</span>
              {isRTL ? (
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-8 mb-4">
          <Button 
            variant="outline" 
            className="w-full h-14 rounded-full font-semibold"
            onClick={handleLogout}
          >
            {t('logout')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
