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
import { ArrowLeft, Loader2, Upload, Trash, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

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
  const { t } = useTranslation();
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

  // ... (Video Management State) ...
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
              
              // Upload to 'products' bucket
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
         // This assumes we have a table or hardcoded list. 
         // For now let's use the hardcoded list but filtered by what the seller has enabled if we enforce that.
         // Or just allow all standard ones.
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
       
       // Load gallery (exclude main image to avoid duplication in UI if strictly separation is desired, 
       // but typically 'images' is the collection. 
       // Let's assume we want to show 'Additional Images' in the gallery section.
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
      
      // Upload image
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

      // Upload Gallery Images
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
             continue; // Skip failed uploads but try to save product
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
            
          uploadedGalleryUrls.push(publicUrl);
      }

      // Combine all images: Main Image + Existing Gallery + New GalleryUrl
      // We ensure the main 'image' is always first or present.
      const allImages = [imageUrl, ...existingGalleryImages, ...uploadedGalleryUrls];
      const uniqueImages = Array.from(new Set(allImages));

      const productData = {
        name: values.name,
        description: values.description,
        price: values.price,
        stock_quantity: values.stock_quantity,
        category_id: values.category_id,
        status: values.status,
        image: imageUrl, // Update main image
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
        // Insert new
        const { error } = await supabase
          .from('products')
          .insert({
            ...productData,
            id: crypto.randomUUID(), // Manual UUID gen if DB doesn't auto-gen for text id? schema says text id from data file, let's use UUID
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

  return (
    <div className="container p-4 pb-24 mx-auto max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/seller/products')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? t('editProduct') : t('addNewProduct')}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Image Upload */}
          <div className="space-y-2">
            <FormLabel>{t('productImage')}</FormLabel>
            <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors relative overflow-hidden"
                 onClick={() => document.getElementById('hero-image-upload')?.click()}>
              
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('clickToUpload')}</p>
                </div>
              )}
              <input 
                id="hero-image-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
            {!previewUrl && <p className="text-xs text-destructive">{t('imageRequired')}</p>}
          </div>

          {/* Gallery Images */}
          <div className="space-y-2">
            <FormLabel>{t('additionalImages')}</FormLabel>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Existing Images */}
              {existingGalleryImages.map((url, index) => (
                <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
                  <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setExistingGalleryImages(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              
              {/* New Files */}
              {galleryFiles.map((file, index) => (
                <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
                  <img src={URL.createObjectURL(file)} alt={`New ${index}`} className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setGalleryFiles(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              ))}

              {/* Add Button */}
              <div className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                   onClick={() => document.getElementById('gallery-upload')?.click()}>
                <Plus className="w-6 h-6 text-muted-foreground" />
                <input
                  id="gallery-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setGalleryFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Product Videos Management */}
          <div className="space-y-4">
             <FormLabel className="text-base">{t('productVideos')}</FormLabel>
             
             {/* List existing videos */}
             <div className="grid gap-4">
               {videos?.map((video: any) => (
                 <div key={video.id} className="relative flex items-center gap-4 p-3 border rounded-xl bg-card">
                    <div className="w-24 h-16 bg-black/10 rounded-lg flex items-center justify-center overflow-hidden">
                       {video.video_type === 'uploaded' ? (
                         <video src={video.video_url} className="w-full h-full object-cover" /> 
                       ) : (
                         <div className="text-xs text-center p-1 break-all">{video.video_url}</div>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.caption || 'No Caption'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{video.video_type}</p>
                    </div>
                    <Button
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive"
                      onClick={async () => {
                        await deleteVideo(video.id);
                      }}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                 </div>
               ))}
             </div>

             {/* Add New Video */}
             {!showAddVideo ? (
                <Button type="button" variant="outline" onClick={() => setShowAddVideo(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('addVideo')}
                </Button>
             ) : (
                <div className="border rounded-xl p-4 space-y-4 bg-muted/30">
                   <div className="flex items-center gap-4 mb-2">
                      <Button 
                        type="button"
                        variant={activeVideoTab === 'upload' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setActiveVideoTab('upload')}
                      >
                        {t('uploadFile')}
                      </Button>
                      <Button 
                        type="button"
                        variant={activeVideoTab === 'url' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setActiveVideoTab('url')}
                      >
                        {t('externalUrl')}
                      </Button>
                   </div>
                   
                   {activeVideoTab === 'upload' ? (
                       <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-card hover:bg-accent/50 transition-colors"
                            onClick={() => document.getElementById('new-video-upload')?.click()}>
                          {newVideoFile ? (
                             <div className="text-center">
                                <p className="text-sm font-medium text-green-600">{newVideoFile.name}</p>
                                <p className="text-xs text-muted-foreground text-center mt-1">Click to change</p>
                             </div>
                          ) : (
                             <>
                               <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                               <p className="text-xs text-muted-foreground">Select video file (MP4, WebM)</p>
                             </>
                          )}
                          <input 
                            id="new-video-upload" 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            onChange={(e) => e.target.files?.[0] && setNewVideoFile(e.target.files[0])}
                          />
                       </div>
                   ) : (
                       <Input 
                         placeholder={t('enterVideoUrl')}
                         value={newVideoUrl}
                         onChange={(e) => setNewVideoUrl(e.target.value)}
                       />
                   )}
                   
                   <div className="flex gap-2 justify-end">
                      <Button type="button" variant="ghost" onClick={() => setShowAddVideo(false)}>{t('cancel')}</Button>
                      <Button 
                        type="button" 
                        onClick={handleSaveVideo}
                        disabled={isUploadingVideo || (!newVideoFile && activeVideoTab === 'upload') || (!newVideoUrl && activeVideoTab === 'url')}
                      >
                        {isUploadingVideo && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {t('addVideo')}
                      </Button>
                   </div>
                </div>
             )}
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('productName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('productName')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('priceSDG')}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="stock_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('stock')}</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



          <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('status')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{t('draft')}</SelectItem>
                      <SelectItem value="published">{t('published')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="is_deliverable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t('isDeliverable')}</FormLabel>
                  <FormDescription>
                    {t('deliverableDescription')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('discountPercentage')}</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="colors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('colors')}</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {(field.value || []).map((color, index) => (
                      <div key={index} className="flex items-center gap-1 bg-muted p-1 rounded-full pl-2">
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
                        <span className="text-xs">{color}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-full"
                          onClick={() => {
                            const newColors = [...(field.value || [])];
                            newColors.splice(index, 1);
                            field.onChange(newColors);
                          }}
                        >
                          <Trash className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <Input 
                            type="color" 
                            className="w-10 h-10 p-1 rounded-md cursor-pointer"
                            onChange={(e) => {
                                const newColor = e.target.value;
                                if (!field.value?.includes(newColor)) {
                                    field.onChange([...(field.value || []), newColor]);
                                }
                            }}
                        />
                        <span className="text-xs text-muted-foreground">{t('pickColor')}</span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="badges"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">{t('productBadges')}</FormLabel>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_BADGES.map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="badges"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {getBadgeLabel(item, t)}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sizes */}
          <FormField
            control={form.control}
            name="sizes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('sizes')}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {(field.value || []).map((size, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                      <span className="text-sm">{size}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                        onClick={() => {
                          const newSizes = [...(field.value || [])];
                          newSizes.splice(index, 1);
                          field.onChange(newSizes);
                        }}
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      placeholder={t('enterSize')}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const newSize = input.value.trim();
                          if (newSize && !field.value?.includes(newSize)) {
                            field.onChange([...(field.value || []), newSize]);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const newSize = input?.value.trim();
                        if (newSize && !field.value?.includes(newSize)) {
                          field.onChange([...(field.value || []), newSize]);
                          input.value = '';
                        }
                      }}
                    >
                      {t('addSize')}
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Materials */}
          <FormField
            control={form.control}
            name="materials"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('materials')}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {(field.value || []).map((material, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                      <span className="text-sm capitalize">{material}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full"
                        onClick={() => {
                          const newMaterials = [...(field.value || [])];
                          newMaterials.splice(index, 1);
                          field.onChange(newMaterials);
                        }}
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 flex-1">
                    <Input 
                      placeholder={t('enterMaterial')}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const newMaterial = input.value.trim();
                          if (newMaterial && !field.value?.includes(newMaterial)) {
                            field.onChange([...(field.value || []), newMaterial]);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const newMaterial = input?.value.trim();
                        if (newMaterial && !field.value?.includes(newMaterial)) {
                          field.onChange([...(field.value || []), newMaterial]);
                          input.value = '';
                        }
                      }}
                    >
                      {t('addMaterial')}
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('categories')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('description')}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t('productDetails')} className="h-32" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_methods"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">{t('acceptedPaymentMethods')}</FormLabel>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {['cash', 'card', 'bank_transfer'].map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="payment_methods"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), item])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {getPaymentLabel(item, t)}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('saveProduct')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
