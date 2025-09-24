import React, { useEffect, useState } from 'react';
import { X, Crown, Star, Zap, CheckCircle, XCircle } from 'lucide-react';
import { stripeProducts, getProductByPriceId } from '../../stripe-config';
import { useStripe } from '../../hooks/useStripe';
import { UpgradeConfirmationModal } from './UpgradeConfirmationModal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  onCheckoutResult?: (result: 'success' | 'cancelled', message: string) => void;
  currentSubscription?: any;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  feature = "this feature",
  onCheckoutResult,
  currentSubscription
}) => {
  const { createCheckoutSession, loading } = useStripe();

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Debug logging for currentSubscription
  console.log('=== UPGRADE MODAL DEBUG ===');
  console.log('currentSubscription:', currentSubscription);
  console.log('isOpen:', isOpen);
  console.log('feature:', feature);
  console.log('stripeProducts:', stripeProducts);
  console.log('loading:', loading);

  // Handle checkout results from URL parameters
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const checkout = urlParams.get('checkout');
      const sessionId = urlParams.get('session_id');
      
      if (checkout === 'success' && sessionId) {
        // Clear URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Close modal and show success message
        onClose();
        if (onCheckoutResult) {
          onCheckoutResult('success', 'Subscription upgraded successfully! Your new features are now available.');
        }
      } else if (checkout === 'cancelled') {
        // Clear URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Show cancelled message but keep modal open
        if (onCheckoutResult) {
          onCheckoutResult('cancelled', 'Checkout was cancelled. You can try again anytime.');
        }
      }
    }
  }, [isOpen, onClose, onCheckoutResult]);

  if (!isOpen) return null;

  const handleSubscribe = async (priceId: string, plan: any) => {
    console.log('=== UPGRADE BUTTON CLICKED ===');
    console.log('Plan:', plan.name);
    console.log('Price ID:', priceId);
    
    // Show confirmation modal instead of directly subscribing
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;
    
    console.log('=== UPGRADE CONFIRMED ===');
    console.log('Proceeding with checkout for:', selectedPlan.name);
    
    setShowConfirmModal(false);
    await createCheckoutSession(selectedPlan.priceId, 'subscription');
  };

  const handleCancelUpgrade = () => {
    console.log('=== UPGRADE CANCELLED ===');
    setShowConfirmModal(false);
    setSelectedPlan(null);
  };

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'pro':
        return <Crown className="h-6 w-6" />;
      case 'collector':
        return <Zap className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  // Filter out free plans
  const paidPlans = stripeProducts.filter(plan => plan.price > 0);

  // Debug logging for plan filtering
  console.log('=== PLAN FILTERING DEBUG ===');
  console.log('All stripe products:', stripeProducts);
  console.log('Paid plans before filtering:', paidPlans);
  console.log('Current subscription for filtering:', currentSubscription);

  // Helper function to check if a plan is actually an upgrade
  const isActualUpgrade = (plan: any) => {
    console.log(`Checking if ${plan.name} is an upgrade...`);
    console.log('Plan details:', { name: plan.name, price: plan.price, itemLimit: plan.itemLimit });
    
    if (!currentSubscription?.price_id) return true;
    
    const currentProduct = getProductByPriceId(currentSubscription.price_id);
    console.log('Current product from price_id:', currentProduct);
    
    if (!currentProduct) return true;
    
    // Compare item limits - only show as upgrade if new plan has higher limit
    const currentLimit = currentProduct.itemLimit || 0;
    const newLimit = plan.itemLimit || 0;
    
    console.log(`Comparing limits - current: ${currentLimit}, new: ${newLimit}`);
    
    const isUpgrade = newLimit > currentLimit;
    console.log(`Is ${plan.name} an upgrade? ${isUpgrade}`);
    
    return newLimit > currentLimit;
  };

  // Filter plans to show only actual upgrades
  const filteredPlans = paidPlans.filter(plan => {
    console.log(`\n--- Filtering plan: ${plan.name} ---`);
    console.log('Plan price:', plan.price);
    console.log('Plan itemLimit:', plan.itemLimit);
    
    // If no current subscription, show all paid plans
    if (!currentSubscription?.price_id) {
      console.log('No current subscription - showing plan');
      return true;
    }
    
    const currentProduct = getProductByPriceId(currentSubscription.price_id);
    console.log('Current product:', currentProduct);
    
    if (!currentProduct) {
      console.log('No current product found - showing plan');
      return true;
    }
    
    // Compare item limits - only show plans with higher limits
    // Handle unlimited (-1) as always being higher than any finite limit
    const currentLimit = currentProduct.itemLimit || 0;
    const newLimit = plan.itemLimit || 0;
    
    console.log(`Comparing limits: current=${currentLimit}, new=${newLimit}`);
    
    // If new plan has unlimited items (-1), it's always an upgrade from finite limits
    if (newLimit === -1 && currentLimit !== -1) {
      console.log('New plan is unlimited, current is finite - showing plan');
      return true;
    }
    
    // If current plan is unlimited (-1), no upgrades available
    if (currentLimit === -1) {
      console.log('Current plan is unlimited - hiding plan');
      return false;
    }
    
    // For finite limits, show plans with higher limits
    const shouldShow = newLimit > currentLimit;
    console.log(`Should show ${plan.name}? ${shouldShow}`);
    return shouldShow;
  });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upgrade Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {feature} is available for Pro and Collector subscribers only
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className={`grid gap-6 max-w-5xl mx-auto ${
            filteredPlans.length === 1 
              ? 'grid-cols-1 justify-items-center' 
              : 'md:grid-cols-2'
          }`}>
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:scale-105 ${
                  filteredPlans.length === 1 ? 'max-w-md w-full' : ''
                } ${
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
                      {getIcon(plan.name)}
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

                  <button
                    onClick={() => handleSubscribe(plan.priceId, plan)}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-200 ${
                      plan.popular
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Processing...' : 'Upgrade Now'}
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

      {/* Upgrade Confirmation Modal */}
      {selectedPlan && (
        <UpgradeConfirmationModal
          isOpen={showConfirmModal}
          onClose={handleCancelUpgrade}
          onConfirm={handleConfirmUpgrade}
          planName={selectedPlan.name}
          price={selectedPlan.price}
          interval={selectedPlan.interval || 'month'}
          features={selectedPlan.features}
          loading={loading}
        />
      )}
    </div>
  );
};