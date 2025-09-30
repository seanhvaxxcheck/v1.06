import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface EbayCredentials {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface EbayListingData {
  title: string;
  description: string;
  category_id: string;
  start_price: number;
  buy_it_now_price?: number;
  duration: number; // days
  condition: string;
  shipping_cost?: number;
  return_policy?: string;
  payment_methods: string[];
  photos: string[];
}

export interface EbayListingResult {
  listing_id: string;
  listing_url: string;
  status: 'active' | 'ended' | 'sold';
  created_at: string;
}

export const useEbayIntegration = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEbayConnection = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('ebay_credentials')
        .select('expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) return false;

      // Check if token is still valid (not expired)
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      
      return expiresAt > now;
    } catch (err) {
      console.error('Error checking eBay connection:', err);
      return false;
    }
  }, [user]);

  const connectToEbay = useCallback(async (): Promise<{ authUrl?: string; error?: string }> => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-auth`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_auth_url',
          user_id: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get eBay authorization URL');
      }

      const data = await response.json();
      return { authUrl: data.auth_url };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect to eBay';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const listItemOnEbay = useCallback(async (
    itemId: string,
    listingData: EbayListingData
  ): Promise<{ result?: EbayListingResult; error?: string }> => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-listing`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          item_id: itemId,
          listing_data: listingData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list item on eBay');
      }

      const result = await response.json();
      return { result };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to list item on eBay';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getEbayCategories = useCallback(async (): Promise<{ categories?: any[]; error?: string }> => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-categories`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch eBay categories');
      }

      const data = await response.json();
      return { categories: data.categories };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch eBay categories';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user]);

  const disconnectEbay = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('ebay_credentials')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      return {};
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to disconnect eBay';
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [user]);

  return {
    loading,
    error,
    checkEbayConnection,
    connectToEbay,
    listItemOnEbay,
    getEbayCategories,
    disconnectEbay,
  };
};