import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { products, categories } from "@/data/products";
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

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [sortBy, setSortBy] = useState("popular");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

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

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesOffer = !selectedOffer || product.offerType === selectedOffer;
      const isNotExpired = !product.offerExpiry || new Date(product.offerExpiry) > new Date();
      return matchesSearch && matchesCategory && matchesPrice && matchesOffer && isNotExpired;
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
                placeholder="Search products..."
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
                  <SheetTitle>Filters & Sort</SheetTitle>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Sort By */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Sort By</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "popular", label: "Popular" },
                        { value: "price-low", label: "Price: Low to High" },
                        { value: "price-high", label: "Price: High to Low" },
                        { value: "name", label: "Name" },
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
                      Price Range: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} SDG
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
                    <Label className="text-sm font-semibold">Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Badge
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={resetFilters} className="flex-1 rounded-full">
                      Reset
                    </Button>
                    <Button onClick={applyFilters} className="flex-1 rounded-full">
                      Apply Filters
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
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"} found
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
