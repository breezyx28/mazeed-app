import { ArrowRight, ArrowLeft, Bell, CreditCard, Heart, MapPin, Settings, ShoppingBag, User, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, profile, isProfileComplete, logout: authLogout } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success(t('profileUpdated'));
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
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

  // Show loading only while checking auth, not while profile is loading
  if (!user) {
    return null; // Will redirect to login via useEffect
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{t('profile')}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4">
        {/* Profile Incomplete Alert */}
        {!isProfileComplete && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                {isRTL ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'}
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                {isRTL 
                  ? 'يرجى إكمال معلومات ملفك الشخصي للحصول على تجربة أفضل'
                  : 'Please complete your profile information for a better experience'}
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/edit-profile')}
                className="bg-amber-600 hover:bg-amber-700 text-white h-8 rounded-lg"
              >
                {isRTL ? 'أكمل الآن' : 'Complete Now'}
              </Button>
            </div>
          </div>
        )}
        {/* Profile Info */}
        <div className="bg-card rounded-2xl p-6 mt-6 flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
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
            <h2 className="text-xl font-bold mb-1">{profile.full_name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <button 
            onClick={() => navigate('/edit-profile')}
            className="text-primary font-medium text-sm"
          >
            {t('edit')}
          </button>
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
