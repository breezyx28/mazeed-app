import { ArrowRight, ArrowLeft, Bell, CreditCard, Heart, MapPin, Settings, ShoppingBag, User, Camera, AlertCircle, Store, Sparkles, LayoutDashboard, Zap } from "lucide-react";
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
  const { user, profile, sellerProfile, isProfileComplete, logout: authLogout } = useAuth();
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
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile')
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
        
        {/* Seller Section */}
        <div className="mt-8 mb-6">
           {!profile.is_seller ? (
             <motion.div
               whileHover={{ scale: 1.02, translateY: -2 }}
               whileTap={{ scale: 0.98 }}
               className="relative overflow-hidden rounded-[24px] group cursor-pointer"
               onClick={() => navigate('/seller/onboarding')}
             >
               {/* Background Glow/Gradient */}
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 transition-all duration-500 group-hover:scale-110" />
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent_70%)]" />
               
               <div className="relative p-6 flex items-center justify-between gap-4">
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                     <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                       <Sparkles className="w-4 h-4 text-white" />
                     </div>
                     <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">Partner Program</span>
                   </div>
                   <h3 className="text-white text-xl font-black tracking-tight leading-none mb-1">
                     {t('becomeASeller')}
                   </h3>
                   <p className="text-white/70 text-xs font-medium max-w-[180px]">
                     {isRTL ? 'ابدأ بيع منتجاتك والوصول لملايين العملاء' : 'Start selling and reach millions of customers'}
                   </p>
                 </div>
                 
                 <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:rotate-12">
                   <Store className="w-7 h-7 text-white" />
                 </div>
               </div>
               
               {/* Bottom Shine */}
               <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
             </motion.div>
           ) : (
             <div className="space-y-4">
                {/* Active Seller Premium Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-[32px] bg-black dark:bg-zinc-900 border border-zinc-800 p-1 group shadow-2xl"
                >
                  <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-[31px] p-6 relative overflow-hidden">
                    {/* Animated Decorative Rings */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />

                    <div className="relative flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-400 p-[2px]">
                            <div className="w-full h-full rounded-[14px] bg-zinc-900 flex items-center justify-center overflow-hidden">
                              {sellerProfile?.logo_url ? (
                                <img src={sellerProfile.logo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Store className="w-8 h-8 text-primary" />
                              )}
                            </div>
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-white font-black text-lg tracking-tight leading-none mb-1">
                            {sellerProfile?.shop_name || t('myShop')}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                              {sellerProfile?.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="text-2xl font-black text-white tracking-tighter">12.5k</div>
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{t('totalSales')}</div>
                      </div>
                    </div>

                    {sellerProfile?.status === 'active' ? (
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/seller/dashboard')} 
                        className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 relative group overflow-hidden"
                      >
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                         <LayoutDashboard className="w-5 h-5" />
                         <span>{t('switchToSellerView')}</span>
                         <Zap className="w-4 h-4 fill-black text-black" />
                      </motion.button>
                    ) : (
                      <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-4 border border-zinc-800/50">
                        <p className="text-xs text-zinc-400 text-center font-medium leading-relaxed">
                          <AlertCircle className="w-4 h-4 mx-auto mb-2 text-yellow-500" />
                          {t('sellerProfileUnderReview')}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
             </div>
           )}
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
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
