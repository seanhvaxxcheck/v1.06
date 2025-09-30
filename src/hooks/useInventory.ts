import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePWA } from './usePWA';
import { 
  getActiveCustomFields,
  getCategoryNameById,
  getConditionNameById,
  getSubcategoryNameById,
  getCategoryIdByName,
  getConditionIdByName,
  getSubcategoryIdByName,
  type CustomField
} from '../utils/customFields';

export interface InventoryItem {
  id: string;
  user_id: string;
  category: string;
  category_id: string | null;
  subcategory: string;
  subcategory_id: string | null;
  condition: string;
  condition_id: string | null;
  name: string;
  manufacturer: string;
  pattern: string;
  year_manufactured: number | null;
  purchase_price: number;
  current_value: number;
  location: string;
  description: string;
  photo_url: string | null;
  quantity: number;
  purchase_date: string | null;
  deleted?: number;
  favorites?: number;
  ai_identified?: boolean;
  ai_confidence?: number;
  ai_analysis_id?: string;
  created_at: string;
  updated_at: string;
}

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const { user } = useAuth();
  const { showNotification } = usePWA();

  const getConditionId = (condition: string): string => {
    const conditionMap: { [key: string]: string } = {
      'excellent': '1',
      'very_good': '2',
      'good': '3', 
      'fair': '4',
      'poor': '5'
    };
    return conditionMap[condition] || '3';
  };

  const fetchItems = async () => {
    if (!user) {
      console.log('No user found, clearing items');
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching ${viewMode} inventory items for user:`, user.id);
      
      // Build query based on view mode
      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (viewMode === 'active') {
        query = query.or('deleted.is.null,deleted.eq.0');
      } else {
        query = query.eq('deleted', 1);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      console.log(`Direct query response:`, { data, error });
      
      if (error) {
        console.error(`Error fetching ${viewMode} inventory items:`, error);
        setItems([]);
        setLoading(false);
        return;
      }
      
      // Get custom fields to convert IDs to names
      const customFields = await getActiveCustomFields(user.id);
      
      // Convert category_id and condition_id to display names
      const itemsWithDisplayNames = await Promise.all((data || []).map(async (item: any) => {
        // Start with the text column values as fallback
        let categoryName = item.category || '';
        let conditionName = item.condition || '';
        let subcategoryName = item.subcategory || '';
        
        // If we have category_id, try to get the custom field name
        if (item.category_id) {
          try {
            const customFieldName = await getCategoryNameById(item.category_id, user.id);
            // Only use the custom field name if it's not the UUID itself (successful lookup)
            if (customFieldName && customFieldName !== item.category_id) {
              categoryName = customFieldName;
            }
          } catch (error) {
            console.error('Error getting category name:', error);
            // Keep the original category text value on error
          }
        }
        
        // If we have condition_id, try to get the custom field name
        if (item.condition_id) {
          try {
            const customFieldName = await getConditionNameById(item.condition_id, user.id);
            // Only use the custom field name if it's not the UUID itself (successful lookup)
            if (customFieldName && customFieldName !== item.condition_id) {
              conditionName = customFieldName;
            }
          } catch (error) {
            console.error('Error getting condition name:', error);
            // Keep the original condition text value on error
          }
        }
        
        // If we have subcategory_id, try to get the custom field name
        if (item.subcategory_id) {
          try {
            const customFieldName = await getSubcategoryNameById(item.subcategory_id, user.id);
            // Only use the custom field name if it's not the UUID itself (successful lookup)
            if (customFieldName && customFieldName !== item.subcategory_id) {
              subcategoryName = customFieldName;
            }
          } catch (error) {
            console.error('Error getting subcategory name:', error);
            // Keep the original subcategory text value on error
          }
        }
        
        return {
          ...item,
          category: categoryName,
          condition: conditionName,
          subcategory: subcategoryName,
        };
      }));
      
      console.log(`Successfully fetched ${viewMode} inventory items:`, data?.length || 0, data);
      setItems(itemsWithDisplayNames);
    } catch (err) {
      console.error(`Error fetching ${viewMode} items:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user, viewMode]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      console.error('Cannot add item: User not authenticated');
      return { data: null, error: 'User not authenticated' };
    }

    try {
      console.log('Adding item via stored procedure:', item);

      // Get category and condition IDs
      let categoryId = null;
      let conditionId = null;
      let subcategoryId = null;
      
      if (item.category) {
        categoryId = await getCategoryIdByName(item.category, user.id);
      }
      
      if (item.condition) {
        conditionId = await getConditionIdByName(item.condition, user.id);
      }
      
      if (item.subcategory) {
        subcategoryId = await getSubcategoryIdByName(item.subcategory, user.id);
      }
      
      // Insert directly into inventory_items table
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          user_id: user.id,
          category: item.category,
          category_id: categoryId,
          subcategory: item.subcategory || '',
          subcategory_id: subcategoryId,
          condition: item.condition,
          condition_id: conditionId,
          name: item.name,
          manufacturer: item.manufacturer || '',
          pattern: item.pattern || '',
          year_manufactured: item.year_manufactured,
          purchase_price: item.purchase_price || 0,
          current_value: item.current_value || 0,
          location: item.location || '',
          description: item.description || '',
          photo_url: item.photo_url,
          quantity: item.quantity || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Successfully added item:', data);
      
      // Refresh the entire list to get the latest data
      await fetchItems();
      
      // Show notification for successful addition
      showNotification('Item Added', {
        body: `${item.name} has been added to your collection`,
        tag: 'item-added',
      });

      return { data: data, error: null };
    } catch (err: any) {
      console.error('Error adding item:', err);
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!user) {
      console.error('Cannot update item: User not authenticated');
      return { data: null, error: 'User not authenticated' };
    }

    try {
      console.log('Updating item using stored procedure:', id, updates);

      // Prepare update data
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Get category and condition IDs if category or condition is being updated
      if (updates.category) {
        updateData.category_id = await getCategoryIdByName(updates.category, user.id);
      }
      
      if (updates.condition) {
        updateData.condition_id = await getConditionIdByName(updates.condition, user.id);
      }
      
      if (updates.subcategory) {
        updateData.subcategory_id = await getSubcategoryIdByName(updates.subcategory, user.id);
      }
      
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Direct update error:', error);
        return { data: null, error: error.message };
      }

      console.log('Successfully updated item using direct update:', id);
      
      // Refresh the entire list to get the latest data
      await fetchItems();
      
      // Show notification for successful update
      showNotification('Item Updated', {
        body: `${updates.name || 'Item'} has been updated`,
        tag: 'item-updated',
      });

      return { data: data, error: null };
    } catch (err: any) {
      console.error('Error updating item:', err);
      return { data: null, error: err.message };
    }
  };

  const toggleFavorite = async (id: string, currentFavoriteStatus: number) => {
    const newFavoriteStatus = currentFavoriteStatus === 1 ? 0 : 1;
    
    console.log('toggleFavorite called:', {
      itemId: id,
      currentStatus: currentFavoriteStatus,
      newStatus: newFavoriteStatus
    });

    try {
      const result = await updateItem(id, { favorites: newFavoriteStatus });
      
      if (result?.error) {
        console.error('toggleFavorite failed:', result.error);
        return { error: result.error };
      }
      
      console.log('toggleFavorite successful');
      return { data: result?.data, error: null };
    } catch (error: any) {
      console.error('toggleFavorite exception:', error);
      return { error: error.message };
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) {
      console.error('Cannot delete item: User not authenticated');
      return { error: 'User not authenticated' };
    }

    try {
      console.log('Attempting soft delete using stored procedure for item:', id, 'user:', user.id);
      const { data, error } = await supabase.rpc('soft_delete_inventory_item', {
        p_item_id: id,
        p_user_id: user.id
      });

      if (error) {
        console.error('Soft delete error:', error.message, error);
        return { error: error.message };
      }

      console.log('Successfully soft deleted item:', id, 'Response:', data);
      
      // Refresh the entire list to get the latest data
      await fetchItems();
      
      // Show notification for successful deletion
      showNotification('Item Archived', {
        body: 'Item has been moved to archive',
        tag: 'item-deleted',
      });

      return { error: null };
    } catch (err: any) {
      console.error('Soft delete catch error:', err);
      return { error: err.message };
    }
  };

  const restoreItem = async (id: string) => {
    if (!user) {
      console.error('Cannot restore item: User not authenticated');
      return { error: 'User not authenticated' };
    }

    try {
      console.log('Attempting to restore item using stored procedure for item:', id, 'user:', user.id);
      const { data, error } = await supabase.rpc('reactivate_inventory_item', {
        p_item_id: id,
        p_user_id: user.id
      });

      if (error) {
        console.error('Restore error:', error.message, error);
        return { error: error.message };
      }

      console.log('Successfully restored item:', id, 'Response:', data);
      
      // Refresh the entire list to get the latest data
      await fetchItems();
      
      // Show notification for successful restoration
      showNotification('Item Restored', {
        body: 'Item has been restored to your collection',
        tag: 'item-restored',
      });

      return { error: null };
    } catch (err: any) {
      console.error('Restore catch error:', err);
      return { error: err.message };
    }
  };
  
  const uploadPhoto = async (file: File, itemId: string) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    console.log('=== PHOTO UPLOAD DEBUG START ===');
    console.log('User ID:', user.id);
    console.log('Item ID:', itemId);
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);

    try {
      console.log('Uploading photo to Supabase Storage for item:', itemId);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('item-photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Generated public URL:', publicUrl);
      
      return { data: publicUrl, error: null };

    } catch (err: any) {
      console.error('Photo upload error:', err);
      return { data: null, error: err.message };
    }
  };

  return {
    items,
    loading,
    viewMode,
    setViewMode,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    restoreItem,
    uploadPhoto,
    toggleFavorite,
    refreshItems: fetchItems
  };
};