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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Loader2, 
  Upload, 
  Trash, 
  Plus, 
  Package, 
  Truck, 
  Camera, 
  CheckCircle2, 
  X,
  Layout
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().min(10, "Description is required"),
  price: z.coerce.number().min(1, "Price must be positive"),
  stock_quantity: z.coerce.number().min(0, "Stock cannot be negative"),
  category_id: z.string().min(1, "Category is required"),
  status: z.enum(["draft", "published"]),
  image_url: z.string().optional(), 
  payment_methods: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  is_deliverable: z.boolean().default(true),
});

const AVAILABLE_BADGES = ["New Arrival", "Best Seller", "In Stock", "Limited Edition"];

const getBadgeLabel = (badge: string, t: any) => {
  const map: Record<string, string> = {
    "New Arrival": "newArrival",
    "Best Seller": "bestSeller",
    "In Stock": "inStock",
    "Limited Edition": "limitedEdition",
  };
  return map[badge] ? t(map[badge]) : badge;
};

const getPaymentLabel = (method: string, t: any) => {
  const map: Record<string, string> = {
    "cash": "cashOnDelivery",
    "card": "creditDebitCard",
    "bank_transfer": "bankTransfer",
  };
  return map[method] ? t(map[method]) : method;
};


export default function ProductEditor() {
  const { t, i18n } = useTranslation();
  const { sellerProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id && id !== 'new';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Gallery State
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);

  // Video Management State
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [activeVideoTab, setActiveVideoTab] = useState<'upload' | 'url'>('upload');
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Fetch product videos
  const { data: videos, refetch: refetchVideos } = useQuery({
    queryKey: ['product-videos', id],
    queryFn: async () => {
      if (!isEditMode) return [];
      const { data, error } = await supabase
        .from('product_videos')
        .select('*')
        .eq('product_id', id)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isEditMode
  });
  
  const handleSaveVideo = async () => {
      if (!isEditMode) {
          toast({ title: "Please save the product first", variant: "destructive" });
          return;
      }
      setIsUploadingVideo(true);
      try {
          let finalVideoUrl = newVideoUrl;
          let videoType = 'external';

          if (activeVideoTab === 'upload' && newVideoFile) {
              const fileExt = newVideoFile.name.split('.').pop();
              const fileName = `vid_${id}_${Date.now()}.${fileExt}`;
              const filePath = `product-videos/${id}/${fileName}`;
              
              const { error: uploadError } = await supabase.storage
                  .from('products') 
                  .upload(filePath, newVideoFile);
              
              if (uploadError) throw uploadError;
              
              const { data } = supabase.storage.from('products').getPublicUrl(filePath);
              finalVideoUrl = data.publicUrl;
              videoType = 'uploaded';
          }

          const { error } = await supabase.from('product_videos').insert({
              product_id: id,
              video_type: videoType,
              video_url: finalVideoUrl,
              is_active: true
          });

          if (error) throw error;
          
          await refetchVideos();
          setShowAddVideo(false);
          setNewVideoFile(null);
          setNewVideoUrl('');
          toast({ title: "Video added successfully" });
      } catch (e: any) {
          console.error(e);
          toast({ title: "Error adding video", description: e.message, variant: "destructive" });
      } finally {
          setIsUploadingVideo(false);
      }
  };
  
  const deleteVideo = async (videoId: string) => {
      const { error } = await supabase.from('product_videos').delete().eq('id', videoId);
      if (error) {
          toast({ title: "Error deleting video", variant: "destructive" });
      } else {
          refetchVideos();
          toast({ title: "Video deleted" });
      }
  };

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id, name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch available seller payment methods
  const { data: availablePaymentMethods } = useQuery({
     queryKey: ['seller-payment-methods', sellerProfile?.id],
     queryFn: async () => {
         return [
            { id: 'cash', name: 'Cash on Delivery' },
            { id: 'card', name: 'Credit/Debit Card' },
            { id: 'bank_transfer', name: 'Bank Transfer' },
         ];
     }
  });

  // Fetch existing product
  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 1,
      category_id: "",
      status: "draft",
      payment_methods: [],
      badges: [],
      colors: [],
      sizes: [],
      materials: [],
      discount: 0,
      is_deliverable: true,
    },
  });

  useEffect(() => {
    if (product) {
       form.reset({
         name: product.name,
         description: product.description || "",
         price: product.price,
         stock_quantity: product.stock_quantity || 0,
         category_id: product.category_id || "",
         status: product.status || "draft",
         image_url: product.image,
         payment_methods: product.preferred_payment_codes || [],
         badges: product.badges || [],
         colors: product.colors || [],
         sizes: product.sizes || [],
         materials: product.materials || [],
         discount: product.discount || 0,
         is_deliverable: product.is_deliverable ?? true,
       });
       setPreviewUrl(product.image);
       const gallery = product.images?.filter((img: string) => img !== product.image) || [];
       setExistingGalleryImages(gallery);
    }
  }, [product, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      let imageUrl = product?.image;
      
      if (heroImage) {
         const fileExt = heroImage.name.split('.').pop();
         const fileName = `${Date.now()}_img.${fileExt}`;
         const filePath = `products/${sellerProfile?.id}/${fileName}`;
         
         const { error: uploadError } = await supabase.storage
           .from('products') 
           .upload(filePath, heroImage);
           
         if (uploadError) throw uploadError;
         
         const { data: { publicUrl } } = supabase.storage
           .from('products')
           .getPublicUrl(filePath);
           
         imageUrl = publicUrl;
      }

      if (!imageUrl) {
        throw new Error("Product image is required");
      }

      const uploadedGalleryUrls: string[] = [];
      for (const file of galleryFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `products/${sellerProfile?.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);
            
          if (uploadError) {
             console.error("Gallery upload error", uploadError);
             continue; 
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
            
          uploadedGalleryUrls.push(publicUrl);
      }

      const allImages = [imageUrl, ...existingGalleryImages, ...uploadedGalleryUrls];
      const uniqueImages = Array.from(new Set(allImages));

      const productData = {
        name: values.name,
        description: values.description,
        price: values.price,
        stock_quantity: values.stock_quantity,
        category_id: values.category_id,
        status: values.status,
        image: imageUrl, 
        images: uniqueImages,
        seller_id: sellerProfile?.id,
        updated_at: new Date().toISOString(),
        preferred_payment_codes: values.payment_methods,
        badges: values.badges,
        colors: values.colors,
        sizes: values.sizes,
        materials: values.materials,
        discount: values.discount,
        is_deliverable: values.is_deliverable
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            ...productData,
            id: crypto.randomUUID(), 
            created_at: new Date().toISOString()
          });
        if (error) throw error;
      }

      toast({
        title: t('success'),
        description: t('productSaved'),
      });
      navigate('/seller/products');
      
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: t('failure'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <h3 className="font-black tracking-tight text-base uppercase">{title}</h3>
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
              onClick={() => navigate('/seller/products')}
            >
              <ArrowLeft className={cn("w-5 h-5", i18n.language === 'ar' && "rotate-180")} />
            </Button>
            <div>
              <h1 className="text-xl font-black tracking-tighter">
                {isEditMode ? t('editProduct') : t('addNewProduct')}
              </h1>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Inventory Item</span>
              </div>
            </div>
          </div>
          <Button 
            form="product-editor-form"
            type="submit" 
            disabled={isSubmitting}
            className="rounded-full px-6 font-black gap-2 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isSubmitting ? (i18n.language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('saveProduct')}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-32">
        <Form {...form}>
          <form id="product-editor-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Visual Header / Hero Image */}
            <Section title={t('productImage')} icon={Upload} description="MAIN VISUAL">
              <div className="relative rounded-[32px] overflow-hidden bg-zinc-100 dark:bg-zinc-900 aspect-video group shadow-inner border border-slate-100 dark:border-zinc-900">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border-4 border-dashed border-zinc-200 dark:border-zinc-800 m-2 rounded-[28px]">
                    <Upload className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('clickToUpload')}</p>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                  <Button 
                    type="button"
                    variant="secondary"
                    className="rounded-full font-black gap-2 h-12 px-6"
                    onClick={() => document.getElementById('hero-image-upload')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {previewUrl ? (i18n.language === 'ar' ? 'تغيير الصورة' : 'Change Image') : (i18n.language === 'ar' ? 'رفع صورة' : 'Upload Image')}
                  </Button>
                </div>
                
                <input id="hero-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              {!previewUrl && <p className="text-xs text-destructive font-bold text-center uppercase tracking-widest">{t('imageRequired')}</p>}
            </Section>

            {/* Basic Information */}
            <Section title={t('basicInfo')} icon={Package} description="CORE DETAILS">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('productName')}</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 focus:ring-primary text-base font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('priceSDG')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" {...field} className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 focus:ring-primary text-base font-bold pr-16" />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground">SDG</div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('stock')}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 focus:ring-primary text-base font-bold" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('category')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 font-bold">
                            <SelectValue placeholder={t('selectCategory')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          {categories?.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id} className="font-bold py-3">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 font-bold">
                            <SelectValue placeholder={t('selectStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="draft" className="font-bold py-3">{t('draft')}</SelectItem>
                          <SelectItem value="published" className="font-bold py-3">{t('published')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('productDescription')}</FormLabel>
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
            </Section>

            {/* Logistics & Offers */}
            <Section title={t('logistics')} icon={Truck} description="FULFILLMENT & PROMOS">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="is_deliverable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-slate-100 dark:border-zinc-900 p-6 bg-slate-50/50 dark:bg-zinc-900/30">
                      <div className="space-y-0.5">
                        <FormLabel className="font-black text-sm uppercase tracking-tight">{t('isDeliverable')}</FormLabel>
                        <FormDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {t('deliverableDescription')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('discountPercentage')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" min="0" max="100" {...field} className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 focus:ring-primary text-base font-bold pr-12" />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">%</div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="payment_methods"
                render={() => (
                  <FormItem>
                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4 block">{t('preferredPaymentMethods')}</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      {availablePaymentMethods?.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="payment_methods"
                          render={({ field }) => (
                            <label className={cn(
                              "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                              field.value?.includes(item.id) 
                                ? "border-primary bg-primary/5 shadow-sm" 
                                : "border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-slate-200 dark:hover:border-zinc-800"
                            )}>
                              <Checkbox
                                className="hidden"
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(field.value?.filter((value) => value !== item.id))
                                }}
                              />
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                field.value?.includes(item.id) ? "border-primary bg-primary" : "border-slate-300 dark:border-zinc-700"
                              )}>
                                {field.value?.includes(item.id) && <Plus className="w-3 h-3 text-white rotate-45 scale-125" />}
                              </div>
                              <span className={cn(
                                "text-sm font-black uppercase tracking-tight",
                                field.value?.includes(item.id) ? "text-primary" : "text-muted-foreground"
                              )}>{getPaymentLabel(item.id, t)}</span>
                            </label>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </Section>

            {/* Media Gallery */}
            <Section title={t('mediaGallery')} icon={Camera} description="ADDITIONAL ASSETS">
              <div className="space-y-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {existingGalleryImages.map((url, index) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={`existing-${index}`} 
                        className="relative aspect-square rounded-[24px] overflow-hidden border border-slate-200 dark:border-zinc-800 group shadow-sm"
                      >
                        <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setExistingGalleryImages(prev => prev.filter((_, i) => i !== index))}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {galleryFiles.map((file, index) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={`new-${index}`} 
                        className="relative aspect-square rounded-[24px] overflow-hidden border border-slate-200 dark:border-zinc-800 group shadow-sm"
                      >
                        <img src={URL.createObjectURL(file)} alt={`New ${index}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setGalleryFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div 
                    className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all hover:border-primary group"
                    onClick={() => document.getElementById('gallery-upload')?.click()}
                  >
                    <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-black uppercase text-muted-foreground mt-2 group-hover:text-primary">{t('add')}</span>
                    <input id="gallery-upload" type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                      if (e.target.files) setGalleryFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }} />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-zinc-900">
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4 block">{t('productVideos')}</FormLabel>
                  <div className="space-y-4">
                     {videos?.map((video: any) => (
                       <div key={video.id} className="relative flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-sm group">
                          <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-zinc-800">
                             {video.video_type === 'uploaded' ? (
                               <video src={video.video_url} className="w-full h-full object-cover" /> 
                             ) : (
                               <Layout className="w-6 h-6 text-muted-foreground" />
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <p className="text-sm font-black uppercase tracking-tight truncate">{video.caption || 'Product Reel'}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{video.video_type}</p>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteVideo(video.id)}>
                            <Trash className="w-4 h-4" />
                          </Button>
                       </div>
                     ))}

                     {!showAddVideo ? (
                        <Button type="button" variant="outline" onClick={() => setShowAddVideo(true)} className="w-full h-14 rounded-2xl border-dashed border-2 font-black uppercase tracking-widest text-xs gap-2">
                          <Plus className="w-4 h-4" />
                          {t('addVideo')}
                        </Button>
                     ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 bg-slate-50/50 dark:bg-zinc-900/30">
                           <div className="flex items-center gap-2 p-1 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl w-fit">
                              <Button type="button" variant={activeVideoTab === 'upload' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveVideoTab('upload')} className="rounded-xl px-4 font-bold">
                                {t('uploadFile')}
                              </Button>
                              <Button type="button" variant={activeVideoTab === 'url' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveVideoTab('url')} className="rounded-xl px-4 font-bold">
                                {t('externalUrl')}
                              </Button>
                           </div>
                           
                           {activeVideoTab === 'upload' ? (
                               <div className="border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all"
                                    onClick={() => document.getElementById('new-video-upload')?.click()}>
                                  {newVideoFile ? (
                                     <div className="text-center">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-tight">{newVideoFile.name}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Click to change</p>
                                     </div>
                                  ) : (
                                     <>
                                       <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">MP4 / WEBM (MAX 50MB)</p>
                                     </>
                                  )}
                                  <input id="new-video-upload" type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && setNewVideoFile(e.target.files[0])} />
                               </div>
                           ) : (
                               <Input placeholder={t('enterVideoUrl')} value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} className="h-14 rounded-2xl font-bold" />
                           )}
                           
                           <div className="flex gap-2 justify-end">
                              <Button type="button" variant="ghost" className="rounded-full font-bold" onClick={() => setShowAddVideo(false)}>{t('cancel')}</Button>
                              <Button type="button" className="rounded-full font-black px-6 gap-2 shadow-lg shadow-primary/20" onClick={handleSaveVideo} disabled={isUploadingVideo || (!newVideoFile && activeVideoTab === 'upload') || (!newVideoUrl && activeVideoTab === 'url')}>
                                {isUploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {t('addVideo')}
                              </Button>
                           </div>
                        </motion.div>
                     )}
                  </div>
                </div>
              </div>
            </Section>

            {/* Variations & Badges */}
            <Section title={t('variations')} icon={Layout} description="COLORS, SIZES & TAGS">
              <div className="space-y-8">
                <div>
                   <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4 block">{t('colors')}</FormLabel>
                   <div className="flex flex-wrap gap-3">
                      <AnimatePresence>
                        {(form.watch('colors') || []).map((color, index) => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            key={index} 
                            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1.5 rounded-full pl-3 shadow-sm group"
                          >
                            <div className="w-5 h-5 rounded-full border border-slate-200 dark:border-zinc-800" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{color}</span>
                            <button
                              type="button"
                              className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-destructive hover:text-white transition-colors text-muted-foreground"
                              onClick={() => {
                                const newColors = [...(form.getValues('colors') || [])];
                                newColors.splice(index, 1);
                                form.setValue('colors', newColors);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div className="relative group/picker">
                          <input 
                              type="color" 
                              className="w-10 h-10 p-1 rounded-2xl cursor-pointer bg-white dark:bg-zinc-950 border-2 border-slate-200 dark:border-zinc-800 transition-all hover:scale-110 active:scale-95 shadow-sm"
                              onChange={(e) => {
                                  const newColor = e.target.value;
                                  const current = form.getValues('colors') || [];
                                  if (!current.includes(newColor)) {
                                      form.setValue('colors', [...current, newColor]);
                                  }
                              }}
                          />
                          <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 opacity-0 group-hover/picker:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-[8px] font-black uppercase text-primary whitespace-nowrap tracking-tighter">ADD COLOR</span>
                          </div>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-zinc-900">
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4 block">{t('sizes')}</FormLabel>
                   <AnimatePresence>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(form.watch('sizes') || []).map((size, index) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          key={index} 
                          className="flex items-center gap-2 bg-primary/5 text-primary border border-primary/20 px-4 py-2 rounded-2xl shadow-sm"
                        >
                          <span className="text-xs font-black uppercase tracking-tight">{size}</span>
                          <button
                            type="button"
                            className="bg-primary/10 rounded-full h-4 w-4 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                            onClick={() => {
                              const newSizes = [...(form.getValues('sizes') || [])];
                              newSizes.splice(index, 1);
                              form.setValue('sizes', newSizes);
                            }}
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                  
                  <FormField
                    control={form.control}
                    name="sizes"
                    render={({ field }) => (
                      <div className="flex gap-2">
                        <Input 
                          id="new-size-input"
                          placeholder="e.g. XL" 
                          className="w-32 h-14 rounded-2xl font-bold text-base"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val && !field.value?.includes(val)) {
                                field.onChange([...(field.value || []), val]);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="h-14 rounded-2xl px-6 font-black gap-2"
                          onClick={() => {
                            const input = document.getElementById('new-size-input') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !field.value?.includes(val)) {
                              field.onChange([...(field.value || []), val]);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          {t('add')}
                        </Button>
                      </div>
                    )}
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-zinc-900">
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4 block">{t('materials')}</FormLabel>
                   <AnimatePresence>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(form.watch('materials') || []).map((material, index) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          key={index} 
                          className="flex items-center gap-2 bg-indigo-500/5 text-indigo-600 border border-indigo-500/20 px-4 py-2 rounded-2xl shadow-sm"
                        >
                          <span className="text-xs font-black uppercase tracking-tight">{material}</span>
                          <button
                            type="button"
                            className="bg-indigo-500/10 rounded-full h-4 w-4 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all"
                            onClick={() => {
                              const newMaterials = [...(form.getValues('materials') || [])];
                              newMaterials.splice(index, 1);
                              form.setValue('materials', newMaterials);
                            }}
                          >
                            <X className="w-2 h-2" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                  
                  <FormField
                    control={form.control}
                    name="materials"
                    render={({ field }) => (
                      <div className="flex gap-2">
                        <Input 
                          id="new-material-input"
                          placeholder="e.g. Cotton" 
                          className="w-full h-14 rounded-2xl font-bold text-base"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val && !field.value?.includes(val)) {
                                field.onChange([...(field.value || []), val]);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="h-14 rounded-2xl px-6 font-black gap-2 whitespace-nowrap"
                          onClick={() => {
                            const input = document.getElementById('new-material-input') as HTMLInputElement;
                            const val = input.value.trim();
                            if (val && !field.value?.includes(val)) {
                              field.onChange([...(field.value || []), val]);
                              input.value = '';
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          {t('add')}
                        </Button>
                      </div>
                    )}
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-zinc-900">
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4 block">{t('productBadges')}</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    {AVAILABLE_BADGES.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="badges"
                        render={({ field }) => (
                          <label className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                            field.value?.includes(item) 
                              ? "border-emerald-500 bg-emerald-500/5 shadow-sm" 
                              : "border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-slate-200 dark:hover:border-zinc-800"
                          )}>
                            <Checkbox
                              className="hidden"
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item])
                                  : field.onChange(field.value?.filter((value) => value !== item))
                              }}
                            />
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              field.value?.includes(item) ? "border-emerald-500 bg-emerald-500" : "border-slate-300 dark:border-zinc-700"
                            )}>
                              {field.value?.includes(item) && <Plus className="w-3 h-3 text-white rotate-45 scale-125" />}
                            </div>
                            <span className={cn(
                              "text-xs font-black uppercase tracking-widest",
                              field.value?.includes(item) ? "text-emerald-600" : "text-muted-foreground"
                            )}>{getBadgeLabel(item, t)}</span>
                          </label>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <div className="p-8 bg-zinc-950 rounded-[40px] text-white overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <Package className="w-32 h-32" />
               </div>
               <div className="relative z-10 space-y-4">
                  <h4 className="text-2xl font-black tracking-tighter leading-none italic uppercase">Almost Ready?</h4>
                  <p className="text-zinc-400 text-sm font-medium max-w-xs">Double check your inventory and pricing. Once published, your product will be live for customers across Khartoum.</p>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-16 rounded-2xl bg-white hover:bg-zinc-100 text-black font-black text-lg gap-3 transition-transform active:scale-95 shadow-2xl"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layout className="w-5 h-5" />}
                    {isSubmitting ? (i18n.language === 'ar' ? 'جاري الحفظ...' : 'Saving Product...') : t('saveProduct')}
                  </Button>
               </div>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}
