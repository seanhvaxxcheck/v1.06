import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { PublicCollectionView } from './components/shared/PublicCollectionView';
import { PublicWishlistView } from './components/wishlist/PublicWishlistView';
import { PublicWishlistAllView } from './components/wishlist/PublicWishlistAllView';
import { ImageRecognitionPage } from './components/recognition/ImageRecognitionPage';
import { MarketplacePage } from './components/marketplace/MarketplacePage';
import { MessagesPage } from './components/messages/MessagesPage';

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { getSubscription } = useStripe();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [itemIdToOpen, setItemIdToOpen] = useState<string | null>(null);

  // Listen to hash changes for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').split('?')[0];
      if (hash) {
        setCurrentPage(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
      case 'marketplace': return <MarketplacePage />;
      case 'messages': return <MessagesPage />;
      case 'recognition': return <ImageRecognitionPage />;
      case 'wishlist': return <WishlistPage />;
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
          <Routes>
            <Route path="/share/:shareId" element={<PublicCollectionView />} />
            <Route path="/wishlist/share/:shareId" element={<PublicWishlistView />} />
            <Route path="/wishlist/share-all/:shareId" element={<PublicWishlistAllView />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;