import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Search, DollarSign, ExternalLink, ArrowLeft, Globe, Calendar, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import { OptimizedImage } from '../inventory/OptimizedImage';

interface SharedWishlistItem {
  id: string;
  item_name: string;
  category: string;
  subcategory?: string;
  manufacturer?: string;
  pattern?: string;
  year_manufactured?: number;
  desired_price_max?: number;
  condition: string;
  location?: string;
  description?: string;
  photo_url?: string;
  quantity: number;
  status: string;
  created_at: string;
  owner_name: string;
}

export const PublicWishlistView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [wishlistItem, setWishlistItem] = useState<SharedWishlistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedWishlistItem = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-wishlist?itemId=${shareId}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load wishlist item');
        }

        const data = await response.json();
        setWishlistItem(data.wishlistItem);
        
        document.title = `Help find: ${data.wishlistItem.item_name} - MyGlassCase`;
      } catch (err: any) {
        console.error('Error fetching shared wishlist item:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedWishlistItem();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading wishlist item...</p>
        </div>
      </div>
    );
  }

  if (error || !wishlistItem) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Wishlist Item Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || 'This wishlist item may have been removed or the link has expired.'}
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Visit MyGlassCase
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://igymhkccvdlvkfjbmpxp.supabase.co/storage/v1/object/public/item-photos/fa5c3453-f4b9-4a35-bb90-03a30d6c72c9/F11E94A8-7D46-41AA-B474-B6848FC8F2F9.PNG"
                alt="MyGlassCase"
                className="h-8 w-8 mr-3"
              />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Look at {wishlistItem.owner_name}'s Wishlist Item!
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Shared via MyGlassCase Wishlist
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wishlist Item Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Item Photo */}
            <div className="lg:w-1/3">
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                <OptimizedImage
                  src={wishlistItem.photo_url}
                  alt={wishlistItem.item_name}
                  className="w-full h-full"
                  fallbackIcon={<Heart className="h-12 w-12 text-purple-400" />}
                />
              </div>
            </div>
            
            {/* Item Details */}
            <div className="lg:w-2/3">
              <div className="text-center lg:text-left mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {wishlistItem.item_name}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {wishlistItem.owner_name} is looking for this collectible
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wishlistItem.category}</p>
                  </div>
                  {wishlistItem.manufacturer && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Manufacturer</p>
                      <p className="font-medium text-gray-900 dark:text-white">{wishlistItem.manufacturer}</p>
                    </div>
                  )}
                  {wishlistItem.pattern && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pattern</p>
                      <p className="font-medium text-gray-900 dark:text-white">{wishlistItem.pattern}</p>
                    </div>
                  )}
                  {wishlistItem.year_manufactured && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Year</p>
                      <p className="font-medium text-gray-900 dark:text-white">{wishlistItem.year_manufactured}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {wishlistItem.desired_price_max && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Maximum Price</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ${wishlistItem.desired_price_max}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Condition Wanted</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wishlistItem.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity Wanted</p>
                    <p className="font-medium text-gray-900 dark:text-white">{wishlistItem.quantity}</p>
                  </div>
                  {wishlistItem.location && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Preferred Source</p>
                      <p className="font-medium text-gray-900 dark:text-white">{wishlistItem.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {wishlistItem.description && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description & Notes</h4>
                  <p className="text-gray-600 dark:text-gray-400">{wishlistItem.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Search Links */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Search Links
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${wishlistItem.manufacturer || ''} ${wishlistItem.item_name} ${wishlistItem.pattern || ''}`.trim())}&LH_Sold=0&LH_Complete=0`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">e</span>
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Search eBay</span>
              </div>
            </a>

            <a
              href={`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(wishlistItem.item_name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">f</span>
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Facebook</span>
              </div>
            </a>

            <a
              href={`https://www.mercari.com/search/?keyword=${encodeURIComponent(`${wishlistItem.manufacturer || ''} ${wishlistItem.item_name}`.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200 dark:border-red-800"
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-red-500 rounded-sm flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Mercari</span>
              </div>
            </a>

            <a
              href={`https://www.etsy.com/search?q=${encodeURIComponent(`${wishlistItem.manufacturer || ''} ${wishlistItem.item_name} ${wishlistItem.pattern || ''}`.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors border border-orange-200 dark:border-orange-800"
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-orange-500 rounded-sm flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Etsy</span>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://igymhkccvdlvkfjbmpxp.supabase.co/storage/v1/object/public/item-photos/fa5c3453-f4b9-4a35-bb90-03a30d6c72c9/F11E94A8-7D46-41AA-B474-B6848FC8F2F9.PNG"
              alt="MyGlassCase"
              className="h-6 w-6 mr-2"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Powered by MyGlassCase
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            Wishlist item shared on {format(new Date(wishlistItem.created_at), 'MMMM dd, yyyy')}
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            Create Your Own Wishlist
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
};