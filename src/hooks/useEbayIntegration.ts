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
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-auth`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_connection',
          user_id: user.id,
        }),
      });

      if (!response.ok) return false;

      const result = await response.json();
      return result.connected || false;
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
      // Check for required environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }
      
      if (!supabaseAnonKey) {
        throw new Error('Supabase authentication not configured');
      }

      console.log('=== EBAY CONNECT DEBUG ===');
      console.log('User ID:', user.id);
      console.log('Supabase URL:', supabaseUrl);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-auth`;
      console.log('API URL:', apiUrl);
      
      console.log('Making eBay auth request...');
      const response = await Promise.race([
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_auth_url',
            user_id: user.id,
          }),
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        )
      ]);

      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('eBay auth API error:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          const errorText = await response.text();
          console.error('Raw error response:', errorText);
        }
        throw new Error(errorMessage);
      }

      console.log('Parsing response...');
      const data = await response.json();
      console.log('eBay auth response:', data);
      console.log('=== EBAY CONNECT SUCCESS ===');
      
      return { authUrl: data.auth_url };

    } catch (err: any) {
      console.error('=== EBAY CONNECT ERROR ===');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      let userFriendlyMessage = err.message;
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        userFriendlyMessage = 'Unable to connect to eBay service. This feature may not be fully configured yet. Please try again later or contact support.';
      } else if (err.message.includes('timeout')) {
        userFriendlyMessage = 'Connection to eBay is taking too long. Please check your internet connection and try again.';
      } else if (err.message.includes('not configured')) {
        userFriendlyMessage = 'eBay integration is not fully configured. Please contact support to enable this feature.';
      }
      
      setError(userFriendlyMessage);
      return { error: userFriendlyMessage };
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
        let errorMessage = errorData.error || 'Failed to list item on eBay';
        
        // Handle specific eBay error codes with user-friendly messages
        if (errorMessage.includes('Code: 21917236')) {
          errorMessage = "Your eBay account has restrictions that prevent listing items at this time. This typically happens with new seller accounts or accounts with payment holds. Please check your eBay account settings or contact eBay support to resolve this issue before listing items.";
        }
        
        throw new Error(errorMessage);
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