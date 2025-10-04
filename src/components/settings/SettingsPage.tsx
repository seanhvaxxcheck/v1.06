import React, { useState } from 'react';
import { User, CreditCard, Bell, Shield, Download, Trash2, Upload, FileText, Smartphone, Plus, CreditCard as Edit, LogOut, Monitor, Circle as HelpCircle, Mail, Info, CircleAlert as AlertCircle, CircleCheck as CheckCircle, X, Share } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory } from '../../hooks/useInventory';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';
import { usePWA } from '../../hooks/usePWA';
import { 
  getCustomCategories, 
  saveCustomCategories, 
  getCustomConditions, 
  getCustomSubcategories,
  saveCustomConditions,
  getDeletedDefaultCategories,
  addCustomSubcategory,
  saveDeletedDefaultCategories,
  getDeletedDefaultConditions,
  removeCustomSubcategory,
  saveDeletedDefaultConditions,
  DEFAULT_CATEGORIES,
  saveCustomSubcategories,
  DEFAULT_CONDITIONS,
  DEFAULT_SUBCATEGORIES,
  getAllCategories,
  getAllConditions
} from '../../utils/customFields';
import { UpgradeModal } from '../subscription/UpgradeModal';
import { EbayIntegrationSettings } from './EbayIntegrationSettings';

