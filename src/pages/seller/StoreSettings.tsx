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
import { Loader2, Upload, Facebook, Instagram, Twitter, Linkedin, Youtube, Globe, Link as LinkIcon } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { OpeningHoursPicker, OpeningHoursData } from "@/components/OpeningHoursPicker";

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
  const { t } = useTranslation();
  const { sellerProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
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
      // safe access opening_times
      const times = sellerProfile.opening_times as any;
      // Handle legacy string or structured object
      const openingTimesVal = times?.schedule ? times : { 
          type: "custom", 
          schedule: {}, 
          // If it was just a string before, we might lose it or put it in comments? 
          // For now let's just initialize structure. 
      };
      const displayTime = times?.display || "";
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
    // Check specific platform based on input or placeholder if empty
    if(s.includes('facebook')) return <Facebook className="w-4 h-4 text-blue-600" />;
    if(s.includes('instagram')) return <Instagram className="w-4 h-4 text-pink-600" />;
    if(s.includes('twitter') || s.includes('x.com')) return <Twitter className="w-4 h-4 text-sky-500" />;
    if(s.includes('linkedin')) return <Linkedin className="w-4 h-4 text-blue-700" />;
    if(s.includes('youtube')) return <Youtube className="w-4 h-4 text-red-600" />;
    if(s.includes('tiktok')) return <span className="text-xs font-bold">Tk</span>; // No lucide icon for tiktok yet in some versions? Using text fallback or Link
    
    return <LinkIcon className="w-4 h-4 text-muted-foreground" />;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      let finalLogoUrl = values.logo_url;

      if (logoFile) {
         const fileExt = logoFile.name.split('.').pop();
         const fileName = `logo_${sellerProfile?.id}_${Date.now()}.${fileExt}`;
         const filePath = `seller-logos/${fileName}`;
         
         const { error: uploadError } = await supabase.storage
           .from('public') 
           .upload(filePath, logoFile);
           
         if (uploadError) {
             console.warn("Upload to public/seller-logos failed, trying products bucket", uploadError);
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
         
         const { error: uploadError } = await supabase.storage
           .from('public') 
           .upload(filePath, coverFile);
           
         if (uploadError) {
             console.warn("Upload to public/seller-covers failed, trying products bucket", uploadError);
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
        p_location: { 
            address: values.business_address,
            lat: coordinates?.lat,
            lng: coordinates?.lng
        },
        p_opening_times: {
            ...values.opening_times,
            // Generate a simple display string for easy viewing elsewhere
            display: values.opening_times.type === "24_7" ? "Open 24/7" : "Custom Hours"
        },
        p_website: values.website || null,
        p_logo_url: finalLogoUrl,
        p_cover_url: finalCoverUrl,
        p_social_media: values.social_media
      });

      if (error) throw error;

      await refreshProfile();
      toast({
        title: t('success'),
        description: t('profileUpdated'),
      });
    } catch (error: any) {
      console.error("Update error:", error);
      toast({
        title: t('failure'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Logo Upload */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted relative border-2 border-dashed flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                 onClick={() => document.getElementById('logo-upload')?.click()}>
                {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <input 
                    id="logo-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleLogoChange}
                />
            </div>
            <FormLabel>{t('shopLogo')}</FormLabel>
          </div>

          {/* Cover Upload */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-full h-32 rounded-md overflow-hidden bg-muted relative border-2 border-dashed flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                 onClick={() => document.getElementById('cover-upload')?.click()}>
                {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="w-8 h-8" />
                        <span className="text-sm">{t('clickToUploadCover')}</span>
                    </div>
                )}
                <input 
                    id="cover-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleCoverChange}
                />
            </div>
            <FormLabel>{t('coverImage')}</FormLabel>
          </div>

          <FormField
            control={form.control}
            name="shop_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('shopName')}</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>{t('shopDescription')}</FormLabel>
                <FormControl>
                  <Textarea className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('businessAddress')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
             <FormLabel>{t('locationOnMap')}</FormLabel>
             <LocationPicker 
                initialPosition={coordinates} 
                onLocationSelect={(lat, lng) => setCoordinates({ lat, lng })} 
             />
             {coordinates && (
                <div className="pt-2">
                    <FormLabel className="text-xs text-muted-foreground">{t('selectedCoordinates')}</FormLabel>
                    <Input 
                        value={`${coordinates.lat}, ${coordinates.lng}`} 
                        disabled 
                        className="bg-muted font-mono text-xs mt-1"
                    />
                </div>
             )}
          </div>
          
          <div className="space-y-4 border-t pt-4">
              <FormLabel className="text-base">{t('socialMediaLinks')}</FormLabel>
              {['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'].map((platform) => (
                  <FormField
                      key={platform}
                      control={form.control}
                      name={`social_media.${platform}` as any}
                      render={({ field }) => (
                          <FormItem>
                              <div className="relative">
                                  <div className="absolute left-3 top-3 pointer-events-none">
                                      {getSocialIcon(field.value || platform, platform)}
                                  </div>
                                  <FormControl>
                                      <Input 
                                        {...field} 
                                        className="pl-10" 
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

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('website')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://your-website.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>{t('openingTimes')}</FormLabel>
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
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('saveChanges')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
