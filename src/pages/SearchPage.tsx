import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const SearchPage = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [sortBy, setSortBy] = useState("popular");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  // Fetch categories from database
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) return [];
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        nameAr: c.name_ar,
        emoji: c.emoji
      }));
    }
  });

  // Fetch products with offers
  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_offers(offer_category_id, expiry_date)')
        .eq('status', 'published');
      
      if (error) return [];
      
      return (data || []).map((p: any) => ({
        ...p,
        offers: p.product_offers || [],
        originalPrice: p.original_price,
        reviews: p.reviews_count || 0,
        sellerId: p.seller_id,
        images: p.images || [p.image]
      }));
    }
  });

  // Read URL parameters on mount
  useEffect(() => {
    const category = searchParams.get('category');
    const offer = searchParams.get('offer');
    
    if (category) {
      setSelectedCategory(category);
    }
    if (offer) {
      setSelectedOffer(offer);
    }
  }, [searchParams]);

  const filteredProducts = dbProducts
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      let matchesOffer = !selectedOffer;
      if (selectedOffer) {
        if (selectedOffer === 'under5000') {
          matchesOffer = product.price < 5000;
        } else {
          matchesOffer = product.offers.some((off: any) => {
            const normalized = off.offer_category_id === 'flash-sale' ? 'flash' : off.offer_category_id;
            const matchType = normalized === selectedOffer;
            if (!matchType) return false;
            return !off.expiry_date || new Date(off.expiry_date) > new Date();
          });
        }
      }

      return matchesSearch && matchesCategory && matchesPrice && matchesOffer;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0; // popular (default)
    });

  const applyFilters = () => {
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setPriceRange([0, 500000]);
    setSortBy("popular");
    setSelectedCategory("all");
    setSelectedOffer(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with Search */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-muted px-4 rounded-full">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchProducts')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none py-3"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-1">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <button className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle>{t('filtersAndSort')}</SheetTitle>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Sort By */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">{t('sortBy')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "popular", label: t('popular') },
                        { value: "price-low", label: t('priceLowHigh') },
                        { value: "price-high", label: t('priceHighLow') },
                        { value: "name", label: t('name') },
                      ].map((option) => (
                        <Badge
                          key={option.value}
                          variant={sortBy === option.value ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSortBy(option.value)}
                        >
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      {t('priceRange')}: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} SDG
                    </Label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500000}
                      step={1000}
                      className="w-full"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">{t('category')}</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={selectedCategory === 'all' ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory('all')}
                      >
                        {t('all')}
                      </Badge>
                      {dbCategories.map((category: any) => (
                        <Badge
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {isArabic ? category.nameAr : category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={resetFilters} className="flex-1 rounded-full">
                      {t('reset')}
                    </Button>
                    <Button onClick={applyFilters} className="flex-1 rounded-full">
                      {t('applyFilters')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {t('all')}
          </button>
          {dbCategories.map((category: any) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {isArabic ? category.nameAr : category.name}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {t('resultsFound', { count: filteredProducts.length })}
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t('noProductsFound')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('tryAdjustingFilters')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
