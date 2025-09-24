import React, { useState, useEffect } from 'react';
import { Share, Copy, Eye, EyeOff, Plus, Trash2, ExternalLink, CheckCircle, AlertCircle, Globe, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useShareLinks } from '../../hooks/useShareLinks';

export const ShareCollectionManager: React.FC = () => {
  const { user } = useAuth();
  const { shareLinks, loading, createShareLink, deleteShareLink, toggleShareLink, refreshShareLinks } = useShareLinks();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    hide_purchase_price: true,
    hide_purchase_date: false,
    hide_location: false,
    hide_description: false,
    hide_personal_notes: false,
  });
  const [creating, setCreating] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      refreshShareLinks();
    }
  }, [user]);

  const handleCreateLink = async () => {
    if (!user) return;

    setCreating(true);
    try {
      const result = await createShareLink(shareSettings);
      if (result.error) {
        console.error('Error creating share link:', result.error);
      } else {
        setShowCreateForm(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Share Your Collection</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Create shareable links to let others view your collection without needing an account. You control what information is visible.
        </p>
      </div>

      {/* Create New Share Link */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors group"
          >
            <Plus className="h-5 w-5 text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-400 mr-2" />
            <span className="text-gray-600 dark:text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-400 font-medium">
              Create New Share Link
            </span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">Privacy Settings</h4>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
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

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLink}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium"
              >
                {creating ? 'Creating...' : 'Create Share Link'}
              </button>
            </div>
          </div>
        )}
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

                    <div className="flex flex-wrap gap-2 mb-3">
                      {link.settings?.hide_purchase_price && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-xs rounded">
                          Purchase prices hidden
                        </span>
                      )}
                      {link.settings?.hide_purchase_date && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-xs rounded">
                          Purchase dates hidden
                        </span>
                      )}
                      {link.settings?.hide_location && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-xs rounded">
                          Locations hidden
                        </span>
                      )}
                      {link.settings?.hide_description && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-xs rounded">
                          Descriptions hidden
                        </span>
                      )}
                    </div>

                    <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm">
                      <code className="flex-1 text-gray-600 dark:text-gray-400 truncate">
                        {window.location.origin}/share/{link.unique_share_id}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleCopyLink(link.unique_share_id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy link"
                    >
                      {copiedLinkId === link.unique_share_id ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

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
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shareLinks.length === 0 && !showCreateForm && (
        <div className="text-center py-8">
          <Share className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Share Links Yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first share link to let others view your collection
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Share Link
          </button>
        </div>
      )}
    </div>
  );
};