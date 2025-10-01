import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface WishlistShare {
  id: string;
  wishlist_item_id: string;
  user_id: string;
  unique_share_id: string;
  settings: {
    include_search_terms?: boolean;
    include_price_limit?: boolean;
    include_facebook_url?: boolean;
    allow_public_view?: boolean;
  };
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useWishlistSharing = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWishlistShare = useCallback(async (
    wishlistItemId: string,
    settings: any
  ): Promise<{ data?: WishlistShare; error?: string }> => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('wishlist_shares')
        .insert([{
          wishlist_item_id: wishlistItemId,
          user_id: user.id,
          settings,
          is_active: true,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating wishlist share:', error);
        return { error: error.message };
      }

      return { data };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create share link';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getWishlistShares = useCallback(async (
    wishlistItemId: string
  ): Promise<{ data?: WishlistShare[]; error?: string }> => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('wishlist_shares')
        .select('*')
        .eq('wishlist_item_id', wishlistItemId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist shares:', error);
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch shares';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user]);

  const deleteWishlistShare = useCallback(async (
    shareId: string
  ): Promise<{ error?: string }> => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('wishlist_shares')
        .delete()
        .eq('id', shareId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting wishlist share:', error);
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete share';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user]);

  const toggleWishlistShare = useCallback(async (
    shareId: string,
    isActive: boolean
  ): Promise<{ error?: string }> => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('wishlist_shares')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', shareId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling wishlist share:', error);
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle share';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user]);

  return {
    loading,
    error,
    createWishlistShare,
    getWishlistShares,
    deleteWishlistShare,
    toggleWishlistShare,
  };
};