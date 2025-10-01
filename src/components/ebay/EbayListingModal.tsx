import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, DollarSign, Calendar, Package, 
  CircleAlert as AlertCircle, CircleCheck as CheckCircle, 
  Loader as Loader2 
} from 'lucide-react';
import { useEbayIntegration } from '../../hooks/useEbayIntegration';
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

  useEffect(() => {
    if (isOpen) checkConnection();
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
    const { categories } = await getEbayCategories();
    if (categories) setEbayCategories(categories);
  };

  const handleConnectEbay = async () => {
    // Open popup immediately on user click
    const authWindow = window.open('', 'ebay-auth', 'width=600,height=700');
    if (!authWindow) {
      console.error('Popup blocked');
      return;
    }

    try {
      const { authUrl, error } = await connectToEbay();
      if (!authUrl || error) {
        console.error('Failed to get auth URL:', error);
        authWindow.close();
        return;
      }

      // set popup URL
      authWindow.location.href = authUrl;

      // Extract session ID
      const sessionIdMatch = authUrl.match(/SessID=([^&]+)/);
      const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;

      if (!sessionId) {
        console.error('No session ID found in auth URL');
        authWindow.close();
        return;
      }

      // Poll for completion
      const checkAuth = setInterval(async () => {
        if (authWindow.closed) {
          console.log('Auth window closed, checking connection...');

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ebay-auth`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'handle_callback',
              sessionId,
              // TODO: ensure you pass correct user info from your auth context
              // user_id: user?.id,
              // username: user?.email,
            }),
          });

          clearInterval(checkAuth);

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setIsConnected(true);
              setStep('configure');
              loadEbayCategories();
              console.log('eBay authentication successful');
            } else {
              console.log('Auth not complete:', result);
            }
          } else {
            console.error('Auth check failed', await response.json());
          }
        }
      }, 2000);

      // Kill polling after 5 minutes
      setTimeout(() => {
        clearInterval(checkAuth);
        if (!authWindow.closed) authWindow.close();
        console.log('Auth timeout reached');
      }, 300000);
    } catch (err) {
      console.error('Error during eBay connect:', err);
      authWindow.close();
    }
  };

  const handleCreateListing = async () => {
    setStep('listing');
    const { result } = await listItemOnEbay(item.id, {
      ...listingData,
      photos: item.photo_url ? [item.photo_url] : [],
    });

    if (result) {
      setListingResult(result);
      setStep('success');
      onListingCreated?.(result.listing_url);
    } else {
      setStep('configure');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3">
              <ExternalLink className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">List on eBay</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Steps */}
          {/* ... keep your steps UI as-is, no logic change ... */}

          {/* Connect Step */}
          {step === 'connect' && (
            <div className="text-center space-y-6">
              {/* ... UI as before ... */}
              <button
                onClick={handleConnectEbay}
                disabled={loading}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Connecting...</> : <><ExternalLink className="h-5 w-5 mr-2" />Connect eBay Account</>}
              </button>
            </div>
          )}

          {/* Configure, Listing, Success, Error steps remain unchanged */}
          {/* ... keep your existing JSX for them ... */}

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
  const conditionMap: Record<string, string> = {
    excellent: 'New',
    very_good: 'Used',
    good: 'Used',
    fair: 'For parts or not working',
    poor: 'For parts or not working',
  };
  return conditionMap[condition.toLowerCase()] || 'Used';
}
