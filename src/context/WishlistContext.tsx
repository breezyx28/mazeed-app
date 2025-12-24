import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface WishlistItem {
  product_id: string;
  product: any;
  created_at: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'mazeed-wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist from localStorage on mount
  const loadWishlistFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWishlistItems(parsed);
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  const saveWishlistToStorage = useCallback((items: WishlistItem[]) => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadWishlistFromStorage();
  }, [loadWishlistFromStorage]);

  // Save whenever wishlist changes
  useEffect(() => {
    if (!isLoading) {
      saveWishlistToStorage(wishlistItems);
    }
  }, [wishlistItems, isLoading, saveWishlistToStorage]);

  const addToWishlist = async (productId: string) => {
    try {
      // Fetch the product data from Supabase
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Create wishlist item with full product data
      const newItem: WishlistItem = {
        product_id: productId,
        product: {
          ...productData,
          originalPrice: productData.original_price,
          reviews: productData.reviews_count || 0,
          images: productData.images || [productData.image]
        },
        created_at: new Date().toISOString(),
      };

      // Add to state (will automatically save to localStorage via useEffect)
      setWishlistItems(prev => [newItem, ...prev]);
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      toast.error('فشل إضافة المنتج للمفضلة');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    // Remove from state (will automatically save to localStorage via useEffect)
    setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const refreshWishlist = async () => {
    loadWishlistFromStorage();
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
