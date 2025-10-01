import React, { useState, useEffect } from 'react';
import { X, ExternalLink, DollarSign, Calendar, Package, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Loader as Loader2 } from 'lucide-react';
import { useEbayIntegration } from '../../hooks/useEbayIntegration';
import { useAuth } from '../../contexts/AuthContext';
import type { InventoryItem } from '../../hooks/useInventory';

interface EbayListingModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onListingCreated?: (listingUrl: string) => void;
}

export const EbayListingModal: React.FC<EbayListingModalProps> = ({
  item,
  isOpen,
  onClose,
  onListingCreated,
}) => {
  const { user } = useAuth();
  const { 
    loading, 
    error, 
    checkEbayConnection, 
    connectToEbay, 
    listItemOnEbay, 
    getEbayCategories 
  } = useEbayIntegration();

  const [isConnected, setIsConnected] = useState(false);
  const [ebayCategories, setEbayCategories] = useState<any[]>([]);
  const [listingData, setListingData] = useState({
    title: `${item.manufacturer ? item.manufacturer + ' ' : ''}${item.name}${item.pattern ? ' - ' + item.pattern : ''}`,
    description: `${item.description || ''}\n\nManufacturer: ${item.manufacturer || 'Unknown'}\nPattern: ${item.pattern || 'N/A'}\nCondition: ${item.condition}\nYear: ${item.year_manufactured || 'Unknown'}\n\nFrom a smoke-free home. Please see photos for exact condition.`,
    category_id: '',
    start_price: Math.max(item.current_value * 0.7, 1),
    buy_it_now_price: item.current_value || 0,
    duration: 7,
    condition: mapConditionToEbay(item.condition),
    shipping_cost: 0,
    return_policy: '30 days',
    payment_methods: ['PayPal', 'Credit Card'],
  });
  const [step, setStep] = useState<'connect' | 'configure' | 'listing' | 'success'>('connect');
  const [listingResult, setListingResult] = useState<any>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async () => {
    const connected = await checkEbayConnection();
    setIsConnected(connected);
    
    if (connected) {
      setStep('configure');
      loadEbayCategories();
    } else {
      setStep('connect');
    }
  };

  const loadEbayCategories = async () => {
    const { categories, error } = await getEbayCategories();
    if (categories) {
      setEbayCategories(categories);
    }
  };

  const handleConnectEbay = async () => {
    setPopupBlocked(false);
    const { authUrl, error } = await connectToEbay();
    
    if (authUrl) {
      // Extract session ID from the auth URL
      const sessionIdMatch = authUrl.match(/SessID=([^&]+)/);
      const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;
      
      if (!sessionId) {
        console.error('No session ID found in auth URL');
        return;
      }

      console.log('Opening eBay auth window with URL:', authUrl);
      console.log('Session ID extracted:', sessionId);
      
      // Open eBay auth in new window
      const authWindow = window.open(authUrl, 'ebay-auth', 'width=600,height=700');
      
      if (!authWindow) {
        console.error('Popup blocked! Please allow popups for this site.');
        setPopupBlocked(true);
        return;
      }
      
      // Listen for auth completion by polling the connection status
      const checkAuth = setInterval(async () => {
        try {
          // Check if window is closed (user completed or cancelled auth)
          if (authWindow?.closed) {
            console.log('Auth window closed, checking connection...');
            
            // Try to complete the authentication with the session ID
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-auth`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'handle_callback',
                sessionId: sessionId,
                user_id: user.id,
                username: user.email,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log('Callback response:', result);
              if (result.success) {
                clearInterval(checkAuth);
                setIsConnected(true);
                setStep('configure');
                loadEbayCategories();
                console.log('eBay authentication successful!');
              } else {
                console.log('Authentication not yet complete:', result);
              }
            } else {
              const errorData = await response.json();
              console.log('Authentication check failed:', errorData);
              clearInterval(checkAuth);
            } 
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
        }
      }, 2000);
      
      // Stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkAuth);
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
        console.log('Auth timeout - stopped checking after 5 minutes');
      }, 300000);
    } else if (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  const handleCreateListing = async () => {
    setStep('listing');
    
    const { result, error } = await listItemOnEbay(item.id, {
      ...listingData,
      photos: item.photo_url ? [item.photo_url] : [],
    });

    if (result) {
      setListingResult(result);
      setStep('success');
      if (onListingCreated) {
        onListingCreated(result.listing_url);
      }
    } else {
      setStep('configure');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3">
              <ExternalLink className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                List on eBay
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                ['connect', 'configure', 'listing', 'success'].indexOf(step) >= 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-12 h-1 ${
                ['configure', 'listing', 'success'].indexOf(step) >= 0
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                ['configure', 'listing', 'success'].indexOf(step) >= 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-12 h-1 ${
                ['listing', 'success'].indexOf(step) >= 0
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                ['success'].indexOf(step) >= 0
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Connect Step */}
          {step === 'connect' && (
            <div className="text-center space-y-6">
              {popupBlocked && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <div className="text-left">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Popup Blocked
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Your browser blocked the eBay authentication popup. Please allow popups for this site and try again.
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                        Look for a popup blocker icon in your browser's address bar and click "Always allow popups from this site"
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <ExternalLink className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Connect to eBay
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect your eBay account to list items directly from MyGlassCase. 
                  You'll only need to do this once per month.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What you'll need:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Active eBay seller account</li>
                  <li>• PayPal account linked to eBay</li>
                  <li>• Store or basic selling subscription (recommended)</li>
                </ul>
              </div>

              <button
                onClick={handleConnectEbay}
                disabled={loading}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Connect eBay Account
                  </>
                )}
              </button>
            </div>
          )}

          {/* Configure Step */}
          {step === 'configure' && (
            <div className="space-y-6">
              <div className="flex items-center text-green-600 dark:text-green-400 mb-4">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">eBay account connected</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Item Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item Preview</h3>
                  
                  {item.photo_url && (
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{item.name}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Manufacturer: {item.manufacturer || 'Unknown'}</p>
                      <p>Pattern: {item.pattern || 'N/A'}</p>
                      <p>Condition: {item.condition}</p>
                      <p>Current Value: ${item.current_value}</p>
                    </div>
                  </div>
                </div>

                {/* Listing Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Listing Details</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={listingData.title}
                      onChange={(e) => setListingData({ ...listingData, title: e.target.value })}
                      maxLength={80}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {listingData.title.length}/80 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      eBay Category
                    </label>
                    <select
                      value={listingData.category_id}
                      onChange={(e) => setListingData({ ...listingData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select category</option>
                      {ebayCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Starting Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.99"
                        value={listingData.start_price}
                        onChange={(e) => setListingData({ ...listingData, start_price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Buy It Now ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={listingData.buy_it_now_price}
                        onChange={(e) => setListingData({ ...listingData, buy_it_now_price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Auction Duration
                    </label>
                    <select
                      value={listingData.duration}
                      onChange={(e) => setListingData({ ...listingData, duration: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value={3}>3 days</option>
                      <option value={5}>5 days</option>
                      <option value={7}>7 days</option>
                      <option value={10}>10 days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={listingData.description}
                      onChange={(e) => setListingData({ ...listingData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateListing}
                  disabled={!listingData.title || !listingData.category_id || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium"
                >
                  Create eBay Listing
                </button>
              </div>
            </div>
          )}

          {/* Listing Step */}
          {step === 'listing' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Creating eBay Listing
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we create your listing on eBay...
                </p>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && listingResult && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Listing Created Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your item has been listed on eBay and is now live for buyers to see.
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  <strong>Listing ID:</strong> {listingResult.listing_id}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Status:</strong> {listingResult.status}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <a
                  href={listingResult.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on eBay
                </a>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function mapConditionToEbay(condition: string): string {
  const conditionMap: { [key: string]: string } = {
    'excellent': 'New',
    'very_good': 'Used',
    'good': 'Used',
    'fair': 'For parts or not working',
    'poor': 'For parts or not working',
  };
  
  return conditionMap[condition.toLowerCase()] || 'Used';
}