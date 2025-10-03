import React, { useState, useEffect } from 'react';
import { X, Upload, Package } from 'lucide-react';
import { useMarketplace } from '../../hooks/useMarketplace';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ListItemModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  inventoryItemId?: string | null;
}

export const ListItemModal: React.FC<ListItemModalProps> = ({ onClose, onSuccess, inventoryItemId }) => {
  const { user } = useAuth();
  const { createListing } = useMarketplace();
  const { items } = useInventory();

  const [useExistingItem, setUseExistingItem] = useState(!!inventoryItemId);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(
    inventoryItemId || null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [condition, setCondition] = useState('');
  const [listingType, setListingType] = useState<'sale' | 'trade' | 'both'>('sale');
  const [askingPrice, setAskingPrice] = useState('');
  const [tradePreferences, setTradePreferences] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log('ListItemModal - items:', items?.length, 'selectedInventoryId:', selectedInventoryId);
    if (selectedInventoryId && items && items.length > 0) {
      const item = items.find(i => i.id === selectedInventoryId);
      console.log('Found item:', item);
      if (item) {
        setTitle(item.name);
        setDescription(item.description || '');
        setCategory(item.category || '');
        setSubcategory(item.subcategory || '');
        setCondition(item.condition || '');
        setPhotoUrl(item.photo_url || '');
        setAskingPrice(item.current_value?.toString() || '');
      }
    }
  }, [selectedInventoryId, items]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('item-photos').getPublicUrl(fileName);
      setPhotoUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    console.log('Submitting listing with inventory_item_id:', selectedInventoryId, 'useExistingItem:', useExistingItem);

    setSaving(true);
    try {
      const listingData: any = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        subcategory: subcategory.trim() || null,
        condition: condition.trim(),
        photo_url: photoUrl || null,
        listing_type: listingType,
        asking_price: askingPrice ? parseFloat(askingPrice) : null,
        trade_preferences: tradePreferences.trim() || null,
      };

      if (useExistingItem && selectedInventoryId) {
        listingData.inventory_item_id = selectedInventoryId;
      }

      console.log('Final listing data:', listingData);

      const result = await createListing(listingData);

      console.log('Create listing result:', result);

      if (result.error) {
        alert(`Failed to create listing: ${result.error}`);
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">List Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={useExistingItem}
                onChange={(e) => {
                  setUseExistingItem(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedInventoryId(null);
                    setTitle('');
                    setDescription('');
                    setCategory('');
                    setSubcategory('');
                    setCondition('');
                    setPhotoUrl('');
                    setAskingPrice('');
                  }
                }}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                List from my inventory
              </span>
            </label>

            {useExistingItem && (
              <select
                value={selectedInventoryId || ''}
                onChange={(e) => setSelectedInventoryId(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select an item</option>
                {items && items.length > 0 ? (
                  items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No inventory items found</option>
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition
              </label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Listing Type *
            </label>
            <div className="flex space-x-4">
              {['sale', 'trade', 'both'].map((type) => (
                <label key={type} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value={type}
                    checked={listingType === type}
                    onChange={(e) => setListingType(e.target.value as any)}
                    className="rounded-full"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {(listingType === 'sale' || listingType === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asking Price
              </label>
              <input
                type="number"
                step="0.01"
                value={askingPrice}
                onChange={(e) => setAskingPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {(listingType === 'trade' || listingType === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trade Preferences
              </label>
              <textarea
                value={tradePreferences}
                onChange={(e) => setTradePreferences(e.target.value)}
                rows={3}
                placeholder="What are you looking for in trade?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo
            </label>
            {photoUrl ? (
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {uploading ? 'Uploading...' : 'Click to upload photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-full font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
