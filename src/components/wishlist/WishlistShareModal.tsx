import React, { useState } from 'react';
import { X, Share, Copy, CircleCheck as CheckCircle, ExternalLink, Globe } from 'lucide-react';

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
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const generateShareLink = async () => {
    setGenerating(true);
    
    // Generate a link that's tied to this specific wishlist item
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const link = `${window.location.origin}/wishlist/share/${wishlistItem.id}`;
    setShareLink(link);
    setGenerating(false);
  };

  const shareViaText = () => {
    const message = `Help me find this item for my collection: ${wishlistItem.item_name}${wishlistItem.desired_price_max ? ` (Max: $${wishlistItem.desired_price_max})` : ''}\n\n${shareLink}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Help me find: ${wishlistItem.item_name}`;
    const body = `Hi!\n\nI'm looking for this item for my collection:\n\n${wishlistItem.item_name}${wishlistItem.desired_price_max ? `\nMaximum price: $${wishlistItem.desired_price_max}` : ''}\n\nCan you help me find it? Here's the link with more details:\n${shareLink}\n\nThanks!\n\nShared via MyGlassCase`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const shareViaFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}&quote=${encodeURIComponent(`Help me find this collectible: ${wishlistItem.item_name}`)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareViaTwitter = () => {
    const tweetText = `Help me find this collectible: ${wishlistItem.item_name}${wishlistItem.desired_price_max ? ` (Max: $${wishlistItem.desired_price_max})` : ''} ${shareLink} #collectibles #antiques`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareViaWhatsApp = () => {
    const message = `Help me find this item for my collection: ${wishlistItem.item_name}${wishlistItem.desired_price_max ? ` (Max: $${wishlistItem.desired_price_max})` : ''}\n\n${shareLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Help me find: ${wishlistItem.item_name}`,
          text: `I'm looking for this item for my collection${wishlistItem.desired_price_max ? ` (Max: $${wishlistItem.desired_price_max})` : ''}`,
          url: shareLink,
        });
      } catch (error) {
        console.log('Native share cancelled or failed:', error);
      }
    }
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
              {wishlistItem.desired_price_max && (
                <p>Max price: ${wishlistItem.desired_price_max}</p>
              )}
              {wishlistItem.manufacturer && (
                <p>Manufacturer: {wishlistItem.manufacturer}</p>
              )}
              {wishlistItem.pattern && (
                <p>Pattern: {wishlistItem.pattern}</p>
              )}
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

              {/* Share Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Share via:</h4>
                
                {/* Primary Share Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  
                  {navigator.share && (
                    <button
                      onClick={shareViaNativeShare}
                      className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </button>
                  )}
                </div>

                {/* Communication Options */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={shareViaText}
                    className="flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <span className="text-lg mr-2">💬</span>
                    Text
                  </button>
                  
                  <button
                    onClick={shareViaEmail}
                    className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <span className="text-lg mr-2">📧</span>
                    Email
                  </button>
                </div>

                {/* Social Media Options */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={shareViaWhatsApp}
                    className="flex items-center justify-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <span className="text-lg mr-1">📱</span>
                    WhatsApp
                  </button>
                  
                  <button
                    onClick={shareViaFacebook}
                    className="flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <span className="text-lg mr-1">📘</span>
                    Facebook
                  </button>
                  
                  <button
                    onClick={shareViaTwitter}
                    className="flex items-center justify-center px-3 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
                  >
                    <span className="text-lg mr-1">🐦</span>
                    Twitter
                  </button>
                </div>
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