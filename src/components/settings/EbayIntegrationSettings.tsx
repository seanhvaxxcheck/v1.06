import React, { useState, useEffect } from 'react';
import { ExternalLink, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Unlink, RefreshCw } from 'lucide-react';
import { useEbayIntegration } from '../../hooks/useEbayIntegration';
import { useAuth } from '../../contexts/AuthContext';

export const EbayIntegrationSettings: React.FC = () => {
  const { user } = useAuth();
  const { 
    loading, 
    error, 
    checkEbayConnection, 
    connectToEbay, 
    disconnectEbay 
  } = useEbayIntegration();
  
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setChecking(true);
    const connected = await checkEbayConnection();
    setIsConnected(connected);
    setChecking(false);
  };

  const handleConnect = async () => {
    const { authUrl, error } = await connectToEbay();
    
    if (authUrl) {
      // Open eBay auth in new window
      const authWindow = window.open(authUrl, 'ebay-auth', 'width=600,height=700');
      
      // Listen for auth completion
      const checkAuth = setInterval(async () => {
        const connected = await checkEbayConnection();
        if (connected) {
          clearInterval(checkAuth);
          setIsConnected(true);
          if (authWindow) {
            authWindow.close();
          }
        }
      }, 2000);
      
      // Stop checking after 5 minutes
      setTimeout(() => {
        clearInterval(checkAuth);
        if (authWindow) {
          authWindow.close();
        }
      }, 300000);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your eBay account? You will need to reconnect to list items.')) {
      const { error } = await disconnectEbay();
      if (!error) {
        setIsConnected(false);
      }
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">eBay Integration</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Connect your eBay account to list items directly from MyGlassCase. Authentication lasts for 30 days.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${
              isConnected 
                ? 'bg-green-100 dark:bg-green-900/20' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <ExternalLink className={`h-6 w-6 ${
                isConnected 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                eBay Account
              </h4>
              <div className="flex items-center mt-1">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Not connected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <button
                  onClick={checkConnection}
                  disabled={loading}
                  className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Check
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect eBay
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Development Notice */}
        {isConnected && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
              What you can do:
            </h5>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• List items directly to eBay from your collection</li>
              <li>• Auto-populate listing details from your item data</li>
              <li>• Track listing performance and sales</li>
              <li>• Automatic photo upload to eBay</li>
            </ul>
          </div>
        )}

        {!isConnected && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Benefits of connecting eBay:
            </h5>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• One-click listing from your collection</li>
              <li>• Pre-filled item details and descriptions</li>
              <li>• Automatic photo upload</li>
              <li>• Secure OAuth authentication (expires monthly)</li>
            </ul>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};