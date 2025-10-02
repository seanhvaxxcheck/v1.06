import React, { useState } from 'react';
import { Plus, Search, CreditCard as Edit, Trash2, Heart, DollarSign, Calendar, Play, Pause, CircleAlert as AlertCircle, X, Image as ImageIcon, Package, Share } from 'lucide-react';
import { useWishlist, type WishlistItem } from '../../hooks/useWishlist';
import { WishlistModal } from './WishlistModal';
import { OptimizedImage } from '../inventory/OptimizedImage';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';
import { UpgradeModal } from '../subscription/UpgradeModal';
import { ShareWishlistModal } from './ShareWishlistModal';

interface WishlistPageProps {
  onPageChange?: (page: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onPageChange }) => {
  const { items, loading, deleteItem, updateItem, refreshWishlist } = useWishlist();
  const { user } = useAuth();
  const { getSubscription } = useStripe();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'found'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Check subscription status
  React.useEffect(() => {
    const checkSubscription = async () => {
      if (user) {
        try {
          const subData = await getSubscription();
          setSubscription(subData);
        } catch (error) {
          console.error('Error fetching subscription:', error);
          setSubscription(null);
        }
      }
    };

    checkSubscription();
  }, [user]);

  // Helper function to check if user has Pro or Collector subscription
  const hasProOrCollectorAccess = () => {
    if (!subscription) return false;
    
    const subscribedProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;
    return subscribedProduct && (subscribedProduct.name === 'Pro' || subscribedProduct.name === 'Collector');
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.pattern || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = items.find(item => item.id === id);
    if (item) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleToggleStatus = async (item: WishlistItem) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    await updateItem(item.id, { status: newStatus });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Pinterest-style Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Wishlist
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track items you're looking for with automated monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search wishlist items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Actively Looking</option>
              <option value="found">Found</option>
            </select>

            <button
              onClick={() => {
                if (hasProOrCollectorAccess()) {
                  setModalOpen(true);
                } else {
                  setUpgradeFeature('Wishlist feature');
                  setUpgradeModalOpen(true);
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add to wishlist</span>
            </button>
          </div>

          {/* Share Wishlist Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Share Wishlist"
          >
            <Share className="h-5 w-5" />
          </button>
        </div>

        {/* Wishlist Items - Pinterest Style */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your wishlist ({filteredItems.length})
            </h2>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Heart className="h-4 w-4 mr-1" />
              Items you want
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Start your wishlist
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Add items you're looking for to track what you want to find
                </p>
                {hasProOrCollectorAccess() ? (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
                  >
                    Add your first wish
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Wishlist feature requires a Pro or Collector subscription.
                    </p>
                    <button
                      onClick={() => {
                        setUpgradeFeature('Wishlist feature');
                        setUpgradeModalOpen(true);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group break-inside-avoid mb-4"
                > 
                  {/* Image */}
                  <div 
                    className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700 cursor-pointer"
                    onClick={() => handleEdit(item)}
                  >
                    <OptimizedImage
                      src={item.photo_url}
                      alt={item.item_name}
                      className="w-full h-full"
                      fallbackIcon={<Heart className="h-12 w-12 text-gray-400" />}
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                      }`}>
                        {item.status === 'active' ? 'Looking' : 'Found'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => handleEdit(item)}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {item.item_name}
                    </h3>
                    
                    {item.manufacturer && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.manufacturer}
                      </p>
                    )}

                    {item.subcategory && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.subcategory}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        {item.desired_price_max && (
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            Max: ${item.desired_price_max.toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        {(item.quantity || 0) > 1 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                            Want: {item.quantity}
                          </p>
                        )}
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                          {item.condition}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-3 space-y-1">
                      {item.pattern && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Pattern: {item.pattern}
                        </p>
                      )}
                      {item.year_manufactured && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Year: {item.year_manufactured}
                        </p>
                      )}
                      {item.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Source: {item.location}
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Remove from wishlist
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to remove "{itemToDelete.item_name}" from your wishlist?
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <WishlistModal
          item={editingItem}
          onClose={closeModal}
          onSaved={async () => {
            await refreshWishlist();
          }}
        />
      )}

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
      />

      <ShareWishlistModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};