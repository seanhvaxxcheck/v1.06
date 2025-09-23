import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

export interface StripeSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export const useStripe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session, useOfflineMode } = useAuth();

  const createCheckoutSession = async (priceId: string, mode: 'subscription' | 'payment' = 'subscription') => {
    console.log('=== CREATING CHECKOUT SESSION ===');
    console.log('User ID:', user?.id);
    console.log('Price ID:', priceId);
    console.log('Mode:', mode);
    console.log('Session exists:', !!session?.access_token);
    
    setLoading(true);
    setError(null);

    try {
      if (!stripePromise) {
        throw new Error('Stripe is not configured. Please check your environment variables.');
      }

      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      // Let's also check for existing customer BEFORE creating checkout
      console.log('🔍 Checking for existing customer before checkout...');
      
      try {
        const { data: existingCustomer, error: customerCheckError } = await supabase
          .from('stripe_customers')
          .select('customer_id, created_at')
          .eq('user_id', user!.id)
          .maybeSingle();
          
        if (customerCheckError) {
          console.error('❌ Error checking for existing customer:', customerCheckError);
        } else if (existingCustomer) {
          console.log('✅ Found existing customer in frontend check:', existingCustomer.customer_id);
          console.log('Customer created at:', existingCustomer.created_at);
        } else {
          console.log('🆕 No existing customer found in frontend check');
        }
      } catch (customerCheckError) {
        console.error('❌ Failed to check for existing customer:', customerCheckError);
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
      console.log('🌐 Making request to:', apiUrl);
      
      // Updated URLs to redirect back to the current page with query parameters
      const requestBody = {
        price_id: priceId,
        mode,
        success_url: `${window.location.origin}${window.location.pathname}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}${window.location.pathname}?checkout=cancelled`,
      };
      
      console.log('📝 Request body:', requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Checkout API error:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const responseData = await response.json();
      console.log('✅ Checkout API response:', responseData);
      
      if (responseData.url) {
        console.log('🚀 Redirecting to checkout URL...');
        window.location.href = responseData.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('❌ Checkout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSubscription = async (): Promise<StripeSubscription | null> => {
    console.log('=== GETTING SUBSCRIPTION ===');
    console.log('User ID:', user?.id);
    console.log('Offline mode:', useOfflineMode);
    
    // If we're in offline mode, return default state immediately
    if (useOfflineMode) {
      console.log('🔄 Using offline mode - returning default subscription state');
      return {
        customer_id: '',
        subscription_id: null,
        subscription_status: 'not_started',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      };
    }

    // Ensure user is authenticated before attempting to fetch
    if (!user) {
      console.log('👤 No authenticated user - returning default subscription state');
      return {
        customer_id: '',
        subscription_id: null,
        subscription_status: 'not_started',
        price_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
      };
    }
    
    try {
      console.log('🔍 Attempting to fetch subscription data for user:', user.id);
      
      // First check if user has a customer record
      console.log('👤 Checking stripe_customers table...');
      const { data: customerData, error: customerError } = await supabase
        .from('stripe_customers')
        .select('customer_id, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerError && customerError.code !== 'PGRST116') {
        console.error('❌ Error fetching customer data:', customerError);
      }

      console.log('👤 Customer data result:', customerData);

      // If no customer found, return default state
      if (!customerData) {
        console.log('👤 No customer record found - returning default subscription state');
        return {
          customer_id: '',
          subscription_id: null,
          subscription_status: 'not_started',
          price_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          payment_method_brand: null,
          payment_method_last4: null,
        };
      }

      // Then get subscription data using customer_id (not user_id)
      console.log('📋 Checking stripe_user_subscriptions view...');
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('stripe_user_subscriptions')
        .select(`
          customer_id,
          subscription_id,
          subscription_status,
          price_id,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          payment_method_brand,
          payment_method_last4
        `)
        .maybeSingle();

      if (subscriptionError) {
        console.error('❌ Supabase subscription error:', subscriptionError);
        console.error('Error code:', subscriptionError.code);
        console.error('Error message:', subscriptionError.message);
        
        // If table doesn't exist, return null gracefully
        if (subscriptionError.code === 'PGRST116' || 
            subscriptionError.message?.includes('does not exist') || 
            subscriptionError.message?.includes('schema cache')) {
          console.log('💡 Stripe subscriptions table not found - this is normal if Stripe is not set up yet');
          return null;
        }
        
        // For other errors, return null to indicate no subscription
        return null;
      }

      // Filter subscription data by customer_id since the view doesn't support filtering
      const userSubscription = subscriptionData && Array.isArray(subscriptionData) 
        ? subscriptionData.find((sub: any) => sub.customer_id === customerData.customer_id)
        : subscriptionData?.customer_id === customerData.customer_id ? subscriptionData : null;

      console.log('✅ Successfully fetched subscription data:', userSubscription);

      // If no subscription data found, check if user has any subscription record
      if (!userSubscription) {
        console.log('📋 No subscription data found');
        
        // Return a default "no subscription" state
        return {
          customer_id: customerData?.customer_id || '',
          subscription_id: null,
          subscription_status: 'not_started',
          price_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          payment_method_brand: null,
          payment_method_last4: null,
        };
      }

      const result = {
        customer_id: userSubscription.customer_id,
        subscription_id: userSubscription.subscription_id,
        subscription_status: userSubscription.subscription_status,
        price_id: userSubscription.price_id,
        current_period_start: userSubscription.current_period_start,
        current_period_end: userSubscription.current_period_end,
        cancel_at_period_end: userSubscription.cancel_at_period_end,
        payment_method_brand: userSubscription.payment_method_brand,
        payment_method_last4: userSubscription.payment_method_last4,
      };
      
      console.log('📋 Returning subscription data:', result);
      return result;
      
    } catch (err: any) {
      console.error('❌ Subscription error:', err);
      console.error('Error stack:', err.stack);
      
      // Return null on error to indicate subscription check failed
      return null;
    }
  };

  // Add a debug function to check customer records
  const debugCustomerRecords = async () => {
    if (!user) {
      console.log('No user for debug check');
      return;
    }

    console.log('=== DEBUG CUSTOMER RECORDS ===');
    console.log('Current user:', user.id, user.email);

    try {
      // Check stripe_customers table
      const { data: customers, error: customersError } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user.id);
        
      console.log('stripe_customers records:', customers);
      if (customersError) console.error('stripe_customers error:', customersError);

      // Check all customers for this user (in case there are duplicates)
      const { data: allCustomers, error: allCustomersError } = await supabase
        .from('stripe_customers')
        .select('*');
        
      console.log('All stripe_customers records:', allCustomers);
      if (allCustomersError) console.error('All customers error:', allCustomersError);

    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return {
    createCheckoutSession,
    getSubscription,
    debugCustomerRecords, // Add this for debugging
    loading,
    error,
  };
};