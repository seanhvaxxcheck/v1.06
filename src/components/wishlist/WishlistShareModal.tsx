import React, { useState } from 'react';
import { X, Share, Copy, CheckCircle, ExternalLink, Globe, Eye, EyeOff } from 'lucide-react';

interface WishlistShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItem: {
    id: string;
    item_name: string;
    ebay_search_term: string;
    facebook_marketplace_url: string;
    desired_price_max: number | null;
  };
}

export const WishlistShareModal: React.FC<WishlistShareModalProps> = ({
  isOpen,
  onClose,
  wishlistItem,
}) => {
  const [shareSettings, setShareSettings] = useState({
    include_price_limit: true,
    include_search_terms: true,
    include_facebook_url: false,
    public_link: true,
  });
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const generateShareLink = async () => {
    setGenerating(true);
    
    // Simulate API call to create share link
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const shareId = `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const link = `${window.location.origin}/wishlist/share/${shareId}`;
    setShareLink(link);
    setGenerating(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Help me find: ${wishlistItem.item_name}`,
        text: `I'm looking for this item for my collection. Can you help me find it?`,
        url: shareLink,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Share className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Share Wishlist Item
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Item Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {wishlistItem.item_name}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {wishlistItem.ebay_search_term && (
                <p>eBay search: "{wishlistItem.ebay_search_term}"</p>
              )}
              {wishlistItem.desired_price_max && (
                <p>Max price: ${wishlistItem.desired_price_max}</p>
              )}
            </div>
          </div>

          {/* Share Settings */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">What to include:</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.include_search_terms}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, include_search_terms: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Include search terms
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.include_price_limit}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, include_price_limit: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Include price limit
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.include_facebook_url}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, include_facebook_url: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Include Facebook Marketplace link
                </span>
              </label>
            </div>
          </div>

          {/* Generate/Display Share Link */}
          {!shareLink ? (
            <button
              onClick={generateShareLink}
              disabled={generating}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating link...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Generate Share Link
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <code className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {shareLink}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="ml-2 p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                
                {navigator.share && (
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Share with collectors</p>
                <p>Other collectors can view this wishlist item and help you find it. They'll see the search terms and price range you've set.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};