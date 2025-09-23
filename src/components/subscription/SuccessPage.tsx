import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Package, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';
import { supabase } from '../../lib/supabase';

interface SuccessPageProps {
  onNavigate: (page: string) => void; 
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ onNavigate }) => {
  const { profile, user } = useAuth();
  const { getSubscription } = useStripe();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    const handleSuccessPageLogin = async () => {
      // Get session_id from URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      console.log('Success page loaded with session_id:', sessionId);
      console.log('Current user:', user?.id);
      console.log('Auto login attempted:', autoLoginAttempted);
      
      // If user is not logged in and we have a session_id, try to auto-login
      if (!user && sessionId && !autoLoginAttempted) {
        setAutoLoginAttempted(true);
        console.log('Attempting auto-login for checkout session:', sessionId);
        
        try {
          // Call our edge function to get user info from session_id
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-session-login`;
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_id: sessionId }),
          });

          if (response.ok) {
            const { user_email, customer_id } = await response.json();
            console.log('Got user info from session:', { user_email, customer_id });
            
            if (user_email) {
              // Try to sign in the user automatically
              console.log('Attempting to sign in user:', user_email);
              
              // We can't auto-login without password, so we'll show a message
              // Instead, let's just refresh subscription data and continue
              console.log('User needs to be logged in manually');
            }
          } else {
            console.error('Failed to get user info from session');
          }
        } catch (error) {
          console.error('Auto-login error:', error);
        }
      }
    };

    handleSuccessPageLogin();

    // Auto-refresh subscription data after successful checkout
    const fetchSubscription = async () => {
      if (!user) {
        console.log('No user found, skipping subscription fetch');
        setLoading(false);
        return;
      }
      
      try {
        // Add a small delay to ensure Stripe webhook has processed
        await new Promise(resolve => setTimeout(resolve, 2000));
        const subData = await getSubscription();
        setSubscription(subData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user, autoLoginAttempted]);

  const subscribedProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  // If no user is logged in, show login prompt
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Successful!
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your subscription has been activated. Please sign in to access your account.
            </p>

            <button
              onClick={() => {
                // Clear URL params and go back to login
                window.history.replaceState({}, document.title, window.location.pathname);
                window.location.href = '/';
              }}
              className="w-full flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Sign In to Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your subscription is ready and waiting for you!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to MyGlassCase!
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your subscription has been successfully activated. You're now ready to start managing your collection.
          </p>

          {subscribedProduct && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <span className="font-semibold text-green-800 dark:text-green-200">
                  {subscribedProduct.name} Plan Active
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {subscribedProduct.itemLimit === -1 
                  ? 'Unlimited items' 
                  : `Track up to ${subscribedProduct.itemLimit} items`}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('inventory')}
              className="w-full flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              <Package className="h-5 w-5 mr-2" />
              Start Adding Items
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help getting started? Check out our{' '}
              <button
                onClick={() => onNavigate('settings')}
                className="text-green-600 dark:text-green-400 hover:underline"
              >
                settings page
              </button>
              {' '}for more options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};