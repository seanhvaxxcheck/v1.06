import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Image as ImageIcon, Plus, Heart, Share } from 'lucide-react';
import { useWishlist, type WishlistItem } from '../../hooks/useWishlist';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  getActiveCustomFields,
  getAllCategoriesSync,
  getAllConditionsSync,
  getAllSubcategoriesSync,
  addCustomCategory,
  addCustomCondition,
  addCustomSubcategory,
  type CustomField
} from '../../utils/customFields';
import { WishlistShareModal } from './WishlistShareModal';

interface WishlistModalProps {
  item?: WishlistItem | null;
  onClose: () => void;
  onSaved?: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({ item, onClose, onSaved }) => {
  const { addItem, updateItem, deleteItem, refreshWishlist } = useWishlist();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    item_name: item?.item_name || '',
    category: item?.category || '',
    subcategory: item?.subcategory || '',
    manufacturer: item?.manufacturer || '',
    pattern: item?.pattern || '',
    year_manufactured: item?.year_manufactured || '',
    desired_price_max: item?.desired_price_max || '',
    condition: item?.condition || 'good',
    location: item?.location || '',
    description: item?.description || '',
    status: (item?.status as any) || 'active',
    quantity: item?.quantity || 1,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.photo_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newConditionName, setNewConditionName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch custom fields on component mount
  React.useEffect(() => {
    const fetchCustomFields = async () => {
      if (user?.id) {
        try {
          const fields = await getActiveCustomFields(user.id);
          setCustomFields(fields);
        } catch (error) {
          console.error('Error fetching custom fields:', error);
        }
      }
    };

    fetchCustomFields();
  }, [user?.id]);

  const allCategories = getAllCategoriesSync(customFields);
  const allConditions = getAllConditionsSync(customFields);
  const allSubcategories = getAllSubcategoriesSync(customFields);

  const handleImageSelection = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

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

      const { data: urlData } = supabase.storage
        .from('item-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Photo upload error:', err);
      throw err;
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !user?.id) return;

    try {
      const result = await addCustomCategory(newCategoryName.trim(), user.id);
      if (result.error) {
        setError(result.error);
      } else {
        const fields = await getActiveCustomFields(user.id);
        setCustomFields(fields);
        setFormData({ ...formData, category: newCategoryName.trim() });
        setNewCategoryName('');
        setShowAddCategory(false);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add category');
    }
  };