interface SettingsPageProps {
  onPageChange?: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onPageChange }) => {
  const { profile, user, signOut } = useAuth();
  const { items, addItem } = useInventory();
  const { getSubscription } = useStripe();
  const { requestNotificationPermission, isInstalled } = usePWA();
  const [activeTab, setActiveTab] = useState('profile');
  const [subscription, setSubscription] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customConditions, setCustomConditions] = useState<string[]>([]);
  const [customSubcategories, setCustomSubcategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [editingConditionIndex, setEditingConditionIndex] = useState<number | null>(null);
  const [editingSubcategoryIndex, setEditingSubcategoryIndex] = useState<number | null>(null);
  const [editingConditionValue, setEditingConditionValue] = useState('');
  const [editingSubcategoryValue, setEditingSubcategoryValue] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load deleted defaults
  const [deletedDefaultCategories, setDeletedDefaultCategories] = useState<string[]>([]);
  const [deletedDefaultConditions, setDeletedDefaultConditions] = useState<string[]>([]);

  // Load custom categories and conditions on component mount
  // Load custom categories and conditions on component mount
React.useEffect(() => {
  const loadCustomFields = async () => {
    if (user) {
      try {
        const [categories, conditions, subcategories, deletedCats, deletedConds] = await Promise.all([
          getCustomCategories(user.id),
          getCustomConditions(user.id),
          getCustomSubcategories(user.id),
          getDeletedDefaultCategories(user.id),
          getDeletedDefaultConditions(user.id)
        ]);

        setCustomCategories(categories);
        setCustomConditions(conditions);
        setCustomSubcategories(subcategories);
        setDeletedDefaultCategories(deletedCats);
        setDeletedDefaultConditions(deletedConds);
      } catch (error) {
        console.error('Error loading custom fields:', error);
        // Set empty arrays as fallbacks
        setCustomCategories([]);
        setCustomConditions([]);
        setCustomSubcategories([]);
        setDeletedDefaultCategories([]);
        setDeletedDefaultConditions([]);
      }
    }
  };

  loadCustomFields();
}, [user]);

  React.useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        const subData = await getSubscription();
        setSubscription(subData);
      }
    };
    fetchSubscription();
  }, [user]);

  const subscribedProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'subscription', name: 'My Plan', icon: CreditCard },
    { id: 'categories', name: 'My Categories', icon: FileText },
    //{ id: 'notifications', name: 'Notifications', icon: Bell },
    //{ id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'import-export', name: 'Backup & Restore', icon: Upload },
    { id: 'support', name: 'Support', icon: HelpCircle },
  ];

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const updatedCategories = [...customCategories, newCategory.trim()];
      setCustomCategories(updatedCategories);
      saveCustomCategories(updatedCategories, user?.id);
      setNewCategory('');
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      const updatedConditions = [...customConditions, newCondition.trim()];
      setCustomConditions(updatedConditions);
      saveCustomConditions(updatedConditions, user?.id);
      setNewCondition('');
    }
  };

  const handleEditCategory = (index: number, value: string) => {
    setEditingCategoryIndex(index);
    setEditingCategoryValue(value);
  };

  const handleEditCondition = (index: number, value: string) => {
    setEditingConditionIndex(index);
    setEditingConditionValue(value);
  };

  const handleSaveCategory = (index: number) => {
    if (editingCategoryValue.trim()) {
      const updated = [...customCategories];
      updated[index] = editingCategoryValue.trim();
      setCustomCategories(updated);
      saveCustomCategories(updated, user?.id);
    }
    setEditingCategoryIndex(null);
    setEditingCategoryValue('');
  };

  const handleSaveCondition = (index: number) => {
    if (editingConditionValue.trim()) {
      const updated = [...customConditions];
      updated[index] = editingConditionValue.trim();
      setCustomConditions(updated);
      saveCustomConditions(updated, user?.id);
    }
    setEditingConditionIndex(null);
    setEditingConditionValue('');
  };

  const handleDeleteCategory = (index: number) => {
    const updated = customCategories.filter((_, i) => i !== index);
    setCustomCategories(updated);
    saveCustomCategories(updated, user?.id);
  };

  const handleDeleteCondition = (index: number) => {
    const updated = customConditions.filter((_, i) => i !== index);
    setCustomConditions(updated);
    saveCustomConditions(updated, user?.id);
  };

  const handleDeleteDefaultCategory = (categoryName: string) => {
    const updated = [...deletedDefaultCategories, categoryName];
    setDeletedDefaultCategories(updated);
    saveDeletedDefaultCategories(updated, user?.id);
  };

  const handleDeleteDefaultCondition = (conditionName: string) => {
    const updated = [...deletedDefaultConditions, conditionName];
    setDeletedDefaultConditions(updated);
    saveDeletedDefaultConditions(updated, user?.id);
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim()) {
      const updatedSubcategories = [...customSubcategories, newSubcategory.trim()];
      setCustomSubcategories(updatedSubcategories);
      saveCustomSubcategories(updatedSubcategories, user?.id);
      setNewSubcategory('');
    }
  };

  const handleEditSubcategory = (index: number, value: string) => {
    setEditingSubcategoryIndex(index);
    setEditingSubcategoryValue(value);
  };

  const handleSaveSubcategory = (index: number) => {
    if (editingSubcategoryValue.trim()) {
      const updated = [...customSubcategories];
      updated[index] = editingSubcategoryValue.trim();
      setCustomSubcategories(updated);
      saveCustomSubcategories(updated, user?.id);
    }
    setEditingSubcategoryIndex(null);
    setEditingSubcategoryValue('');
  };

  const handleDeleteSubcategory = (index: number) => {
    const updated = customSubcategories.filter((_, i) => i !== index);
    setCustomSubcategories(updated);
    saveCustomSubcategories(updated, user?.id);
  };

  const exportAllData = () => {
    const data = {
      profile,
      inventory: items,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collector-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Category', 'Manufacturer', 'Pattern', 'Year', 'Quantity',
      'Purchase Price', 'Current Value', 'Condition', 'Location', 'Description'
    ];
    
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.name}"`,
        `"${item.category}"`,
        `"${item.manufacturer}"`,
        `"${item.pattern}"`,
        item.year_manufactured || '',
        item.quantity || 1,
        item.purchase_price,
        item.current_value,
        `"${item.condition}"`,
        `"${item.location}"`,
        `"${item.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = {
      collection: items,
      exportedAt: new Date().toISOString(),
      totalItems: items.length,
      categories: {
        milk_glass: items.filter(item => item.category === 'milk_glass').length,
        jadite: items.filter(item => item.category === 'jadite').length,
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
        data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return headers.reduce((obj, header, index) => {
            obj[header.replace(/\s+/g, '_')] = values[index] || '';
            return obj;
          }, {} as any);
        });
      } else if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(text);
        data = Array.isArray(jsonData) ? jsonData : jsonData.collection || jsonData.items || [];
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON files.');
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const [index, row] of data.entries()) {
        try {
          // Map common column variations to our expected format
          const name = row.name || row.item_name || row.title || row.description || `Imported Item ${index + 1}`;
          const category = (row.category || row.type || '').toLowerCase();
          
          // Map category variations to our custom categories
          let mappedCategory = 'Jadite'; // default
          if (category.includes('milk') || category.includes('white')) {
            mappedCategory = 'Milk Glass';
          } else if (category.includes('jadite') || category.includes('jadeite') || category.includes('jade') || category.includes('green')) {
            mappedCategory = 'Jadite';
          } else {
            // Try to match against user's custom categories
            const userCategories = getAllCategories(user?.id);
            const matchedCategory = userCategories.find(cat => 
              cat.name.toLowerCase().includes(category) || category.includes(cat.name.toLowerCase())
            );
            if (matchedCategory) {
              mappedCategory = matchedCategory.name;
            }
          }

          // Map condition variations
          let mappedCondition = 'good';
          const condition = (row.condition || '').toLowerCase();
          if (condition.includes('excellent') || condition.includes('mint')) {
            mappedCondition = 'excellent';
          } else if (condition.includes('very good') || condition.includes('very_good')) {
            mappedCondition = 'very_good';
          } else if (condition.includes('fair')) {
            mappedCondition = 'fair';
          } else if (condition.includes('poor')) {
            mappedCondition = 'poor';
          }

          const itemData = {
            name: name,
            category: mappedCategory,
            manufacturer: row.manufacturer || row.brand || row.maker || '',
            pattern: row.pattern || row.design || '',
            year_manufactured: row.year_manufactured || row.year || row.date ? Number(row.year_manufactured || row.year || row.date) : null,
            quantity: row.quantity || row.qty || row.amount ? Number(row.quantity || row.qty || row.amount) : 1,
            purchase_price: Number(row.purchase_price || row.paid || row.cost || row.price_paid || 0),
            current_value: Number(row.current_value || row.value || row.worth || row.estimated_value || 0),
            location: row.location || row.storage || row.room || '',
            description: row.description || row.notes || row.details || '',
            condition: mappedCondition as 'excellent' | 'very_good' | 'good' | 'fair' | 'poor',
            photo_url: null,
          };

          const result = await addItem(itemData);
          if (result?.error) {
            errors.push(`Row ${index + 1} (${name}): ${result.error}`);
          } else {
            successCount++;
          }
        } catch (err: any) {
          const itemName = row.name || row.item_name || `Row ${index + 1}`;
          errors.push(`${itemName}: ${err.message}`);
        }
      }

      setImportResults({ success: successCount, errors });
    } catch (error: any) {
      setImportResults({ success: 0, errors: [error.message] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="text-left leading-tight">{tab.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              
              {/* Logout Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={signOut}
                  className="w-full flex items-center px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="text-left leading-tight font-medium">Sign Out</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    My Account
                  </h2>
                  
                  {/* Profile Summary Card */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {(profile?.full_name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {profile?.full_name || 'User'}
                        </h3>
                        <p className="text-green-600 dark:text-green-400">
                          {user?.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Member since {new Date(user?.created_at || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Account Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {items.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Items in Collection
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${items.reduce((sum, item) => sum + (item.current_value * (item.quantity || 1)), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Collection Value
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {subscribedProduct?.name || 'Free'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Current Plan
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={profile?.full_name || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white max-w-md"
                      />
                    </div>
                  </div>

                  {/* Version Information */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          MyGlassCase Version
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Current app version
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm font-medium rounded-full">
                        v1.70
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="p-6 max-w-4xl">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    My Plan Details
                  </h2>
                  <div className="space-y-4">
                    {subscribedProduct ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-200">
                              You have the {subscribedProduct.name} plan
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400 capitalize">
                              Your plan is {subscription.subscription_status || 'active'}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              You pay ${subscribedProduct.price} each month
                            </p>
                          </div>
                          <button
                            onClick={() => window.open('https://billing.stripe.com/p/login/fZu6oG4ep75U23pfQz8k800', '_blank')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                          >
                            Manage My Plan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-1">
                              You have the free plan right now.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              Get more features by upgrading your plan
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setUpgradeFeature('subscription upgrade');
                              setUpgradeModalOpen(true);
                            }}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                          >
                            Choose Better Plan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="p-6 space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    My Categories & Conditions
                  </h2>
                  
                  {/* Categories Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Item Types
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choose what types of items you collect. You can add your own types or remove ones you don't use.
                    </p>
                    
                    <div className="space-y-3">
                      {/* Default Categories */}
                      {DEFAULT_CATEGORIES.filter(cat => !deletedDefaultCategories.includes(cat.name)).map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-gray-900 dark:text-white">{category.name}</span>
                            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                              Built-in
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteDefaultCategory(category.name)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Remove this type"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Custom Categories */}
                      {customCategories.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                          {editingCategoryIndex === index ? (
                            <input
                              type="text"
                              value={editingCategoryValue}
                              onChange={(e) => setEditingCategoryValue(e.target.value)}
                              onBlur={() => handleSaveCategory(index)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory(index)}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{category}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCategory(index, category)}
                              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(index)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add New Category */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                          placeholder="Add a new item type (like 'Depression Glass')"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={handleAddCategory}
                          disabled={!newCategory.trim()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subcategories Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Item Subcategories
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Add subcategories to further organize your items. You can add your own or remove ones you don't use.
                    </p>

                    <div className="space-y-3">
                      {/* Custom Subcategories */}
                      {customSubcategories.map((subcategory, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                          {editingSubcategoryIndex === index ? (
                            <input
                              type="text"
                              value={editingSubcategoryValue}
                              onChange={(e) => setEditingSubcategoryValue(e.target.value)}
                              onBlur={() => handleSaveSubcategory(index)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveSubcategory(index)}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{subcategory}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditSubcategory(index, subcategory)}
                              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(index)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add New Subcategory */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSubcategory}
                          onChange={(e) => setNewSubcategory(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory()}
                          placeholder="Add a new subcategory (like 'Plates' or 'Bowls')"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={handleAddSubcategory}
                          disabled={!newSubcategory.trim()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Conditions Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Item Conditions
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Choose how to describe the condition of your items. You can add your own or remove ones you don't need.
                    </p>
                    
                    <div className="space-y-3">
                      {/* Default Conditions */}
                      {DEFAULT_CONDITIONS.filter(cond => !deletedDefaultConditions.includes(cond.name)).map((condition) => (
                        <div key={condition.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-gray-900 dark:text-white">{condition.name}</span>
                            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                              Built-in
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteDefaultCondition(condition.name)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Remove this condition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Custom Conditions */}
                      {customConditions.map((condition, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                          {editingConditionIndex === index ? (
                            <input
                              type="text"
                              value={editingConditionValue}
                              onChange={(e) => setEditingConditionValue(e.target.value)}
                              onBlur={() => handleSaveCondition(index)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveCondition(index)}
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                              autoFocus
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{condition}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCondition(index, condition)}
                              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCondition(index)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add New Condition */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCondition()}
                          placeholder="Add a new condition (like 'Like New')"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={handleAddCondition}
                          disabled={!newCondition.trim()}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ebay-integration' && <EbayIntegrationSettings />}

              {activeTab === 'import-export' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Import & Export Data
                  </h2>
                  
                  {/* Import Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Import Items to Your Collection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Upload an Excel or CSV file to add multiple items to your collection at once.
                    </p>
                    
                    <div className="space-y-4">
                      {/* Upload Area */}
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Upload Your File
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Supports Excel (.xlsx), CSV (.csv), and JSON files
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={importing}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                          {importing ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Importing...
                            </div>
                          ) : (
                            'Choose File to Import'
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls,.json"
                          onChange={handleFileImport}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Maximum file size: 10MB
                        </p>
                      </div>

                      {/* Import Results */}
                      {importResults && (
                        <div className={`p-4 rounded-lg border ${
                          importResults.errors.length > 0 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        }`}>
                          <div className="flex items-start">
                            {importResults.errors.length > 0 ? (
                              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className={`font-medium ${
                                importResults.errors.length > 0 
                                  ? 'text-yellow-800 dark:text-yellow-200' 
                                  : 'text-green-800 dark:text-green-200'
                              }`}>
                                Import completed: {importResults.success} items successfully imported
                              </p>
                              {importResults.errors.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                                    {importResults.errors.length} errors occurred:
                                  </p>
                                  <div className="max-h-32 overflow-y-auto">
                                    <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                                      {importResults.errors.map((error, index) => (
                                        <li key={index} className="break-words">• {error}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Column Requirements */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                        Required Column Headers
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Required:</h5>
                          <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">name</code> - Item name</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">category</code> - Item type</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Optional:</h5>
                          <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">manufacturer</code> - Brand/maker</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">pattern</code> - Pattern name</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">year_manufactured</code> - Year made</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">quantity</code> - Number of items</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">purchase_price</code> - What you paid</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">current_value</code> - Current worth</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">condition</code> - excellent, very_good, good, fair, poor</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">location</code> - Where it's stored</li>
                            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">description</code> - Additional notes</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Tip:</strong> Column headers are flexible - "Name", "Item Name", or "Title" will all work. 
                          Categories can be any of your custom categories or "Jadite", "Milk Glass", etc.
                        </p>
                      </div>
                    </div>

                    {/* Download Template */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Need a template?</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Download a sample file with the correct column headers
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const headers = [
                            'name', 'category', 'manufacturer', 'pattern', 'year_manufactured', 
                            'quantity', 'purchase_price', 'current_value', 'condition', 'location', 'description'
                          ];
                          
                          const sampleData = [
                            'Fenton Hobnail Vase', 'Milk Glass', 'Fenton', 'Hobnail', '1950', 
                            '1', '25.00', '75.00', 'excellent', 'Display Cabinet', 'Beautiful vintage piece'
                          ];
                          
                          const csvContent = [
                            headers.join(','),
                            sampleData.map(field => `"${field}"`).join(',')
                          ].join('\n');

                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'myglasscase-import-template.csv';
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                      >
                        Download Template
                      </button>
                    </div>
                  </div>

                  {/* Export Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Export Your Collection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Download your collection data for backup or external use.
                    </p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={exportToCSV}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">CSV Format</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Compatible with Excel and spreadsheet applications
                            </p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 text-gray-400" />
                      </button>

                      <button
                        onClick={exportToJSON}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white">JSON Format</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Complete backup with metadata for re-import
                            </p>
                          </div>
                        </div>
                        <Download className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pwa' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Install MyGlassCase on Your Device
                  </h2>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You can install MyGlassCase on your phone or computer just like any other app. 
                      This makes it faster to open and lets you use it even when you don't have internet.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Desktop instructions */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-5 w-5 text-emerald-600" />
                          <h4 className="font-semibold">On Your Computer</h4>
                        </div>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>1. Look for a small download icon <Download className="h-4 w-4 inline" /> next to the web address</li>
                          <li>2. Click it and choose <strong>"Install MyGlassCase"</strong></li>
                          <li>3. MyGlassCase will now open like a regular program</li>
                          <li className="text-xs italic">Works with Chrome, Edge, and Safari browsers</li>
                        </ul>
                      </div>

                      {/* Mobile instructions */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5 text-emerald-600" />
                          <h4 className="font-semibold">On Your Phone or Tablet</h4>
                        </div>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li><strong>iPhone/iPad:</strong> Tap the share button, then "Add to Home Screen"</li>
                          <li><strong>Android:</strong> Tap the menu (three dots), then "Add to Home screen"</li>
                          <li className="text-xs italic">Once installed, it works just like any other app</li>
                        </ul>
                      </div>
                    </div>

                    {/* Benefits box */}
                    <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg">
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
                        Why Install the App:
                      </h4>
                      <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
                        <li>• Opens faster - just tap the icon on your home screen</li>
                        <li>• View your collection even without internet</li>
                        <li>• Feels like a real app, not a website</li>
                        <li>• Get alerts about important updates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'support' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Support & Help
                  </h2>
                  
                  {/* Contact Support */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full mr-4">
                        <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                          Need Help?
                        </h3>
                        <p className="text-green-600 dark:text-green-400">
                          We're here to help with any questions or issues
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                          Email Support:
                        </p>
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700">
                          <span className="font-mono text-green-800 dark:text-green-200">
                            support@myglasscase.com
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('support@myglasscase.com');
                              // You could add a toast notification here
                            }}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-sm hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <a
                          href="mailto:support@myglasscase.com?subject=MyGlassCase Support Request"
                          className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* App Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-full mr-4">
                        <Info className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        App Information
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
                          <span className="inline-flex px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm rounded-full font-medium">
                            v1.70
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Platform</span>
                          <span className="text-sm text-gray-900 dark:text-white">Web App</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                          <span className="text-sm text-gray-900 dark:text-white">September 21, 2025</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                          <span className="inline-flex px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Help Resources */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                      Getting Started
                    </h3>
                    <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
                      <p>• <strong>Add Items:</strong> Click the "Create" button to add items to your collection</p>
                      <p>• <strong>Upload Photos:</strong> Take photos or upload images for each item</p>
                      <p>• <strong>Track Values:</strong> Keep your item values updated for accurate collection worth</p>
                      <p>• <strong>Export Data:</strong> Use the Backup & Restore tab to export your collection</p>
                      <p>• <strong>Upgrade Plans:</strong> Get more features with Pro or Collector plans</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />
    </div>
  );
};