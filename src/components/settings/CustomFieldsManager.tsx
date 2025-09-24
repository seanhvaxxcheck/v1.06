import React, { useState, useEffect } from 'react';
import { Plus, X, Tag, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DEFAULT_CATEGORIES,
  DEFAULT_CONDITIONS,
  DEFAULT_SUBCATEGORIES,
  getCustomCategories, 
  getCustomConditions, 
  getCustomSubcategories,
  addCustomCategory, 
  addCustomCondition, 
  addCustomSubcategory,
  removeCustomCategory, 
  removeCustomCondition,
  removeCustomSubcategory
} from '../../utils/customFields';

export const CustomFieldsManager: React.FC = () => {
  const { user } = useAuth();
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customConditions, setCustomConditions] = useState<string[]>([]);
  const [customSubcategories, setCustomSubcategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load custom fields from database
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!user?.id) return;
      
      try {
        const [categories, conditions, subcategories] = await Promise.all([
          getCustomCategories(user.id),
          getCustomConditions(user.id),
          getCustomSubcategories(user.id)
        ]);
        
        setCustomCategories(categories);
        setCustomConditions(conditions);
        setCustomSubcategories(subcategories);
      } catch (error) {
        console.error('Error loading custom fields:', error);
      }
    };

    loadCustomFields();
  }, [user?.id]);

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !user?.id) return;

    const categoryName = newCategory.trim();
    
    // Check if category already exists (case-insensitive)
    const allExistingCategories = [
      ...DEFAULT_CATEGORIES.map(c => c.name.toLowerCase()),
      ...customCategories.map(c => c.toLowerCase())
    ];
    
    if (allExistingCategories.includes(categoryName.toLowerCase())) {
      setError('Category already exists');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await addCustomCategory(categoryName, user.id);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomCategories(prev => [...prev, categoryName]);
        setNewCategory('');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCondition = async () => {
    if (!newCondition.trim() || !user?.id) return;

    const conditionName = newCondition.trim();
    
    // Check if condition already exists (case-insensitive)
    const allExistingConditions = [
      ...DEFAULT_CONDITIONS.map(c => c.name.toLowerCase()),
      ...customConditions.map(c => c.toLowerCase())
    ];
    
    if (allExistingConditions.includes(conditionName.toLowerCase())) {
      setError('Condition already exists');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await addCustomCondition(conditionName, user.id);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomConditions(prev => [...prev, conditionName]);
        setNewCondition('');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add condition');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategory.trim() || !user?.id) return;

    const subcategoryName = newSubcategory.trim();
    
    // Check if subcategory already exists (case-insensitive)
    const allExistingSubcategories = [
      ...DEFAULT_SUBCATEGORIES.map(s => s.name.toLowerCase()),
      ...customSubcategories.map(s => s.toLowerCase())
    ];
    
    if (allExistingSubcategories.includes(subcategoryName.toLowerCase())) {
      setError('Subcategory already exists');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await addCustomSubcategory(subcategoryName, user.id);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomSubcategories(prev => [...prev, subcategoryName]);
        setNewSubcategory('');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCategory = async (categoryName: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      const result = await removeCustomCategory(categoryName, user.id);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomCategories(prev => prev.filter(cat => cat !== categoryName));
      }
    } catch (error: any) {
      setError(error.message || 'Failed to remove category');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubcategory = async (subcategoryName: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      const result = await removeCustomSubcategory(subcategoryName, user.id);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomSubcategories(prev => prev.filter(sub => sub !== subcategoryName));
      }
    } catch (error: any) {
      setError(error.message || 'Failed to remove subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCondition = async (conditionName: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      const result = await removeCustomCondition(conditionName, user.id);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomConditions(prev => prev.filter(cond => cond !== conditionName));
      }
    } catch (error: any) {
      setError(error.message || 'Failed to remove condition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Categories Section */}
      <div>
        <div className="flex items-center mb-4">
          <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h3>
        </div>

        {/* Default Categories */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Default Categories</h4>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-full"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>

        {/* Custom Categories */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom Categories</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {customCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm rounded-full"
              >
                {category}
                <button
                  onClick={() => handleRemoveCategory(category)}
                  disabled={loading}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add Category Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Enter new category name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <button
              onClick={handleAddCategory}
              disabled={loading || !newCategory.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subcategories Section */}
      <div>
        <div className="flex items-center mb-4">
          <Tag className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subcategories</h3>
        </div>

        {/* Default Subcategories */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Default Subcategories</h4>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SUBCATEGORIES.map((subcategory) => (
              <span
                key={subcategory.id}
                className="inline-flex items-center px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 text-sm rounded-full"
              >
                {subcategory.name}
              </span>
            ))}
          </div>
        </div>

        {/* Custom Subcategories */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom Subcategories</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {customSubcategories.map((subcategory) => (
              <span
                key={subcategory}
                className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm rounded-full"
              >
                {subcategory}
                <button
                  onClick={() => handleRemoveSubcategory(subcategory)}
                  disabled={loading}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add Subcategory Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
              placeholder="Enter new subcategory name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <button
              onClick={handleAddSubcategory}
              disabled={loading || !newSubcategory.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conditions Section */}
      <div>
        <div className="flex items-center mb-4">
          <Award className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conditions</h3>
        </div>

        {/* Default Conditions */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Default Conditions</h4>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CONDITIONS.map((condition) => (
              <span
                key={condition.id}
                className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 text-sm rounded-full"
              >
                {condition.name}
              </span>
            ))}
          </div>
        </div>

        {/* Custom Conditions */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom Conditions</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {customConditions.map((condition) => (
              <span
                key={condition}
                className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm rounded-full"
              >
                {condition}
                <button
                  onClick={() => handleRemoveCondition(condition)}
                  disabled={loading}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add Condition Form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
              placeholder="Enter new condition name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <button
              onClick={handleAddCondition}
              disabled={loading || !newCondition.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};