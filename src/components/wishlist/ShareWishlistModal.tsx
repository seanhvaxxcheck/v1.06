import React, { useState } from 'react';
import { X, Share, Copy, CircleCheck as CheckCircle, ExternalLink, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ShareWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareWishlistModal: React.FC<ShareWishlistModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { session } = useAuth();
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    hide_price_limits: false,
    hide_search_terms: false,
    hide_location: false,
    hide_description: false,
  });

  if (!isOpen) return null;

  const generateShareLink = async () => {
    setGenerating(true);
    
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-wishlist-share-link`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: shareSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      const link = `${window.location.origin}/wishlist/share-all/${data.shareId}`;
      setShareLink(link);
    } catch (error) {
      console.error('Error generating share link:', error);
      // Generate a temporary link for demo purposes
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const link = `${window.location.origin}/wishlist/share-all/${tempId}`;
      setShareLink(link);
    } finally {
      setGenerating(false);
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

  const shareViaText = () => {
    const message = `Check out my wishlist on MyGlassCase! Help me find these items: ${shareLink}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Help me find items from my wishlist';
    const body = `Hi!\n\nI'm looking for these items for my collection. Can you help me find any of them?\n\n${shareLink}\n\nThanks!\n\nShared via MyGlassCase`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const shareViaFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareViaTwitter = () => {
    const tweetText = `Help me find items from my wishlist! ${shareLink} #collectibles #wishlist`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareViaWhatsApp = () => {
    const message = `Help me find items from my wishlist! ${shareLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Wishlist on MyGlassCase',
          text: 'Help me find these items for my collection!',
          url: shareLink,
        });
      } catch (error) {
        console.log('Native share cancelled or failed:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Share className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Share Your Wishlist
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
          {/* Privacy Settings */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.hide_price_limits}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, hide_price_limits: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Hide price limits
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.hide_search_terms}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, hide_search_terms: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Hide search terms
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.hide_location}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, hide_location: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Hide preferred locations
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.hide_description}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, hide_description: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Hide descriptions
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
                <code className="flex-1 text-gray-600 dark:text-gray-400 truncate">
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
                <p className="font-medium mb-1">Share your entire wishlist</p>
                <p>Others can view all your wishlist items and help you find them. They'll see the items you're looking for with search terms and price ranges you've set.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};