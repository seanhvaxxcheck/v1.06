import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface MarketplaceListing {
  id: string;
  user_id: string;
  inventory_item_id: string | null;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  condition: string;
  photo_url: string | null;
  listing_type: 'sale' | 'trade' | 'both';
  asking_price: number | null;
  trade_preferences: string | null;
  listing_status: 'active' | 'sold' | 'completed' | 'removed';
  view_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: {
    full_name: string | null;
    email: string;
  };
}

export const useMarketplace = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          user_profile:profiles!marketplace_listings_user_id_fkey(full_name, email)
        `)
        .eq('listing_status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching marketplace listings:', error);
        setListings([]);
      } else {
        setListings(data || []);
      }
    } catch (error) {
      console.error('Error in fetchListings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMyListings = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my listings:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchMyListings:', error);
      return [];
    }
  }, [user]);

  const createListing = useCallback(async (listing: Partial<MarketplaceListing>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert({
          ...listing,
          user_id: user.id,
        })
        .select(`
          *,
          user_profile:profiles!marketplace_listings_user_id_fkey(full_name, email)
        `)
        .single();

      if (error) {
        console.error('Error creating listing:', error);
        return { error: error.message };
      }

      await fetchListings();

      return { data, error: null };
    } catch (error) {
      console.error('Error in createListing:', error);
      return { error: 'Failed to create listing' };
    }
  }, [user, fetchListings]);

  const updateListing = useCallback(async (id: string, updates: Partial<MarketplaceListing>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating listing:', error);
        return { error: error.message };
      }

      await fetchListings();
      return { data, error: null };
    } catch (error) {
      console.error('Error in updateListing:', error);
      return { error: 'Failed to update listing' };
    }
  }, [user, fetchListings]);

  const deleteListing = useCallback(async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting listing:', error);
        return { error: error.message };
      }

      await fetchListings();
      return { error: null };
    } catch (error) {
      console.error('Error in deleteListing:', error);
      return { error: 'Failed to delete listing' };
    }
  }, [user, fetchListings]);

  const incrementViewCount = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.rpc('increment_view_count', { listing_id: id });

      if (error) {
        console.error('Error incrementing view count:', error);
      }
    } catch (error) {
      console.error('Error in incrementViewCount:', error);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    loading,
    fetchListings,
    fetchMyListings,
    createListing,
    updateListing,
    deleteListing,
    incrementViewCount,
  };
};
