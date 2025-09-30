import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Upload, Camera, RotateCcw, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Loader as Loader2, Crown, Zap } from 'lucide-react';
import { useInventory, type InventoryItem } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';
import { ToastNotification } from './ToastNotification';
import { stripeProducts } from '../../stripe-config';

import { 
  getActiveCustomFields,
  getAllCategoriesSync,
  getAllConditionsSync,
  getAllSubcategoriesSync,
  getCategoryIdByName,
  getConditionIdByName,
  getSubcategoryIdByName,
  getCategoryNameById,
  getConditionNameById,
  getSubcategoryNameById,
  addCustomCategory,
  addCustomCondition,
  addCustomSubcategory,
  type CustomField
} from '../../utils/customFields';

interface ItemModalProps {
  item?: InventoryItem | null;
  prefilledData?: any;
  selectedImageFile?: File | null;
  onClose: () => void;
  onUpgradeResult?: (result: 'success' | 'cancelled', message: string) => void;
  currentSubscription?: any;
}

export const ItemModal: React.FC<ItemModalProps> = ({ item, onClose, onUpgradeResult, currentSubscription }) => {
  const { addItem, updateItem, uploadPhoto, refreshItems } = useInventory();
  const { user } = useAuth();
  //const { createCheckoutSession, loading: stripeLoading, stripeProducts = [] } = useStripe();
  const { createCheckoutSession, loading: stripeLoading } = useStripe();

  
  // Force close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, item]);
  
  // Handle checkout results from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkout = urlParams.get('checkout');
    const sessionId = urlParams.get('session_id');
    
    if (checkout === 'success' && sessionId) {
      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Close modal and show success message
      setShowUpgradeModal(false);
      onClose();
      if (onUpgradeResult) {
        onUpgradeResult('success', 'Subscription upgraded successfully! You can now add more items to your collection.');
      }
    } else if (checkout === 'cancelled') {
      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Show cancelled message
      if (onUpgradeResult) {
        onUpgradeResult('cancelled', 'Checkout was cancelled. You can try again anytime.');
      }
    }
  }, [onClose, onUpgradeResult]);
  
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    subcategory: item?.subcategory || '',
    manufacturer: item?.manufacturer || '',
    pattern: item?.pattern || '',
    year_manufactured: item?.year_manufactured?.toString() || '',
    quantity: item?.quantity?.toString() || '1',
    purchase_price: item?.purchase_price?.toString() || '',
    current_value: item?.current_value?.toString() || '',
    location: item?.location || '',
    description: item?.description || '',
    condition: item?.condition || '',
    purchase_date: item?.purchase_date || '',
    quantity: '',
  });

  // Initialize form data when item changes
  useEffect(() => {
    const initializeForm = async () => {
      if (item) {
        // For existing items, use coalesce logic: custom field name if ID exists, otherwise text column
        let categoryName = item.category || '';
        let conditionName = item.condition || '';
        let subcategoryName = item.subcategory || '';
        
        if (item.category_id && user?.id) {
          try {
            const customFieldName = await getCategoryNameById(item.category_id, user.id);
            // Only use custom field name if lookup was successful (not returning the UUID)
            if (customFieldName && customFieldName !== item.category_id) {
              categoryName = customFieldName;
            }
          } catch (error) {
            console.error('Error getting category name:', error);
            // Keep the original category text value on error
          }
        }
        
        if (item.condition_id && user?.id) {
          try {
            const customFieldName = await getConditionNameById(item.condition_id, user.id);
            // Only use custom field name if lookup was successful (not returning the UUID)
            if (customFieldName && customFieldName !== item.condition_id) {
              conditionName = customFieldName;
            }
          } catch (error) {
            console.error('Error getting condition name:', error);
            // Keep the original condition text value on error
          }
        }
        
        if (item.subcategory_id && user?.id) {
          try {
            const customFieldName = await getSubcategoryNameById(item.subcategory_id, user.id);
            // Only use custom field name if lookup was successful (not returning the UUID)
            if (customFieldName && customFieldName !== item.subcategory_id) {
              subcategoryName = customFieldName;
            }
          } catch (error) {
            console.error('Error getting subcategory name:', error);
            // Keep the original subcategory text value on error
          }
        }
        
        setFormData({
          name: item.name || '',
          category: categoryName,
          subcategory: subcategoryName,
          manufacturer: item.manufacturer || '',
          pattern: item.pattern || '',
          year_manufactured: item.year_manufactured ? item.year_manufactured.toString() : '',
          purchase_price: item.purchase_price ? item.purchase_price.toString() : '',
          current_value: item.current_value ? item.current_value.toString() : '',
          purchase_date: item.purchase_date || '',
          location: item.location || '',
          description: item.description || '',
          condition: conditionName,
          quantity: item.quantity ? item.quantity.toString() : '1',
        });
      } else {
        // Reset form for new items
        setFormData({
          name: '',
          category: '',
          subcategory: '',
          manufacturer: '',
          pattern: '',
          year_manufactured: '',
          purchase_price: '',
          current_value: '',
          purchase_date: '',
          location: '',
          description: '',
          condition: '',
          quantity: '1',
        });
      }
    };
    
    initializeForm();
  }, [item, user?.id]);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(item?.photo_url || '');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customConditions, setCustomConditions] = useState<string[]>([]);
  const [customSubcategories, setCustomSubcategories] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [showNewConditionInput, setShowNewConditionInput] = useState(false);
  const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newConditionName, setNewConditionName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [addingCustomField, setAddingCustomField] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch custom categories and conditions
  useEffect(() => {
    const fetchCustomFields = async () => {
      if (user?.id) {
        try {
          const fields = await getActiveCustomFields(user.id);
          setCustomFields(fields);
          
          // Also set the legacy arrays for backward compatibility
          const categories = fields
            .filter(field => field.field_type === 'category')
            .map(field => field.field_name);
          const conditions = fields
            .filter(field => field.field_type === 'condition')
            .map(field => field.field_name);
          const subcategories = fields
            .filter(field => field.field_type === 'subcategory')
            .map(field => field.field_name);
            
          setCustomCategories(categories);
          setCustomConditions(conditions);
          setCustomSubcategories(subcategories);
        } catch (error) {
          console.error('Error fetching custom fields:', error);
        }
      }
    };

    fetchCustomFields();
  }, [user?.id]);

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim() || !user?.id) return;

    // Check if category already exists (case-insensitive)
    const existingCategory = allCategories.find(
      category => category.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    
    if (existingCategory) {
      setToastMessage(`Category "${newCategoryName.trim()}" already exists. Please choose a different name.`);
      setToastVisible(true);
      return;
    }

    setAddingCustomField(true);
    try {
      const result = await addCustomCategory(newCategoryName.trim(), user.id);
      
      if (result.error) {
        setToastMessage(result.error);
        setToastVisible(true);
      } else {
        // Refresh custom fields
        const fields = await getActiveCustomFields(user.id);
        setCustomFields(fields);
        
        // Set the new category as selected
        setFormData({ ...formData, category: newCategoryName.trim() });
        
        // Reset form
        setNewCategoryName('');
        setShowNewCategoryInput(false);
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to add category');
      setToastVisible(true);
    } finally {
      setAddingCustomField(false);
    }
  };

  const handleAddNewCondition = async () => {
    if (!newConditionName.trim() || !user?.id) return;

    // Clear any previous form errors
    setFormError('');

    // Check if condition already exists (case-insensitive)
    const existingCondition = allConditions.find(
      condition => condition.name.toLowerCase() === newConditionName.trim().toLowerCase()
    );
    
    if (existingCondition) {
      setToastMessage(`Condition "${newConditionName.trim()}" already exists. Please choose a different name.`);
      setToastVisible(true);
      return;
    }

    setAddingCustomField(true);
    try {
      const result = await addCustomCondition(newConditionName.trim(), user.id);
      
      if (result.error) {
        setToastMessage(result.error);
        setToastVisible(true);
      } else {
        // Refresh custom fields
        const fields = await getActiveCustomFields(user.id);
        setCustomFields(fields);
        
        // Set the new condition as selected
        setFormData({ ...formData, condition: newConditionName.trim() });
        
        // Reset form
        setNewConditionName('');
        setShowNewConditionInput(false);
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to add condition');
      setToastVisible(true);
    } finally {
      setAddingCustomField(false);
    }
  };

  const handleAddNewSubcategory = async () => {
    if (!newSubcategoryName.trim() || !user?.id) return;

    // Clear any previous form errors
    setFormError('');

    // Check if subcategory already exists (case-insensitive)
    const existingSubcategory = allSubcategories.find(
      subcategory => subcategory.name.toLowerCase() === newSubcategoryName.trim().toLowerCase()
    );
    
    if (existingSubcategory) {
      setToastMessage(`Subcategory "${newSubcategoryName.trim()}" already exists. Please choose a different name.`);
      setToastVisible(true);
      return;
    }

    setAddingCustomField(true);
    try {
      const result = await addCustomSubcategory(newSubcategoryName.trim(), user.id);
      
      if (result.error) {
        setToastMessage(result.error);
        setToastVisible(true);
      } else {
        // Refresh custom fields
        const fields = await getActiveCustomFields(user.id);
        setCustomFields(fields);
        
        // Set the new subcategory as selected
        setFormData({ ...formData, subcategory: newSubcategoryName.trim() });
        
        // Reset form
        setNewSubcategoryName('');
        setShowNewSubcategoryInput(false);
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to add subcategory');
      setToastVisible(true);
    } finally {
      setAddingCustomField(false);
    }
  };
  // Get all available categories and conditions
  const allCategories = useMemo(() => 
    getAllCategoriesSync(customFields || []),
    [customFields]
  );
  
  const allConditions = useMemo(() => 
    getAllConditionsSync(customFields || []),
    [customFields]
  );

  const allSubcategories = useMemo(() => 
    getAllSubcategoriesSync(customFields || []),
    [customFields]
  );
  // Cleanup camera stream when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setFormError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraModal(false);
  };

  const flipCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);
    
    // Restart camera with new facing mode
    if (stream) {
      await startCamera();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhoto(file);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Close camera modal
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const handleCameraClick = async () => {
    setShowCameraOptions(false);
    setShowCameraModal(true);
    await startCamera();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowCameraOptions(false);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowCameraOptions(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    await createCheckoutSession(priceId, 'subscription');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    // Validate quantity
    const quantity = formData.quantity.trim();
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 1 || !Number.isInteger(Number(quantity))) {
      setFormError('Quantity must be a whole number greater than 0');
      setLoading(false);
      return;
    }

    try {
      let photoUrl = item?.photo_url || null;

      // Handle photo upload
      if (photo) {
        const tempId = item?.id || `temp_${Date.now()}`;
        console.log('Starting photo upload process for:', tempId);
        const { data: uploadedUrl, error: uploadError } = await uploadPhoto(photo, tempId);
        if (uploadError) {
          console.error('Photo upload failed:', uploadError);
          console.log('Continuing with item save despite photo upload failure');
        } else if (uploadedUrl) {
          photoUrl = uploadedUrl;
          console.log('Photo upload successful, URL:', uploadedUrl);
        }
      }

      // Get category and condition IDs
      let categoryId = null;
      let conditionId = null;
      let subcategoryId = null;
      
      if (formData.category && user?.id) {
        categoryId = await getCategoryIdByName(formData.category, user.id);
      }
      
      if (formData.condition && user?.id) {
        conditionId = await getConditionIdByName(formData.condition, user.id);
      }
      
      if (formData.subcategory && user?.id) {
        subcategoryId = await getSubcategoryIdByName(formData.subcategory, user.id);
      }
      
      const itemData = {
        ...formData,
        category: formData.category,
        category_id: categoryId,
        subcategory: formData.subcategory,
        subcategory_id: subcategoryId,
        condition: formData.condition,
        condition_id: conditionId,
        year_manufactured: formData.year_manufactured && formData.year_manufactured.toString().trim() !== '' 
          ? Number(formData.year_manufactured) 
          : null,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : 0,
        current_value: formData.current_value ? Number(formData.current_value) : 0,
        quantity: Number(formData.quantity),
        purchase_date: formData.purchase_date || null,
        photo_url: photoUrl,
      };

      let result;
      if (item) {
        // For existing items, handle photo upload after update if needed
        if (photo && !photoUrl) {
          const { data: uploadedUrl, error: uploadError } = await uploadPhoto(photo, item.id);
          if (!uploadError && uploadedUrl) {
            itemData.photo_url = uploadedUrl;
          }
        }
        // Use the updateItem function from useInventory hook
        result = await updateItem(item.id, itemData);
      } else {
        // For new items, create first then upload photo if storage is available
        result = await addItem(itemData);
        if (result?.data && photo && !photoUrl) {
          const { data: uploadedUrl, error: uploadError } = await uploadPhoto(photo, result.data.id);
          if (!uploadError && uploadedUrl) {
            await updateItem(result.data.id, { photo_url: uploadedUrl });
          }
        }
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      onClose();
      
    } catch (err: any) {
      console.error('Error saving item:', err);
      if (err.message && (err.message.includes('User has reached the maximum of 100 records') || err.message.includes('User has reached the maximum of 10 records'))) {
        setShowUpgradeModal(true);
      } else {
        if (err.message && (err.message.includes('User has reached the maximum of 100 records') || err.message.includes('User has reached the maximum of 10 records'))) {
          setShowUpgradeModal(true);
        } else {
          setFormError(err.message || 'An error occurred while saving the item');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {item ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photo
              </label>
              <div className="flex items-center gap-4">
                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview('');
                        setShowCameraOptions(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        if (cameraInputRef.current) cameraInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCameraOptions(!showCameraOptions)}
                    className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photo
                  </button>
                  
                  {showCameraOptions && (
                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
                      <button
                        type="button"
                        onClick={handleCameraClick}
                        className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-600"
                      >
                        <Camera className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-gray-700 dark:text-gray-300">Take Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowCameraOptions(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Upload className="h-4 w-4 mr-3 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300">Choose from Gallery</span>
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
              </div>
              {showCameraOptions && (
                <div 
                  className="fixed inset-0 z-5"
                  onClick={() => setShowCameraOptions(false)}
                />
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewCategory()}
                      placeholder="Enter new category name"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      disabled={addingCustomField || !newCategoryName.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
                    >
                      {addingCustomField ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowNewCategoryInput(true);
                      } else {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a category</option>
                    {allCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                    <option value="__add_new__" className="font-medium text-green-600">
                      + Add New Category
                    </option>
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategory
                </label>
                {showNewSubcategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubcategoryName}
                      onChange={(e) => {
                        setNewSubcategoryName(e.target.value);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewSubcategory()}
                      placeholder="Enter new subcategory name"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewSubcategory}
                      disabled={addingCustomField || !newSubcategoryName.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
                    >
                      {addingCustomField ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewSubcategoryInput(false);
                        setNewSubcategoryName('');
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.subcategory}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowNewSubcategoryInput(true);
                      } else {
                        setFormData({ ...formData, subcategory: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a subcategory</option>
                    {allSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.name}>
                        {subcategory.name}
                      </option>
                    ))}
                    <option value="__add_new__" className="font-medium text-green-600">
                      + Add New Subcategory
                    </option>
                  </select>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Anchor Hocking, Fire-King"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pattern
                </label>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Pattern name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year Manufactured
                </label>
                <input
                  type="number"
                  value={formData.year_manufactured}
                  onChange={(e) => setFormData({ ...formData, year_manufactured: e.target.value })}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 1950"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Price ($)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.purchase_price}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setFormData({ ...formData, purchase_price: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Value ($)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.current_value}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setFormData({ ...formData, current_value: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter value"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition
                </label>
                {showNewConditionInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newConditionName}
                      onChange={(e) => {
                        setNewConditionName(e.target.value);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewCondition()}
                      placeholder="Enter new condition name"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCondition}
                      disabled={addingCustomField || !newConditionName.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
                    >
                      {addingCustomField ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewConditionInput(false);
                        setNewConditionName('');
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.condition}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowNewConditionInput(true);
                      } else {
                        setFormData({ ...formData, condition: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a condition</option>
                    {allConditions.map((condition) => (
                      <option key={condition.id} value={condition.name}>
                        {condition.name}
                      </option>
                    ))}
                    <option value="__add_new__" className="font-medium text-green-600">
                      + Add New Condition
                    </option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Display cabinet, Storage room"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Enter item description..."
              />
            </div>

            {/* Sticky Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 -mx-6 -mb-6 flex gap-3">
              <button
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Error Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Upgrade Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  You've reached your item limit. Upgrade to add more items to your collection.
                </p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {stripeProducts.filter(plan => {
                  // Only show paid plans
                  if (plan.price <= 0) return false;
                  
                  // If no current subscription, show all paid plans
                  if (!currentSubscription?.price_id) return true;
                  
                  const currentProduct = stripeProducts.find(p => p.priceId === currentSubscription.price_id);
                  if (!currentProduct) return true;
                  
                  // Compare item limits - only show plans with higher limits
                  // Handle unlimited (-1) as always being higher than any finite limit
                  const currentLimit = currentProduct.itemLimit || 0;
                  const newLimit = plan.itemLimit || 0;
                  
                  // If new plan has unlimited items (-1), it's always an upgrade from finite limits
                  if (newLimit === -1 && currentLimit !== -1) return true;
                  
                  // If current plan is unlimited (-1), no upgrades available
                  if (currentLimit === -1) return false;
                  
                  // For finite limits, show plans with higher limits
                  return newLimit > currentLimit;
                }).map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:scale-105 ${
                      plan.popular
                        ? 'border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className={`p-3 rounded-full ${
                          plan.popular 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {plan.name === 'Pro' ? (
                            <Crown className="h-6 w-6" />
                          ) : (
                            <Zap className="h-6 w-6" />
                          )}
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        {plan.name}
                      </h3>

                      <div className="text-center mb-6">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          ${plan.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300 ml-1">
                          /{plan.interval || 'month'}
                        </span>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mt-0.5 mr-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Selecting clicking button below will automatically upgrade your plan. </p> 
                      <button
                        onClick={() => handleUpgrade(plan.priceId)}
                        disabled={stripeLoading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 ${
                          plan.popular
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {stripeLoading ? 'Processing...' : 'Upgrade Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  All plans include a 30-day money-back guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Take Photo
              </h3>
              <button
                onClick={stopCamera}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={flipCamera}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Flip Camera
                </button>
                
                <button
                  onClick={capturePhoto}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Errors */}
      <ToastNotification
        isVisible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
        type="error"
        duration={4000}
      />
    </>
  );
};