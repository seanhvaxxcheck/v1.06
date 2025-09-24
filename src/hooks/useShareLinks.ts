import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ShareLink {
  id: string;
  user_id: string;
  unique_share_id: string;
  settings: {
    hide_purchase_price?: boolean;
  };
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface SharedCollection {
  owner: {
    name: string;
  };
  items: any[];
  totalItems: number;
  totalValue: number;
  settings: {
    hidePurchasePrice: boolean;
  };
  sharedAt: string;
}

export const useShareLinks = () => {
  const { user } = useAuth();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShareLinks = useCallback(async () => {
    if (!user) {
      setShareLinks([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShareLinks(data || []);
    } catch (err: any) {
      console.error('Error fetching share links:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createShareLink = async (settings: { hide_purchase_price?: boolean } = { hide_purchase_price: true }) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('share_links')
        .insert([{
          user_id: user.id,
          settings,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      setShareLinks(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating share link:', err);
      return { data: null, error: err.message };
    }
  };

  const updateShareLink = async (id: string, updates: Partial<ShareLink>) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('share_links')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setShareLinks(prev => prev.map(link => link.id === id ? data : link));
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating share link:', err);
      return { data: null, error: err.message };
    }
  };

  const deleteShareLink = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('share_links')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setShareLinks(prev => prev.filter(link => link.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting share link:', err);
      return { error: err.message };
    }
  };

  const getSharedCollection = async (shareId: string): Promise<{ data: SharedCollection | null; error: string | null }> => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-collection?shareId=${shareId}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load shared collection');
      }

      const responseData = await response.json();
      return { data: responseData.collection, error: null };
    } catch (err: any) {
      console.error('Error fetching shared collection:', err);
      return { data: null, error: err.message };
    }
  };

  const generateShareUrl = (shareId: string) => {
    return `${window.location.origin}/share/${shareId}`;
  };

  useEffect(() => {
    fetchShareLinks();
  }, [fetchShareLinks]);

  return {
    shareLinks,
    loading,
    error,
    createShareLink,
    updateShareLink,
    deleteShareLink,
    getSharedCollection,
    generateShareUrl,
    refreshShareLinks: fetchShareLinks,
  };
};