import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon, Upload, ArrowLeft, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function CreateOffer() {
  const { t } = useTranslation();
  const { sellerProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [offerName, setOfferName] = useState("");
  const [selectedOfferType, setSelectedOfferType] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newOfferTypeName, setNewOfferTypeName] = useState("");
  const [isCreatingTypeLoading, setIsCreatingTypeLoading] = useState(false);

  // Fetch Offer Categories
  const { data: offerCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['offer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('offer_categories').select('*');
      if (error) { 
          console.warn(error); 
          return [
              { id: 'flash', name: 'Flash Sale' },
              { id: 'winter', name: 'Winter Sale' },
              { id: 'eid', name: 'Eid Offer' }
          ];
      }
      return data;
    }
  });

  // Fetch Seller Products
  const { data: products } = useQuery({
    queryKey: ['seller-products-simple', sellerProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image, offer_type')
        .eq('seller_id', sellerProfile?.id)
        .eq('status', 'published');
      if (error) throw error;
      return data;
    },
    enabled: !!sellerProfile?.id
  });

  const handleCreateType = async () => {
    if (!newOfferTypeName.trim()) return;
    setIsCreatingTypeLoading(true);
    try {
        const id = newOfferTypeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Check if exists
        const exists = offerCategories?.find((c: any) => c.id === id);
        if (exists) {
            setSelectedOfferType(id);
            setIsCreatingType(false);
            setNewOfferTypeName("");
            return;
        }

        const { error } = await supabase.from('offer_categories').insert({
            id: id,
            name: newOfferTypeName.trim()
        });
        
        if (error) throw error;
        
        await refetchCategories();
        setSelectedOfferType(id);
        setIsCreatingType(false);
        setNewOfferTypeName("");
        toast({ title: t('success') });
    } catch (e: any) {
        toast({ title: t('error'), description: e.message, variant: 'destructive' });
    } finally {
        setIsCreatingTypeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!offerName || !selectedOfferType || !expiryDate || selectedProducts.length === 0) {
          toast({ title: t('pleaseFillFields'), variant: "destructive" });
          return;
      }
      setIsSubmitting(true);
      try {
          let posterUrl = null;
          
          // Upload Poster
          if (posterFile) {
             const fileExt = posterFile.name.split('.').pop();
             const fileName = `offer_${sellerProfile?.id}_${Date.now()}.${fileExt}`;
             const filePath = `offer-posters/${fileName}`;
             
             // Using 'products' bucket as fallback if 'offer-posters' doesn't exist
             // Ideally we should have a public bucket. 
             const { error: uploadError } = await supabase.storage
               .from('products') 
               .upload(filePath, posterFile);

             if (uploadError) throw uploadError;
             
             const { data } = supabase.storage.from('products').getPublicUrl(filePath);
             posterUrl = data.publicUrl;
          }

          // Create Seller Offer Record (if table exists)
          // We try to insert, if fails (table missing), we proceed to update products
          const { error: offerError } = await supabase.from('seller_offers').insert({
              seller_id: sellerProfile?.id,
              name: offerName,
              offer_type: selectedOfferType,
              poster_url: posterUrl,
              ends_at: expiryDate.toISOString()
          });
          
          if (offerError) {
              console.warn("Could not create seller_offer record, proceeding with product update", offerError);
          }

          // Update selected products
          const { error } = await supabase
             .from('products')
             .update({
                 offer_type: selectedOfferType,
                 offer_expiry: expiryDate.toISOString()
             })
             .in('id', selectedProducts);
          
          if (error) throw error;
          
          toast({ title: t('offerCreated'), description: `${selectedProducts.length} ${t('productsUpdated')}` });
          
          // Clear and Redirect
          queryClient.invalidateQueries({ queryKey: ['seller-products-simple'] });
          navigate('/seller/dashboard'); // Back to dashboard

      } catch (error: any) {
          toast({ title: t('error'), description: error.message, variant: "destructive" });
      } finally {
          setIsSubmitting(false);
      }
  };

  const toggleProduct = (productId: string) => {
      setSelectedProducts(prev => 
          prev.includes(productId) 
            ? prev.filter(id => id !== productId) 
            : [...prev, productId]
      );
  };
  
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const url = URL.createObjectURL(file);
      setPosterPreview(url);
    }
  };

  return (
    <div className="container p-4 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('createOffer')}</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Offer Name */}
          <div className="space-y-2">
              <Label>{t('offerName')}</Label>
              <Input 
                placeholder={t('offerNamePlaceholder')}
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
              />
          </div>

          {/* Poster Upload */}
          <div className="space-y-2">
             <Label>{t('offerPoster')}</Label>
             <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[150px] cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors relative overflow-hidden"
                  onClick={() => document.getElementById('poster-upload')?.click()}>
                {posterPreview ? (
                    <img src={posterPreview} alt="Poster" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-4">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{t('clickToUploadPoster')}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('recommendedSize')}</p>
                    </div>
                )}
                <input 
                    id="poster-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePosterChange}
                />
             </div>
          </div>

          {/* Offer Type */}
          <div className="space-y-2">
              <div className="flex items-center justify-between">
                  <Label>{t('offerType')}</Label>
                  {!isCreatingType && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingType(true)} className="h-6 text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          {t('createNewType')}
                      </Button>
                  )}
              </div>
              
              {isCreatingType ? (
                  <div className="flex gap-2">
                      <Input 
                        placeholder={t('newOfferTypePlaceholder')}
                        value={newOfferTypeName}
                        onChange={(e) => setNewOfferTypeName(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" size="sm" onClick={handleCreateType} disabled={isCreatingTypeLoading}>
                          {isCreatingTypeLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {t('create')}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsCreatingType(false)}>
                          <X className="w-4 h-4" />
                      </Button>
                  </div>
              ) : (
                  <Select onValueChange={setSelectedOfferType} value={selectedOfferType}>
                      <SelectTrigger>
                          <SelectValue placeholder={t('selectOfferType')} />
                      </SelectTrigger>
                      <SelectContent>
                          {offerCategories?.map((offer: any) => (
                              <SelectItem key={offer.id} value={offer.id}>
                                  {offer.name || offer.id}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
              <Label>{t('offerExpiry')}</Label>
              <Popover>
                  <PopoverTrigger asChild>
                      <Button
                          variant={"outline"}
                          className={cn(
                              "w-full justify-start text-left font-normal",
                              !expiryDate && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expiryDate ? format(expiryDate, "PPP") : <span>{t('pickDate')}</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar
                          mode="single"
                          selected={expiryDate}
                          onSelect={setExpiryDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                      />
                  </PopoverContent>
              </Popover>
          </div>

          {/* Products Selection */}
          <div className="space-y-2">
              <Label>{t('selectProducts')}</Label>
              <div className="border rounded-xl p-4 max-h-96 overflow-y-auto space-y-2">
                  {products?.map((product) => (
                      <div key={product.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg">
                          <Checkbox 
                              id={`p-${product.id}`} 
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                              <img src={product.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                              <Label htmlFor={`p-${product.id}`} className="font-medium cursor-pointer">
                                  {product.name}
                              </Label>
                              <div className="text-xs text-muted-foreground">
                                  {product.price} SDG 
                                  {product.offer_type && <span className="text-orange-500 ml-2">({product.offer_type})</span>}
                              </div>
                          </div>
                      </div>
                  ))}
                  {products?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t('noPublishedProductsFound')}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                  {t('selected')}: {selectedProducts.length}
              </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('createOfferBtn')}
          </Button>
      </form>
    </div>
  );
}
