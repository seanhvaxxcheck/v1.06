import React, { useState } from 'react';
import { X, Share, Copy, CircleCheck as CheckCircle, ExternalLink, Globe, Eye, EyeOff } from 'lucide-react';
import { useShareLinks } from '../../hooks/useShareLinks';

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareCollectionModal: React.FC<ShareCollectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { shareLinks, loading, createShareLink, deleteShareLink, toggleShareLink, refreshShareLinks } = useShareLinks();
  const [shareSettings, setShareSettings] = useState({
    hide_purchase_price: true,
    hide_purchase_date: false,
    hide_location: false,
    hide_description: false,
    hide_personal_notes: false,
  });
  const [creating, setCreating] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      refreshShareLinks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const result = await createShareLink(shareSettings);
      if (result.error) {
        console.error('Error creating share link:', result.error);
      } else {
        // Reset to default settings
        setShareSettings({
          hide_purchase_price: true,
          hide_purchase_date: false,
          hide_location: false,
          hide_description: false,
          hide_personal_notes: false,
        });
      }
    } catch (error) {
      console.error('Error creating share link:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async (shareId: string) => {
    const shareUrl = `${window.location.origin}/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLinkId(shareId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Are you sure you want to delete this share link? This action cannot be undone.')) {
      await deleteShareLink(linkId);
    }
  };

  const handleToggleLink = async (linkId: string, currentStatus: boolean) => {
    await toggleShareLink(linkId, !currentStatus);
  };

  const shareViaText = (shareUrl: string) => {
    const message = `Check out my collection on MyGlassCase! ${shareUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
  };

  const shareViaEmail = (shareUrl: string) => {
    const subject = 'Check out my collection on MyGlassCase';
    const body = `Hi!\n\nI wanted to share my collection with you. Take a look at all my items here:\n\n${shareUrl}\n\nShared via MyGlassCase`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const shareViaFacebook = (shareUrl: string) => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareViaTwitter = (shareUrl: string) => {
    const tweetText = `Check out my collection on MyGlassCase! ${shareUrl} #collectibles #collection`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareViaWhatsApp = (shareUrl: string) => {
    const message = `Check out my collection on MyGlassCase! ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaNativeShare = async (shareUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Collection on MyGlassCase',
          text: 'Check out my collection!',
          url: shareUrl,
        });
      } catch (error) {
        console.log('Native share cancelled or failed:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Share className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Share Your Collection
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
          {/* Create New Share Link */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Create New Share Link</h3>
            
            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Privacy Settings</h4>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.hide_purchase_price}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, hide_purchase_price: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Hide purchase prices (recommended)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shareSettings.hide_purchase_date}
                  onChange={(e) => setShareSettings(prev => ({ ...prev, hide_purchase_date: e.target.checked }))}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Hide purchase dates
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
                  Hide item locations
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

            <button
              onClick={handleCreateLink}
              disabled={creating}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium"
            >
              {creating ? 'Creating...' : 'Create Share Link'}
            </button>
          </div>

          {/* Existing Share Links */}
          {shareLinks.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Your Share Links ({shareLinks.length})</h4>
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <div
                    key={link.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Globe className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Collection Share Link
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            link.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          }`}>
                            {link.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Created {new Date(link.created_at).toLocaleDateString()}
                        </div>

                        <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm mb-3">
                          <code className="flex-1 text-gray-600 dark:text-gray-400 truncate">
                            {window.location.origin}/share/{link.unique_share_id}
                          </code>
                        </div>

                        {/* Share Options */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleCopyLink(link.unique_share_id)}
                            className="flex items-center px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded transition-colors"
                          >
                            {copiedLinkId === link.unique_share_id ? (
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            {copiedLinkId === link.unique_share_id ? 'Copied!' : 'Copy'}
                          </button>

                          {navigator.share && (
                            <button
                              onClick={() => shareViaNativeShare(`${window.location.origin}/share/${link.unique_share_id}`)}
                              className="flex items-center px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded transition-colors"
                            >
                              <Share className="h-3 w-3 mr-1" />
                              Share
                            </button>
                          )}

                          <button
                            onClick={() => shareViaText(`${window.location.origin}/share/${link.unique_share_id}`)}
                            className="flex items-center px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded transition-colors"
                          >
                            💬 Text
                          </button>

                          <button
                            onClick={() => shareViaEmail(`${window.location.origin}/share/${link.unique_share_id}`)}
                            className="flex items-center px-3 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded transition-colors"
                          >
                            📧 Email
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <a
                          href={`/share/${link.unique_share_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Preview"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>

                        <button
                          onClick={() => handleToggleLink(link.id, link.is_active)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title={link.is_active ? 'Disable link' : 'Enable link'}
                        >
                          {link.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Delete link"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shareLinks.length === 0 && (
            <div className="text-center py-8">
              <Share className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Share Links Yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first share link to let others view your collection
              </p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Share your entire collection</p>
                <p>Others can view your collection without needing an account. You control what information is visible through privacy settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};