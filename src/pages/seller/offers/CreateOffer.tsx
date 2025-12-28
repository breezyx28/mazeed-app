import { useCallback, useMemo, useState } from "react";
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
import {
  Loader2,
  CalendarIcon,
  Upload,
  ArrowLeft,
  Plus,
  X,
  ShoppingBag,
  Tag,
  Calendar as CalendarLucide,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
        <h3 className="font-black tracking-tight text-base uppercase">
          {title}
        </h3>
        {description && (
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
    <div className="p-8 space-y-6">{children}</div>
  </motion.div>
);

export default function CreateOffer() {
  const { t, i18n } = useTranslation();
  const { sellerProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const minSelectableDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const disablePastDates = useCallback(
    (date: Date) => date < minSelectableDate,
    [minSelectableDate]
  );

  const [offerName, setOfferName] = useState("");
  const [selectedOfferType, setSelectedOfferType] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newOfferTypeName, setNewOfferTypeName] = useState("");
  const [newOfferTypeNameAr, setNewOfferTypeNameAr] = useState("");
  const [isCreatingTypeLoading, setIsCreatingTypeLoading] = useState(false);

  // Fetch Offer Categories
  const { data: offerCategories, refetch: refetchCategories } = useQuery({
    queryKey: ["offer-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_categories")
        .select("*");
      if (error) {
        console.warn(error);
        return [
          { id: "flash", name: "Flash Sale" },
          { id: "winter", name: "Winter Sale" },
          { id: "eid", name: "Eid Offer" },
        ];
      }
      return data;
    },
  });

  // Fetch Seller Products
  const { data: products } = useQuery({
    queryKey: ["seller-products-simple", sellerProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image, offer_type")
        .eq("seller_id", sellerProfile?.id)
        .eq("status", "published");
      if (error) throw error;
      return data;
    },
    enabled: !!sellerProfile?.id,
  });

  const handleCreateType = async () => {
    if (!newOfferTypeName.trim()) return;
    setIsCreatingTypeLoading(true);
    try {
      const id = newOfferTypeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const exists = offerCategories?.find((c: any) => c.id === id);
      if (exists) {
        setSelectedOfferType(id);
        setIsCreatingType(false);
        setNewOfferTypeName("");
        setNewOfferTypeNameAr("");
        return;
      }

      const { error } = await supabase.from("offer_categories").insert({
        id: id,
        name: newOfferTypeName.trim(),
        name_ar: newOfferTypeNameAr.trim() || newOfferTypeName.trim(),
      });

      if (error) throw error;

      await refetchCategories();
      setSelectedOfferType(id);
      setIsCreatingType(false);
      setNewOfferTypeName("");
      setNewOfferTypeNameAr("");
      toast({ title: t("success") });
    } catch (e: any) {
      toast({
        title: t("error"),
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingTypeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !offerName ||
      !selectedOfferType ||
      !expiryDate ||
      selectedProducts.length === 0
    ) {
      toast({ title: t("pleaseFillFields"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      let posterUrl = null;

      if (posterFile) {
        const fileExt = posterFile.name.split(".").pop();
        const fileName = `offer_${sellerProfile?.id}_${Date.now()}.${fileExt}`;
        const filePath = `offer-posters/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, posterFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);
        posterUrl = data.publicUrl;
      }

      const { error: offerError } = await supabase
        .from("seller_offers")
        .insert({
          seller_id: sellerProfile?.id,
          name: offerName,
          offer_type: selectedOfferType,
          poster_url: posterUrl,
          ends_at: expiryDate.toISOString(),
        });

      if (offerError) {
        console.warn(
          "Could not create seller_offer record, proceeding with product update",
          offerError
        );
      }

      const { error } = await supabase
        .from("products")
        .update({
          offer_type: selectedOfferType,
          offer_expiry: expiryDate.toISOString(),
        })
        .in("id", selectedProducts);

      if (error) throw error;

      toast({
        title: t("offerCreated"),
        description: `${selectedProducts.length} ${t("productsUpdated")}`,
      });

      queryClient.invalidateQueries({ queryKey: ["seller-products-simple"] });
      navigate("/seller/dashboard");
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
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
              <ArrowLeft
                className={cn(
                  "w-5 h-5",
                  i18n.language === "ar" && "rotate-180"
                )}
              />
            </Button>
            <div>
              <h1 className="text-xl font-black tracking-tighter">
                {t("createOffer")}
              </h1>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                  Promotion Campaign
                </span>
              </div>
            </div>
          </div>
          <Button
            form="offer-form"
            type="submit"
            disabled={isSubmitting}
            className="rounded-full px-6 font-black gap-2 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isSubmitting
              ? i18n.language === "ar"
                ? "جاري الإنشاء..."
                : "Creating..."
              : t("createOfferBtn")}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-32">
        <form id="offer-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Main Identity */}
          <Section
            title={t("offerDetails")}
            icon={Tag}
            description="CAMPAIGN IDENTITY"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                  {t("offerName")}
                </Label>
                <Input
                  placeholder={t("offerNamePlaceholder")}
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 focus:ring-primary text-lg font-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Offer Type */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                      {t("offerType")}
                    </Label>
                    {!isCreatingType && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreatingType(true)}
                        className="h-6 text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 rounded-full px-3"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {t("createNewType")}
                      </Button>
                    )}
                  </div>

                  {isCreatingType ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-2"
                    >
                      <Input
                        placeholder={t("newOfferTypePlaceholder")}
                        value={newOfferTypeName}
                        onChange={(e) => setNewOfferTypeName(e.target.value)}
                        className="h-14 rounded-2xl font-bold"
                      />
                      <Input
                        placeholder={t("newOfferTypePlaceholderAr")}
                        value={newOfferTypeNameAr}
                        onChange={(e) => setNewOfferTypeNameAr(e.target.value)}
                        className="h-14 rounded-2xl font-bold"
                        dir="rtl"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="h-14 rounded-2xl px-6 flex-1"
                          onClick={handleCreateType}
                          disabled={isCreatingTypeLoading}
                        >
                          {isCreatingTypeLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-14 rounded-2xl px-4"
                          onClick={() => {
                            setIsCreatingType(false);
                            setNewOfferTypeName("");
                            setNewOfferTypeNameAr("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <Select
                      onValueChange={setSelectedOfferType}
                      value={selectedOfferType}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-slate-200 dark:border-zinc-800 font-bold">
                        <SelectValue placeholder={t("selectOfferType")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {offerCategories
                          ?.filter(
                            (offer: any) =>
                              offer?.id &&
                              typeof offer.id === "string" &&
                              offer.id.trim() !== ""
                          )
                          .map((offer: any) => (
                            <SelectItem
                              key={offer.id}
                              value={offer.id}
                              className="font-bold py-3"
                            >
                              {offer.name || offer.id}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Expiry Date */}
                <div className="space-y-4">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                    {t("offerExpiry")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-14 rounded-2xl justify-start text-left font-bold border-slate-200 dark:border-zinc-800",
                          !expiryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarLucide className="mr-2 h-4 w-4 text-primary" />
                        {expiryDate ? (
                          format(expiryDate, "PPP")
                        ) : (
                          <span>{t("pickDate")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-[32px] border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        disabled={disablePastDates}
                        className="font-bold"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </Section>

          {/* Banner / Poster */}
          <Section
            title={t("offerPoster")}
            icon={ImageIcon}
            description="CAMPAIGN VISUAL"
          >
            <div
              className="relative rounded-[32px] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-slate-200 dark:border-zinc-800 aspect-[21/9] group cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-zinc-950 hover:border-primary"
              onClick={() => document.getElementById("poster-upload")?.click()}
            >
              {posterPreview ? (
                <img
                  src={posterPreview}
                  alt="Poster"
                  className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-white dark:bg-zinc-800 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">
                      {t("clickToUploadPoster")}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      Recommended: 1200x500px
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <div className="bg-white text-black px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl">
                  Change Banner
                </div>
              </div>

              <input
                id="poster-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePosterChange}
              />
            </div>
          </Section>

          {/* Product Selection */}
          <Section
            title={t("selectProducts")}
            icon={ShoppingBag}
            description="CAMPAIGN INVENTORY"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {selectedProducts.length} {t("selected")}
                </span>
                {selectedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProducts([])}
                    className="text-[10px] font-black uppercase tracking-widest text-destructive hover:underline"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products?.map((product) => (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex items-center gap-4 p-4 rounded-3xl border-2 transition-all cursor-pointer group",
                      selectedProducts.includes(product.id)
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-slate-200 dark:hover:border-zinc-800 shadow-sm"
                    )}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-900 shadow-sm">
                      <img
                        src={product.image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      {selectedProducts.includes(product.id) && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-black uppercase tracking-tight truncate",
                          selectedProducts.includes(product.id)
                            ? "text-primary"
                            : "text-black dark:text-white"
                        )}
                      >
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-muted-foreground">
                          {product.price} SDG
                        </span>
                        {product.offer_type && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[8px] font-black uppercase tracking-tighter">
                            {product.offer_type}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* <Checkbox
                      id={`p-${product.id}`}
                      className="hidden"
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    /> */}
                  </motion.div>
                ))}

                {products?.length === 0 && (
                  <div className="col-span-full py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mx-auto opacity-50">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      {t("noPublishedProductsFound")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Final Action */}
          <div className="p-10 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-[48px] text-white relative overflow-hidden shadow-2xl group">
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:-rotate-12 transition-transform duration-1000">
              <Sparkles className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h4 className="text-4xl font-black italic uppercase tracking-tighter leading-tight">
                  Flash Sale or Seasonal?
                </h4>
                <p className="text-white/70 font-bold uppercase tracking-widest text-[10px]">
                  Prepare your store for the next big wave of customers.
                </p>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-20 rounded-[32px] bg-white hover:bg-zinc-50 text-black font-black text-xl gap-4 transition-transform active:scale-95 shadow-xl"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
                {isSubmitting
                  ? i18n.language === "ar"
                    ? "جاري الإنشاء..."
                    : "Launching Campaign..."
                  : t("createOfferBtn")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
