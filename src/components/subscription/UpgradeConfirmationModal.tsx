import React from 'react';
import { X, AlertCircle, Crown, Star, Zap } from 'lucide-react';

interface UpgradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName: string;
  price: number;
  interval: string;
  features: string[];
  loading?: boolean;
}

export const UpgradeConfirmationModal: React.FC<UpgradeConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  price,
  interval,
  features,
  loading = false
}) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Confirm Upgrade
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Plan Summary */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
                {getIcon(planName)}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {planName} Plan
            </h3>
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ${price}
              </span>
              <span className="text-gray-600 dark:text-gray-300 ml-1">
                /{interval}
              </span>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200 text-center">
              You're about to upgrade to the <strong>{planName}</strong> plan. 
              Your subscription will be updated immediately and you'll be charged the prorated amount.
            </p>
          </div>

          {/* Key Features */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              What you'll get:
            </h4>
            <ul className="space-y-2">
              {features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium"
            >
              {loading ? 'Processing...' : 'Confirm Upgrade'}
            </button>
          </div>

          {/* Fine Print */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              30-day money-back guarantee • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};