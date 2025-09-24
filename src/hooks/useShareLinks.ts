import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ShareLink {
  id: string;
  user_id: string;
  unique_share_id: string;
  settings: {
    hide_purchase_price?: boolean;
    hide_purchase_date?: boolean;
    hide_location?: boolean;
    hide_description?: boolean;
    hide_personal_notes?: boolean;
  };
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useShareLinks = () => {
  const { user } = useAuth();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshShareLinks = useCallback(async () => {
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

      if (error) {
        console.error('Error fetching share links:', error);
        setShareLinks([]);
      } else {
        setShareLinks(data || []);
      }
    } catch (error) {
      console.error('Error fetching share links:', error);
      setShareLinks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createShareLink = async (settings: any) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('share_links')
        .insert([{
          user_id: user.id,
          unique_share_id: crypto.randomUUID(),
          settings,
          is_active: true,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating share link:', error);
        return { data: null, error: error.message };
      }

      setShareLinks(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating share link:', error);
      return { data: null, error: error.message };
    }
  };

  const deleteShareLink = async (linkId: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('share_links')
        .delete()
        .eq('id', linkId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting share link:', error);
        return { error: error.message };
      }

      setShareLinks(prev => prev.filter(link => link.id !== linkId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting share link:', error);
      return { error: error.message };
    }
  };

  const toggleShareLink = async (linkId: string, isActive: boolean) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('share_links')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', linkId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling share link:', error);
        return { error: error.message };
      }

      setShareLinks(prev => prev.map(link => 
        link.id === linkId ? { ...link, is_active: isActive } : link
      ));
      return { error: null };
    } catch (error: any) {
      console.error('Error toggling share link:', error);
      return { error: error.message };
    }
  };

  return {
    shareLinks,
    loading,
    createShareLink,
    deleteShareLink,
    toggleShareLink,
    refreshShareLinks,
  };
};