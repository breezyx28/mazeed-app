import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const WISHLIST_STORAGE_KEY = 'mazeed-wishlist';

export interface WishlistItem {
  product_id: string;
  created_at: string;
}

export const useWishlist = () => {
  const { user, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedFromServer = useRef(false);

  const getLocalWishlist = (): WishlistItem[] => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalWishlist = (items: WishlistItem[]) => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save wishlist to localStorage:', error);
    }
  };

  const loadFromServer = useCallback(async () => {
    if (!user?.id || hasLoadedFromServer.current) return;
    
    setIsLoading(true);
    hasLoadedFromServer.current = true;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setWishlistItems(data);
        saveLocalWishlist(data);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const addToWishlist = useCallback(async (productId: string) => {
    const newItem: WishlistItem = {
      product_id: productId,
      created_at: new Date().toISOString()
    };

    const updatedItems = [newItem, ...wishlistItems.filter(item => item.product_id !== productId)];
    setWishlistItems(updatedItems);
    saveLocalWishlist(updatedItems);

    if (isAuthenticated && user?.id) {
      try {
        await supabase
          .from('favorites')
          .upsert({
            user_id: user.id,
            product_id: productId,
            created_at: newItem.created_at
          }, { onConflict: 'user_id,product_id' });
      } catch (error) {
        console.error('Failed to add to Supabase wishlist:', error);
      }
    }
  }, [wishlistItems, isAuthenticated, user?.id]);

  const removeFromWishlist = useCallback(async (productId: string) => {
    const updatedItems = wishlistItems.filter(item => item.product_id !== productId);
    setWishlistItems(updatedItems);
    saveLocalWishlist(updatedItems);

    if (isAuthenticated && user?.id) {
      try {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } catch (error) {
        console.error('Failed to remove from Supabase wishlist:', error);
      }
    }
  }, [wishlistItems, isAuthenticated, user?.id]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistItems.some(item => item.product_id === productId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  useEffect(() => {
    const localItems = getLocalWishlist();
    setWishlistItems(localItems);
    
    if (localItems.length === 0 && isAuthenticated && user?.id) {
      loadFromServer();
    }
  }, [isAuthenticated, user?.id, loadFromServer]);

  return {
    wishlistItems,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist
  };
};