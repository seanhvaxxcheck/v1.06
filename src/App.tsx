import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useStripe } from './hooks/useStripe';
import { AuthForm } from './components/auth/AuthForm';
import { SubscriptionPlans } from './components/subscription/SubscriptionPlans';
import { SuccessPage } from './components/subscription/SuccessPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { InventoryManager } from './components/inventory/InventoryManager';
import { WishlistPage } from './components/wishlist/WishlistPage';
import { ImportExportPage } from './components/import-export/ImportExportPage';
import { SettingsPage } from './components/settings/SettingsPage';
import SupabaseDebugInfo from './components/SupabaseDebugInfo';

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { getSubscription } = useStripe();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [itemIdToOpen, setItemIdToOpen] = useState<string | null>(null);

  // Check for success page from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      console.log('Stripe checkout session detected:', sessionId);
      setCurrentPage('success');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check subscription status when user is authenticated
  useEffect(() => {
    const checkSubscription = async () => {
      if (user) {
        setSubscriptionLoading(true);
        try {
          const subData = await getSubscription();
          console.log('Subscription data fetched:', subData);
          setSubscription(subData); // null means free tier
        } catch (error) {
          console.error('Error fetching subscription:', error);
          setSubscription(null);
        } finally {
          setSubscriptionLoading(false);
        }
      }
    };
    checkSubscription();
  }, [user]);

  // Enhanced page change handler that can accept an item ID
  const handlePageChange = (page: string, itemId?: string) => {
    setCurrentPage(page);
    if (itemId) {
      setItemIdToOpen(itemId);
    }
  };

  // Callback for when inventory item modal is opened
  const handleInventoryItemOpened = () => {
    setItemIdToOpen(null);
  };

  // Only new users without accounts need to subscribe
  const needsSubscription = () => {
    if (subscriptionLoading) return false;

    // Check if user has an active free subscription
    if (profile?.subscription_status === 'active' && profile?.subscription_tier === 'free') {
      console.log('User has active free subscription - no subscription selection needed');
      return false;
    }

    // Always require subscription selection if no active subscription
    if (!subscription) {
      console.log('No subscription found - directing to subscription plans');
      return true;
    }

    // If user has subscription, check if it's in an inactive state
    const inactiveStatuses = [
      'canceled', 'cancelled', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'not_started'
    ];
    const needsSubscription = inactiveStatuses.includes(subscription.subscription_status);
    console.log('Subscription status check:', {
      status: subscription.subscription_status,
      needsSubscription,
      priceId: subscription.price_id
    });
    return needsSubscription;
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading MyGlassCase...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm mode={authMode} onModeChange={setAuthMode} />;
  }

  // Show subscription plans only for users who need them
  if (needsSubscription() && currentPage !== 'subscription' && currentPage !== 'success') {
    return <SubscriptionPlans onNavigate={setCurrentPage} subscription={subscription} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardHome onPageChange={handlePageChange} subscription={subscription} />;
      case 'inventory': return <InventoryManager itemIdToOpen={itemIdToOpen} onItemOpened={handleInventoryItemOpened} />;
      // TODO: WISHLIST FEATURE - Uncomment the line below to reactivate wishlist
      // case 'wishlist': return <WishlistPage />;
      case 'wishlist':
      case 'wishlist-coming-soon':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Pinterest-style Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Wishlist
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Track items you're looking for with automated monitoring
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Heart className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Wishlist Coming Soon!
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  We're working hard to bring you an amazing wishlist feature where you can track items you want to add to your collection, set price alerts, and get notified when they become available.
                </p>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    What to expect:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Smart Search</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Automatically monitor eBay and other platforms</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Price Alerts</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when items match your budget</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Save Searches</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Store your favorite search terms and filters</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Quick Add</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Easily move wishlist items to your collection</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentPage('inventory')}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-medium transition-colors text-lg"
                >
                  Explore Your Collection
                </button>
              </div>
            </div>
          </div>
        );
      case 'import-export': return <ImportExportPage />;
      case 'settings': return <SettingsPage />;
      case 'subscription': return <SubscriptionPlans onNavigate={handlePageChange} subscription={subscription} />;
      case 'success': return <SuccessPage onNavigate={handlePageChange} />;
      case 'debug': return <SupabaseDebugInfo />;
      default: return <DashboardHome onPageChange={handlePageChange} />;
    }
  };

  if (currentPage === 'subscription' || currentPage === 'success') {
    return renderPage();
  }

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderPage()}
    </DashboardLayout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;