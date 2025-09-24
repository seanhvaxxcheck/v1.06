import React, { useState } from 'react';
import { Share2, Plus, Copy, Eye, EyeOff, Trash2, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { useShareLinks, type ShareLink } from '../../hooks/useShareLinks';
import { format } from 'date-fns';

export const ShareLinksManager: React.FC = () => {
  const { 
    shareLinks, 
    loading, 
    createShareLink, 
    updateShareLink, 
    deleteShareLink, 
    generateShareUrl 
  } = useShareLinks();
  
  const [creating, setCreating] = useState(false);
  const [hidePurchasePrice, setHidePurchasePrice] = useState(true);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const result = await createShareLink({ hide_purchase_price: hidePurchasePrice });
      if (result.error) {
        alert(`Failed to create share link: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (link: ShareLink) => {
    try {
      const result = await updateShareLink(link.id, { is_active: !link.is_active });
      if (result.error) {
        alert(`Failed to update share link: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating share link:', error);
      alert('Failed to update share link. Please try again.');
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this share link? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteShareLink(linkId);
      if (result.error) {
        alert(`Failed to delete share link: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting share link:', error);
      alert('Failed to delete share link. Please try again.');
    }
  };

  const handleCopyLink = async (shareId: string, linkId: string) => {
    try {
      const shareUrl = generateShareUrl(shareId);
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share Collection</h3>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">About Collection Sharing</h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Create shareable links to your collection that anyone can view without needing an account. 
          You can control what information is visible and disable links at any time.
        </p>
      </div>

      {/* Create New Share Link */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Create New Share Link</h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hidePurchasePrice"
              checked={hidePurchasePrice}
              onChange={(e) => setHidePurchasePrice(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="hidePurchasePrice" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
              Hide purchase prices (recommended for public sharing)
            </label>
          </div>

          <button
            onClick={handleCreateLink}
            disabled={creating || loading}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Link...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Share Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Existing Share Links */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Your Share Links ({shareLinks.length})
        </h4>

        {shareLinks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No share links created yet. Create your first one above!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shareLinks.map((link) => (
              <div
                key={link.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-all ${
                  link.is_active 
                    ? 'border-gray-200 dark:border-gray-700' 
                    : 'border-gray-300 dark:border-gray-600 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      link.is_active 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Collection Share Link
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Created {format(new Date(link.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(link)}
                      className={`p-2 rounded-full transition-colors ${
                        link.is_active
                          ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={link.is_active ? 'Disable link' : 'Enable link'}
                    >
                      {link.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      title="Delete link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Link URL and Actions */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
                        {generateShareUrl(link.unique_share_id)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={() => handleCopyLink(link.unique_share_id, link.id)}
                        className="flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                      >
                        {copiedLinkId === link.id ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                      
                      <a
                        href={generateShareUrl(link.unique_share_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </div>
                  </div>
                </div>

                {/* Settings Display */}
                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                  <span className={`flex items-center ${
                    link.settings?.hide_purchase_price !== false 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {link.settings?.hide_purchase_price !== false ? '🔒' : '👁️'} 
                    {link.settings?.hide_purchase_price !== false ? 'Purchase prices hidden' : 'Purchase prices visible'}
                  </span>
                  <span className={`flex items-center ${
                    link.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                  }`}>
                    {link.is_active ? '✅' : '❌'} {link.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};