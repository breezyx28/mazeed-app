import { ArrowLeft, ArrowRight, Camera, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const EditProfile = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = i18n.language === 'ar';
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    gender: '',
    age: '',
  });
  const [errors, setErrors] = useState({
    full_name: false,
    phone_number: false,
    gender: false,
    age: false,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        gender: profile.gender || '',
        age: profile.age?.toString() || '',
      });
    }
  }, [user, profile, navigate]);

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    const newErrors = {
      full_name: !formData.full_name,
      phone_number: !formData.phone_number,
      gender: !formData.gender,
      age: !formData.age,
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(error => error)) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          gender: formData.gender,
          age: parseInt(formData.age),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(t('profileUpdated'));
      navigate('/profile');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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

      await refreshProfile();
      toast.success(t('profileUpdated'));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <h1 className="text-xl font-bold">{t('editProfileTitle')}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Profile Photo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-primary" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">{isRTL ? 'الاسم الكامل' : 'Full Name'} *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                setErrors({ ...errors, full_name: false });
              }}
              className={`h-12 rounded-xl ${errors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{isRTL ? 'هذا الحقل مطلوب' : 'This field is required'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">{t('phoneNumber')} *</Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => {
                setFormData({ ...formData, phone_number: e.target.value });
                setErrors({ ...errors, phone_number: false });
              }}
              className={`h-12 rounded-xl ${errors.phone_number ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              placeholder="+249 XXX XXX XXX"
            />
            {errors.phone_number && (
              <p className="text-sm text-red-500">{isRTL ? 'هذا الحقل مطلوب' : 'This field is required'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">{isRTL ? 'الجنس' : 'Gender'} *</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => {
                setFormData({ ...formData, gender: value });
                setErrors({ ...errors, gender: false });
              }}
            >
              <SelectTrigger className={`h-12 rounded-xl ${errors.gender ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
                <SelectValue placeholder={isRTL ? 'اختر الجنس' : 'Select gender'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{isRTL ? 'ذكر' : 'Male'}</SelectItem>
                <SelectItem value="female">{isRTL ? 'أنثى' : 'Female'}</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-red-500">{isRTL ? 'هذا الحقل مطلوب' : 'This field is required'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">{isRTL ? 'العمر' : 'Age'} *</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => {
                setFormData({ ...formData, age: e.target.value });
                setErrors({ ...errors, age: false });
              }}
              className={`h-12 rounded-xl ${errors.age ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              placeholder={isRTL ? 'أدخل عمرك' : 'Enter your age'}
              min="1"
              max="120"
            />
            {errors.age && (
              <p className="text-sm text-red-500">{isRTL ? 'هذا الحقل مطلوب' : 'This field is required'}</p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full h-14 rounded-full text-base font-semibold disabled:opacity-50"
          >
            {isSaving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : t('saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
