import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { 
  Loader2, 
  Upload, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Globe, 
  Link as LinkIcon, 
  Camera, 
  MapPin, 
  Clock, 
  Share2, 
  Store,
  CheckCircle2,
  ChevronLeft,
  X,
  Layout
} from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { OpeningHoursPicker } from "@/components/OpeningHoursPicker";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  shop_name: z.string().min(3).max(50),
  description: z.string().min(10),
  business_address: z.string().min(5),
  website: z.string().optional().or(z.literal("")),
  opening_times: z.any(),
  logo_url: z.string().optional(),
  cover_url: z.string().optional(),
  social_media: z.object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      youtube: z.string().optional(),
      tiktok: z.string().optional(),
  }).optional(),
});

export default function StoreSettings() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { sellerProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shop_name: "",
      description: "",
      business_address: "",
      website: "",
      opening_times: { type: "custom", schedule: {} },
      social_media: {
          facebook: "",
          instagram: "",
          twitter: "",
          linkedin: "",
          youtube: "",
          tiktok: "",
      }
    },
  });

  // Load initial values
  useEffect(() => {
    if (sellerProfile) {
      const times = sellerProfile.opening_times as any;
      const openingTimesVal = times?.schedule ? times : { type: "custom", schedule: {} };
      const loc = sellerProfile.location as any;
      const social = sellerProfile?.social_media as any || {};

      form.reset({
        shop_name: sellerProfile.shop_name,
        description: sellerProfile.description || "",
        business_address: loc?.address || "",
        website: sellerProfile.website || "",
        opening_times: openingTimesVal,
        logo_url: sellerProfile.logo_url || "",
        cover_url: sellerProfile.cover_url || "",
        social_media: {
            facebook: social.facebook || "",
            instagram: social.instagram || "",
            twitter: social.twitter || "",
            linkedin: social.linkedin || "",
            youtube: social.youtube || "",
            tiktok: social.tiktok || "",
        }
      });
      setLogoPreview(sellerProfile.logo_url || null);
      setCoverPreview(sellerProfile.cover_url || null);
      
      if (loc?.lat && loc?.lng) {
          setCoordinates({ lat: loc.lat, lng: loc.lng });
      }
    }
  }, [sellerProfile, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const getSocialIcon = (url: string | undefined | null, platformPlaceholder: string) => {
    const s = (url || platformPlaceholder).toLowerCase();
    if(s.includes('facebook')) return <Facebook className="w-5 h-5 text-blue-600" />;
    if(s.includes('instagram')) return <Instagram className="w-5 h-5 text-pink-600" />;
    if(s.includes('twitter') || s.includes('x.com')) return <Twitter className="w-5 h-5 text-sky-500" />;
    if(s.includes('linkedin')) return <Linkedin className="w-5 h-5 text-blue-700" />;
    if(s.includes('youtube')) return <Youtube className="w-5 h-5 text-red-600" />;
    if(s.includes('tiktok')) return <Layout className="w-5 h-5 text-zinc-900 dark:text-white" />;
    
    return <LinkIcon className="w-5 h-5 text-muted-foreground" />;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      let finalLogoUrl = values.logo_url;
      if (logoFile) {
         const fileExt = logoFile.name.split('.').pop();
         const fileName = `logo_${sellerProfile?.id}_${Date.now()}.${fileExt}`;
         const filePath = `seller-logos/${fileName}`;
         const { error: uploadError } = await supabase.storage.from('public').upload(filePath, logoFile);
         if (uploadError) {
             const { error: retryError } = await supabase.storage.from('products').upload(filePath, logoFile);
             if (retryError) throw retryError;
             const { data } = supabase.storage.from('products').getPublicUrl(filePath);
             finalLogoUrl = data.publicUrl;
         } else {
             const { data } = supabase.storage.from('public').getPublicUrl(filePath);
             finalLogoUrl = data.publicUrl;
         }
      }

      let finalCoverUrl = values.cover_url;
      if (coverFile) {
         const fileExt = coverFile.name.split('.').pop();
         const fileName = `cover_${sellerProfile?.id}_${Date.now()}.${fileExt}`;
         const filePath = `seller-covers/${fileName}`;
         const { error: uploadError } = await supabase.storage.from('public').upload(filePath, coverFile);
         if (uploadError) {
             const { error: retryError } = await supabase.storage.from('products').upload(filePath, coverFile);
             if (retryError) throw retryError;
             const { data } = supabase.storage.from('products').getPublicUrl(filePath);
             finalCoverUrl = data.publicUrl;
         } else {
             const { data } = supabase.storage.from('public').getPublicUrl(filePath);
             finalCoverUrl = data.publicUrl;
         }
      }

      const { error } = await supabase.rpc('rpc_update_seller_profile', {
        p_shop_name: values.shop_name,
        p_shop_slug: null, 
        p_description: values.description,
        p_location: { address: values.business_address, lat: coordinates?.lat, lng: coordinates?.lng },
        p_opening_times: { ...values.opening_times, display: values.opening_times.type === "24_7" ? "Open 24/7" : "Custom Hours" },
        p_website: values.website || null,
        p_logo_url: finalLogoUrl,
        p_cover_url: finalCoverUrl,
        p_social_media: values.social_media
      });

      if (error) throw error;
      await refreshProfile();
      toast({ title: t('success'), description: t('profileUpdated') });
    } catch (error: any) {
      console.error("Update error:", error);
      toast({ title: t('failure'), description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const Section = ({ title, icon: Icon, children, description }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-sm"
    >
      <div className="p-6 border-b border-slate-100 dark:border-zinc-900 flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-black tracking-tight text-base">{title}</h3>
          {description && <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mt-1">{description}</p>}
        </div>
      </div>
      <div className="p-8 space-y-6">
        {children}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black">
      {/* Sticky Top Nav */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className={cn("w-5 h-5", isArabic && "rotate-180")} />
            </Button>
            <div>
              <h1 className="text-xl font-black tracking-tighter">{t('settings')}</h1>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Store Profile</span>
              </div>
            </div>
          </div>
          <Button 
            form="store-settings-form"
            type="submit" 
            disabled={isSubmitting}
            className="rounded-full px-6 font-black gap-2 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isSubmitting ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : t('saveChanges')}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-32">
        <Form {...form}>
          <form id="store-settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Visual Brand Preview Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-[40px] overflow-hidden bg-zinc-100 dark:bg-zinc-900 aspect-[21/9] sm:aspect-[3/1] group shadow-2xl"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center border-4 border-dashed border-zinc-200 dark:border-zinc-800 m-2 rounded-[36px]">
                  <Camera className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                <Button 
                  type="button"
                  variant="secondary"
                  className="rounded-full font-black gap-2 h-12 px-6"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  {coverPreview ? (isArabic ? 'تغيير صورة الغلاف' : 'Change Cover') : (isArabic ? 'رفع صورة غلاف' : 'Upload Cover')}
                </Button>
              </div>

              {/* Logo Overlay */}
              <div className="absolute -bottom-6 left-8 sm:left-12 flex items-end gap-6 h-auto">
                 <div className="relative group/logo">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white dark:bg-zinc-900 p-1 shadow-2xl border-4 border-white dark:border-zinc-950 overflow-hidden relative">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                          <Store className="w-8 h-8 text-zinc-400" />
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-all cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('logo-upload')?.click(); }}
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                 </div>
              </div>
              
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </motion.div>

            <div className="pt-4 pb-2" />

            <Section title={t('shopInformation')} icon={Store} description="IDENTITY & STORY">
              <FormField
                control={form.control}
                name="shop_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('shopName')}</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 focus:ring-primary text-base font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('shopDescription')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="resize-none min-h-[120px] rounded-2xl border-slate-200 dark:border-zinc-800 p-4 font-medium leading-relaxed" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('website')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} className="h-14 pl-12 rounded-2xl border-slate-200 dark:border-zinc-800 font-bold" placeholder="https://your-website.com" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title={isArabic ? 'الموقع الجغرافي' : 'Store Location'} icon={MapPin} description="PHYSICAL PRESENCE">
              <FormField
                control={form.control}
                name="business_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('businessAddress')}</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4">
                 <div className="flex items-center justify-between">
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('locationOnMap')}</FormLabel>
                    {coordinates && (
                      <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-600 border-none px-3 font-bold">
                        Coordinates Set
                      </Badge>
                    )}
                 </div>
                 <div className="rounded-[28px] overflow-hidden border border-slate-200 dark:border-zinc-800">
                   <LocationPicker 
                      initialPosition={coordinates} 
                      onLocationSelect={(lat, lng) => setCoordinates({ lat, lng })} 
                   />
                 </div>
              </div>
            </Section>

            <Section title={t('openingTimes')} icon={Clock} description="BUSINESS HOURS">
              <FormField
                control={form.control}
                name="opening_times"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <OpeningHoursPicker 
                        value={field.value} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title={t('socialMediaLinks')} icon={Share2} description="CONNECTIVITY">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'].map((platform) => (
                    <FormField
                        key={platform}
                        control={form.control}
                        name={`social_media.${platform}` as any}
                        render={({ field }) => (
                            <FormItem>
                                <div className="group relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:scale-110 transition-transform">
                                        {getSocialIcon(field.value || platform, platform)}
                                    </div>
                                    <FormControl>
                                        <Input 
                                          {...field} 
                                          className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium text-sm" 
                                          placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`} 
                                        />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                  ))}
               </div>
            </Section>

            <div className="p-8 bg-zinc-950 rounded-[40px] text-white overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <CheckCircle2 className="w-32 h-32" />
               </div>
               <div className="relative z-10 space-y-4">
                  <h4 className="text-2xl font-black tracking-tighter leading-none italic uppercase">Ready for Business?</h4>
                  <p className="text-zinc-400 text-sm font-medium max-w-xs">Make sure all details are accurate. This information is visible to thousands of customers in Khartoum.</p>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-16 rounded-2xl bg-white hover:bg-zinc-100 text-black font-black text-lg gap-3 transition-transform active:scale-95 shadow-2xl"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layout className="w-5 h-5" />}
                    {isSubmitting ? (isArabic ? 'جاري الحفظ...' : 'Saving Changes...') : t('saveChanges')}
                  </Button>
               </div>
            </div>

          </form>
        </Form>
      </div>

      <style>{`
        .leaflet-container {
          border-radius: 28px;
          height: 300px !important;
        }
      `}</style>
    </div>
  );
}