  const handleAddCondition = async () => {
    if (!newConditionName.trim() || !user?.id) return;

    try {
      const result = await addCustomCondition(newConditionName.trim(), user.id);
      if (result.error) {
        setError(result.error);
      } else {
        const fields = await getActiveCustomFields(user.id);
        setCustomFields(fields);
        setFormData({ ...formData, condition: newConditionName.trim() });
        setNewConditionName('');
        setShowAddCondition(false);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add condition');
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !user?.id) return;

    try {
      const result = await addCustomSubcategory(newSubcategoryName.trim(), user.id);
      if (result.error) {
        setError(result.error);
      } else {
        const fields = await getActiveCustomFields(user.id);
        setCustomFields(fields);
        setFormData({ ...formData, subcategory: newSubcategoryName.trim() });
        setNewSubcategoryName('');
        setShowAddSubcategory(false);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add subcategory');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.item_name.trim()) {
      setError('Item name is required');
      setLoading(false);
      return;
    }

    if (!formData.category.trim()) {
      setError('Category is required');
      setLoading(false);
      return;
    }

    try {
      let photoUrl = imagePreview;

      // Upload new photo if selected
      if (selectedImage) {
        photoUrl = await uploadPhoto(selectedImage);
      }

      const itemData = {
        ...formData,
        desired_price_max: formData.desired_price_max ? Number(formData.desired_price_max) : null,
        year_manufactured: formData.year_manufactured ? Number(formData.year_manufactured) : null,
        quantity: Number(formData.quantity) || 1,
        photo_url: photoUrl,
      };

      let result;
      if (item) {
        result = await updateItem(item.id, itemData);
      } else {
        result = await addItem(itemData);
      }

      if (result?.error) throw new Error(result.error);

      await refreshWishlist();
      
      if (onSaved) {
        await onSaved();
      }

      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {item ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
            </h2>
            <div className="flex items-center space-x-2">
              {item && (
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Share wishlist item"
                >
                  <Share className="h-6 w-6" />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Photo
            </label>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Item preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Add a photo of the item you want</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageSelection(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
             capture="camera"
              onChange={(e) => e.target.files?.[0] && handleImageSelection(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.item_name}
              onChange={e => setFormData({ ...formData, item_name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Fenton Hobnail Milk Glass Vase"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={e => {
                  if (e.target.value === '__add_new__') {
                    setShowAddCategory(true);
                  } else {
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select category</option>
                {allCategories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                <option value="__add_new__">+ Add New Category</option>
              </select>

              {showAddCategory && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subcategory
            </label>
            <div className="relative">
              <select
                value={formData.subcategory}
                onChange={e => {
                  if (e.target.value === '__add_new__') {
                    setShowAddSubcategory(true);
                  } else {
                    setFormData({ ...formData, subcategory: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select subcategory (optional)</option>
                {allSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.name}>
                    {subcategory.name}
                  </option>
                ))}
                <option value="__add_new__">+ Add New Subcategory</option>
              {showAddCondition && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newConditionName}
                      onChange={(e) => setNewConditionName(e.target.value)}
                      placeholder="Enter condition name"
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
                    />
                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCondition(false);
                        setNewConditionName('');
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              </select>

              {showAddSubcategory && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      placeholder="Enter subcategory name"
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddSubcategory(false);
                        setNewSubcategoryName('');
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manufacturer and Pattern */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Fenton, Fire-King"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pattern
              </label>
              <input
                type="text"
                value={formData.pattern}
                onChange={e => setFormData({ ...formData, pattern: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Hobnail, Swirl"
              />
            </div>
          </div>

          {/* Year and Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year Manufactured
              </label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.year_manufactured}
                onChange={e => setFormData({ ...formData, year_manufactured: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 1950"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity Wanted
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Desired Price and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.desired_price_max}
                onChange={e => setFormData({ ...formData, desired_price_max: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Desired Condition
              </label>
              <div className="relative">
                <select
                  value={formData.condition}
                  onChange={e => {
                    if (e.target.value === '__add_new__') {
                      setShowAddCondition(true);
                    } else {
                      setFormData({ ...formData, condition: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  {allConditions.map((condition) => (
                    <option key={condition.id} value={condition.name}>
                      {condition.name}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add New Condition</option>
                </select>

                {showAddCondition && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newConditionName}
                        onChange={(e) => setNewConditionName(e.target.value)}
                        placeholder="Enter condition name"
                        className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
                      />
                      <button
                        type="button"
                        onClick={handleAddCondition}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCondition(false);
                          setNewConditionName('');
                        }}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Location/Source
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Local antique shops, eBay, Estate sales"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description & Notes
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Describe what you're looking for, specific features, or any additional notes..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Actively Looking</option>
              <option value="found">Found</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {item && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.item_name || !formData.category}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
            >
              {loading ? 'Saving...' : (item ? 'Update Item' : 'Add to Wishlist')}
            </button>
          </div>
        </form>
        </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              {/* Header with Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Remove from Wishlist?
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  "{item.item_name}"
                </span>{' '}
                from your wishlist? This action cannot be undone.
              </p>
              
              {/* Item Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt={item.item_name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.item_name}
                    </p>
                    {formData.desired_price_max && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Max price: ${formData.desired_price_max}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Keep Item
                </button>
                <button
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const { error } = await deleteItem(item.id);
                      if (error) {
                        setError(error);
                        setShowDeleteConfirm(false);
                      } else {
                        if (onSaved) {
                          await onSaved();
                        }
                        onClose();
                      }
                    } catch (err: any) {
                      setError(err.message || 'Failed to delete item');
                      setShowDeleteConfirm(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors font-medium"
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Removing...
                    </div>
                  ) : (
                    'Remove from Wishlist'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && item && (
        <WishlistShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          wishlistItem={{
            id: item.id,
            item_name: item.item_name,
            ebay_search_term: formData.ebay_search_term || '',
            facebook_marketplace_url: formData.facebook_marketplace_url || '',
            desired_price_max: formData.desired_price_max ? Number(formData.desired_price_max) : null,
          }}
        />
      )}
      </div>
    </div>
  );
};