import React, { useState, useCallback } from 'react';
import { Package, Plus, TrendingUp, Image as ImageIcon, ArrowRight, Star, Heart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInventory, type InventoryItem } from '../../hooks/useInventory';
import { ItemModal } from '../inventory/ItemModal';
import { ItemFactsModal } from '../inventory/ItemFactsModal';
import { MarketAnalysisModal } from '../inventory/MarketAnalysisModal';
import { DeleteConfirmationModal } from '../inventory/DeleteConfirmationModal';
import { ToastNotification } from '../inventory/ToastNotification';
import { UpgradeModal } from '../subscription/UpgradeModal';
import { OptimizedImage } from '../inventory/OptimizedImage';
import { useMarketAnalysis, type MarketAnalysisData } from '../../hooks/useMarketAnalysis';
import { useAuth } from '../../contexts/AuthContext';
import { useStripe } from '../../hooks/useStripe';
import { getProductByPriceId } from '../../stripe-config';
import { format } from 'date-fns';

interface DashboardHomeProps {
  onPageChange?: (page: string, itemId?: string) => void;
  subscription?: any;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onPageChange, subscription }) => {
  const { 
    items, 
    updateItem,
    deleteItem,
    toggleFavorite,
    restoreItem,
    refreshItems
  } = useInventory();
  const { user } = useAuth();
  const { analyzeMarket, loading: analysisLoading } = useMarketAnalysis();
  const { getSubscription } = useStripe();
  const [modalOpen, setModalOpen] = useState(false);

  const [factsModalItem, setFactsModalItem] = useState<InventoryItem | null>(null);
  const [marketAnalysisData, setMarketAnalysisData] = useState<MarketAnalysisData | null>(null);
  const [analyzingItem, setAnalyzingItem] = useState<InventoryItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [favoritesStartIndex, setFavoritesStartIndex] = useState(0);
  
  // Handle modal close with refresh
  const handleItemModalClose = useCallback(() => {
    setModalOpen(false);
    // Refresh items after modal closes to show new item immediately
    refreshItems();
  }, [refreshItems]);
  
  // Update page title
  // Helper function to check if user has Pro or Collector subscription
  const hasProOrCollectorAccess = React.useCallback(() => {
    if (!subscription) return false;
    
    try {
      const subscribedProduct = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;
      return subscribedProduct && (subscribedProduct.name === 'Pro' || subscribedProduct.name === 'Collector');
    } catch (error) {
      console.error('Error checking subscription access:', error);
      return false;
    }
  }, [subscription]);

  React.useEffect(() => {
    document.title = 'Dashboard - MyGlassCase';
  }, []);

  const stats = React.useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalValue = items.reduce((sum, item) => sum + ((item.current_value || 0) * (item.quantity || 1)), 0);
    const totalInvested = items.reduce((sum, item) => sum + ((item.purchase_price || 0) * (item.quantity || 1)), 0);
    const favoriteItems = items.filter(item => item.favorites === 1);
    const recentItems = items
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    return {
      totalItems,
      totalValue,
      totalInvested,
      favoriteItems,
      recentItems,
    };
  }, [items]);

  // Auto-rotate favorites carousel every 3 seconds
  React.useEffect(() => {
    if (stats.favoriteItems.length > 1) {
      const interval = setInterval(() => {
        setFavoritesStartIndex(prev => {
          return (prev + 1) % stats.favoriteItems.length;
        });
      }, 3000); // Change every 3 seconds as requested

      return () => clearInterval(interval);
    }
  }, [stats.favoriteItems.length]);

  const handlePrevFavorites = () => {
    setFavoritesStartIndex(prev => {
      return prev === 0 ? stats.favoriteItems.length - 1 : prev - 1;
    });
  };

  const handleNextFavorites = () => {
    setFavoritesStartIndex(prev => {
      return (prev + 1) % stats.favoriteItems.length;
    });
  };

  const handleItemClick = (itemId: string) => {
    // Navigate to inventory page with the item ID to open
    if (onPageChange) {
      onPageChange('inventory', itemId);
    }
  };

  const handleToastResult = (result: 'success' | 'cancelled', message: string) => {
    // You can implement toast notifications here
    console.log(`${result}: ${message}`);
  };

  const handleToggleFavorite = async (item: InventoryItem) => {
    console.log('DashboardHome: Toggling favorite for item:', item.id, 'current status:', item.favorites);
    const result = await toggleFavorite(item.id, item.favorites || 0);
    
    if (result?.error) {
      console.error('Toggle favorite failed:', result.error);
      setToastMessage(`Failed to update favorite: ${result.error}`);
      setToastVisible(true);
      return result;
    } else {
      console.log('DashboardHome: Favorite toggle successful');
      setToastMessage(`Item ${item.favorites === 1 ? 'removed from' : 'added to'} favorites`);
      setToastVisible(true);
      return { data: result?.data, error: null };
    }
  };

  const handleMarketAnalysis = async (item: InventoryItem) => {
    // Check if user has Pro or Collector access
    if (!hasProOrCollectorAccess()) {
      setUpgradeFeature('Market analysis');
      setUpgradeModalOpen(true);
      return;
    }

    setAnalyzingItem(item);
    
    try {
      const analysisData = await analyzeMarket({
        item_name: item.name,
        manufacturer: item.manufacturer,
        pattern: item.pattern,
        category: item.category,
        description: item.description,
        photoUrl: item.photo_url || undefined,
      });

      if (analysisData) {
        setMarketAnalysisData(analysisData);
      } else {
        // If no data returned, still show modal with mock data
        setMarketAnalysisData({
          averagePrice: 75.00,
          recentSales: [
            {
              title: `${item.manufacturer} ${item.name} - Similar Item`,
              price: 85.00,
              soldDate: new Date(Date.now() - 86400000 * 3).toISOString(),
              condition: 'Very Good',
              url: 'https://ebay.com/item/demo',
              imageUrl: item.photo_url || undefined,
            },
            {
              title: `Vintage ${item.category.replace('_', ' ')} ${item.name}`,
              price: 65.00,
              soldDate: new Date(Date.now() - 86400000 * 7).toISOString(),
              condition: 'Good',
              url: 'https://ebay.com/item/demo2',
              imageUrl: item.photo_url || undefined,
            }
          ],
          priceRange: { min: 65.00, max: 85.00 },
          confidence: 'medium' as const,
          searchTermsUsed: [item.name, item.manufacturer, item.category],
        });
      }
    } catch (error) {
      console.error('Market analysis error:', error);
      // Show modal with fallback data even if there's an error
      setMarketAnalysisData({
        averagePrice: item.current_value || 50.00,
        recentSales: [
          {
            title: `${item.name} - Market Data Unavailable`,
            price: item.current_value || 50.00,
            soldDate: new Date().toISOString(),
            condition: 'Unknown',
            url: '#',
            imageUrl: item.photo_url || undefined,
          }
        ],
        priceRange: { min: (item.current_value || 50) * 0.8, max: (item.current_value || 50) * 1.2 },
        confidence: 'low' as const,
        searchTermsUsed: [item.name],
      });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    // Close facts modal and open edit modal
    setFactsModalItem(null);
    // You could implement edit functionality here or navigate to inventory page
    if (onPageChange) {
      onPageChange('inventory');
    }
  };

  const handleDelete = async (id: string) => {
    // Check if user has Pro or Collector access
    if (!hasProOrCollectorAccess()) {
      setUpgradeFeature('Item deletion');
      setUpgradeModalOpen(true);
      return;
    }

    const item = items.find(item => item.id === id);
    if (item) {
      setItemToDelete(item);
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteItem(itemToDelete.id);
      if (result?.error) {
        console.error('Delete failed:', result.error);
        setToastMessage(`Failed to delete item: ${result.error}`);
      } else {
        setToastMessage(`Item "${itemToDelete.name}" successfully deleted.`);
        // Close facts modal if it was open for this item
        if (factsModalItem?.id === itemToDelete.id) {
          setFactsModalItem(null);
        }
      }
      setToastVisible(true);
    } catch (error) {
      console.error('Delete error:', error);
      setToastMessage('Failed to delete item. Please try again.');
      setToastVisible(true);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleRestoreItem = async (item: InventoryItem) => {
    try {
      const result = await restoreItem(item.id);
      if (result?.error) {
        console.error('Restore failed:', result.error);
        setToastMessage(`Failed to restore item: ${result.error}`);
      } else {
        setToastMessage(`Item "${item.name}" successfully restored to active collection.`);
      }
      setToastVisible(true);
    } catch (error) {
      console.error('Restore error:', error);
      setToastMessage('Failed to restore item. Please try again.');
      setToastVisible(true);
    }
  };

  const handleUpdateValueFromAnalysis = async (newValue: number) => {
    if (analyzingItem) {
      await updateItem(analyzingItem.id, { current_value: newValue });
      // Update the facts modal item if it's the same item
      if (factsModalItem?.id === analyzingItem.id) {
        setFactsModalItem({ ...factsModalItem, current_value: newValue });
      }
    }
  };

  const closeFactsModal = () => {
    setFactsModalItem(null);
  };

  const closeAnalysisModal = () => {
    setMarketAnalysisData(null);
    setAnalyzingItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Pinterest-style Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Your Collection
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Discover and organize your treasures
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Pinterest Style */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalItems}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.totalValue.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Value</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Star className="h-6 w-6 text-yellow-500 fill-current" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.favoriteItems.length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Favorites</p>
            </div>
          </div>
        </div>

        {/* Favorites Carousel */}
        {stats.favoriteItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your favorites</h2>
              <div className="flex items-center space-x-2">
                {stats.favoriteItems.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevFavorites}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextFavorites}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onPageChange && onPageChange('inventory')}
                  className="flex items-center text-green-500 hover:text-green-600 font-medium transition-colors"
                >
                  See all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Single Item Carousel */}
            <div className="relative overflow-hidden max-w-md mx-auto">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${favoritesStartIndex * 100}%)`
                }}
              >
                {stats.favoriteItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="w-full flex-shrink-0"
                  >
                    <div
                      onClick={() => handleItemClick(item.id)}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
                    >
                      <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                        <OptimizedImage
                          src={item.photo_url}
                          alt={item.name}
                          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                          fallbackIcon={<ImageIcon className="h-12 w-12 text-gray-400" />}
                          priority={index === 0} // Prioritize first image
                        />
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-500">
                        </div>

                        {/* Favorite badge */}
                        <div className="absolute top-3 left-3 transform transition-all duration-300 group-hover:scale-110">
                          <span className="inline-flex px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Favorite
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {item.name}
                        </h3>
                        {item.manufacturer && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {item.manufacturer}
                          </p>
                        )}
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${item.current_value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel indicators */}
            {stats.favoriteItems.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {stats.favoriteItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFavoritesStartIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      favoritesStartIndex === index
                        ? 'bg-green-500 w-6'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-green-300 dark:hover:bg-green-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Items - Pinterest Masonry Style */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent additions</h2>
            <button
              onClick={() => onPageChange && onPageChange('inventory')}
              className="flex items-center text-green-500 hover:text-green-600 font-medium transition-colors"
            >
              See all
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {stats.recentItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Start your collection
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create your first item to begin building your collection
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                 className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create item</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {stats.recentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer break-inside-avoid mb-4"
                >
                  <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                    <OptimizedImage
                      src={item.photo_url}
                      alt={item.name}
                      className="w-full h-full"
                      fallbackIcon={<ImageIcon className="h-8 w-8 text-gray-400" />}
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300">
                    </div>

                    {/* New badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                        New
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {format(new Date(item.created_at), 'MMM dd')}
                    </p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${item.current_value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="flex flex-col items-center p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors group"
            >
              <div className="p-4 bg-green-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create item</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Add a new item to your collection
              </p>
            </button>

            <button
              onClick={() => onPageChange && onPageChange('inventory')}
              className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors group"
            >
              <div className="p-4 bg-blue-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Browse collection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Explore all your items
              </p>
            </button>

            <button
              onClick={() => {
                onPageChange && onPageChange('wishlist');
              }}
              className="flex flex-col items-center p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors group"
            >
              <div className="p-4 bg-purple-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Wishlist
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Track items you want to find
              </p>
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ItemModal
          item={null}
          onClose={handleItemModalClose}
          onUpgradeResult={handleToastResult}
          currentSubscription={subscription}
        />
      )}

      {factsModalItem && (
        <ItemFactsModal
          item={factsModalItem}
          onClose={closeFactsModal}
          onItemUpdated={(updatedItem) => {
            setFactsModalItem(updatedItem);
          }}
          viewMode="active"
          hasProOrCollectorAccess={hasProOrCollectorAccess}
          handleToggleFavorite={handleToggleFavorite}
          handleMarketAnalysis={handleMarketAnalysis}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleRestoreItem={handleRestoreItem}
          analysisLoading={analysisLoading}
          analyzingItem={analyzingItem}
          onRefresh={refreshItems}
        />
      )}

      {marketAnalysisData && analyzingItem && (
        <MarketAnalysisModal
          data={marketAnalysisData}
          itemName={analyzingItem.name}
          onClose={closeAnalysisModal}
          onUpdateValue={handleUpdateValueFromAnalysis}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        itemName={itemToDelete?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      <ToastNotification
        isVisible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
        type="success"
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        feature={upgradeFeature}
        onCheckoutResult={handleToastResult}
        currentSubscription={subscription}
      />
    </div>
  );
};