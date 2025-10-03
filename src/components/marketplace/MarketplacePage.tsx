import React, { useState, useMemo } from 'react';
import { Search, ListFilter as Filter, Tag, DollarSign, ArrowUpDown, Package, MessageCircle, User, Plus } from 'lucide-react';
import { useMarketplace, type MarketplaceListing } from '../../hooks/useMarketplace';
import { useMessaging } from '../../hooks/useMessaging';
import { useAuth } from '../../contexts/AuthContext';
import { ListingDetailModal } from './ListingDetailModal';
import { ListItemModal } from './ListItemModal';
import { SuccessModal } from './SuccessModal';
import { OptimizedImage } from '../inventory/OptimizedImage';

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const { listings, loading, deleteListing, fetchListings } = useMarketplace();
  const { getOrCreateConversation } = useMessaging();

  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'sale' | 'trade' | 'both'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const filteredListings = useMemo(() => {
    let filtered = viewMode === 'mine'
      ? listings.filter(listing => listing.user_id === user?.id)
      : listings.filter(listing => listing.user_id !== user?.id);

    console.log('Filtering - viewMode:', viewMode, 'initial count:', filtered.length);
    console.log('Filters - type:', listingTypeFilter);

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        l =>
          l.title.toLowerCase().includes(search) ||
          l.description.toLowerCase().includes(search) ||
          l.category.toLowerCase().includes(search) ||
          (l.subcategory && l.subcategory.toLowerCase().includes(search))
      );
    }

    if (listingTypeFilter !== 'all') {
      filtered = filtered.filter(l => l.listing_type === listingTypeFilter);
      console.log('After type filter:', filtered.length);
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      filtered = filtered.filter(l => l.asking_price !== null && l.asking_price >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filtered = filtered.filter(l => l.asking_price !== null && l.asking_price <= max);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'price_low') {
        return (a.asking_price || 0) - (b.asking_price || 0);
      } else {
        return (b.asking_price || 0) - (a.asking_price || 0);
      }
    });

    console.log('Final filtered count:', filtered.length);
    return filtered;
  }, [listings, user, searchTerm, listingTypeFilter, minPrice, maxPrice, sortBy, viewMode]);

  const handleContactSeller = async (listing: MarketplaceListing) => {
    console.log('Contact seller clicked for listing:', listing.id, 'seller:', listing.user_id);

    if (!user) {
      alert('Please log in to contact sellers');
      return;
    }

    if (listing.user_id === user.id) {
      alert('This is your own listing');
      return;
    }

    try {
      const conversationId = await getOrCreateConversation(listing.user_id, listing.id);
      console.log('Conversation ID:', conversationId);

      if (conversationId) {
        window.location.hash = `#/messages?conversation=${conversationId}`;
      } else {
        alert('Failed to create conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error contacting seller:', error);
      alert('Failed to contact seller. Please try again.');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      const result = await deleteListing(listingId);
      if (result.error) {
        alert(`Failed to delete listing: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">The Exchange</h1>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredListings.length} items
              </span>
            </div>
            <button
              onClick={() => setShowListModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">List Item</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-full p-1 mb-4 w-fit">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              All Listings
            </button>
            <button
              onClick={() => setViewMode('mine')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'mine'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              My Listings
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search marketplace..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden'} sm:block mt-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-3`}>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-full p-1">
              <button
                onClick={() => setListingTypeFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  listingTypeFilter === 'all'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setListingTypeFilter('sale')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  listingTypeFilter === 'sale'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                For Sale
              </button>
              <button
                onClick={() => setListingTypeFilter('trade')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  listingTypeFilter === 'trade'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                For Trade
              </button>
            </div>


            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => setSelectedListing(listing)}
              >
                <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                  <OptimizedImage
                    src={listing.photo_url}
                    alt={listing.title}
                    className="w-full h-full"
                    fallbackIcon={<Package className="h-12 w-12 text-gray-400" />}
                  />

                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex px-3 py-1 text-xs rounded-full font-medium ${
                      listing.listing_type === 'sale'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : listing.listing_type === 'trade'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                    }`}>
                      {listing.listing_type === 'sale' ? 'For Sale' : listing.listing_type === 'trade' ? 'For Trade' : 'Sale/Trade'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {listing.title}
                  </h3>

                  {listing.asking_price && (
                    <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">
                      ${listing.asking_price.toLocaleString()}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {listing.condition}
                    </span>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <User className="h-4 w-4 mr-1" />
                      <span className="text-xs">
                        {listing.user_profile?.full_name || listing.user_profile?.email.split('@')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {listings.length === 0 ? 'No listings yet' : 'No items match your filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {listings.length === 0
                ? 'Be the first to list an item in The Exchange'
                : 'Try adjusting your search criteria'}
            </p>
            {listings.length === 0 && (
              <button
                onClick={() => setShowListModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
              >
                List Your First Item
              </button>
            )}
          </div>
        )}
      </div>

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onContact={handleContactSeller}
          onDelete={handleDeleteListing}
        />
      )}

      {showListModal && (
        <ListItemModal
          onClose={() => setShowListModal(false)}
          onSuccess={async () => {
            setShowListModal(false);
            setShowSuccessModal(true);
            setViewMode('mine');
            await fetchListings();
          }}
        />
      )}

      {showSuccessModal && (
        <SuccessModal onClose={() => setShowSuccessModal(false)} />
      )}
    </div>
  );
};
