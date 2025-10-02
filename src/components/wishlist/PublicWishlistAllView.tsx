import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Search, DollarSign, ExternalLink, ArrowLeft, Globe, Calendar, MapPin, Package, Info } from 'lucide-react';
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
  ebay_search_term?: string;
  facebook_marketplace_url?: string;
  additional_search_terms?: string;
}

interface SharedWishlist {
  owner: {
    name: string;
  };
  items: SharedWishlistItem[];
  stats: {
    totalItems: number;
    categories: string[];
    manufacturers: string[];
    oldestYear: number;
    newestYear: number;
  };
  settings: {
    hide_price_limits?: boolean;
    hide_search_terms?: boolean;
    hide_location?: boolean;
    hide_description?: boolean;
  };
  sharedAt: string;
}

export const PublicWishlistAllView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [wishlist, setWishlist] = useState<SharedWishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedWishlist = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-wishlist-all?shareId=${shareId}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load wishlist');
        }

        const data = await response.json();
        setWishlist(data.wishlist);
        
        // Update page title
        document.title = `${data.wishlist.owner.name}'s Wishlist - MyGlassCase`;
      } catch (err: any) {
        console.error('Error fetching shared wishlist:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedWishlist();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Wishlist Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || 'This wishlist may have been removed or the link has expired.'}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://igymhkccvdlvkfjbmpxp.supabase.co/storage/v1/object/public/item-photos/fa5c3453-f4b9-4a35-bb90-03a30d6c72c9/F11E94A8-7D46-41AA-B474-B6848FC8F2F9.PNG"
                alt="MyGlassCase"
                className="h-8 w-8 mr-3"
              />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {wishlist.owner.name}'s Wishlist
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Help find these collectibles • Shared via MyGlassCase
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wishlist Items - Pinterest Style */}
        {wishlist.items.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {wishlist.items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden break-inside-avoid mb-4"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                  <OptimizedImage
                    src={item.photo_url}
                    alt={item.item_name}
                    className="w-full h-full"
                    fallbackIcon={<Heart className="h-12 w-12 text-purple-400" />}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 text-xs rounded-full font-medium">
                      Looking For
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
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
                      {!wishlist.settings.hide_price_limits && item.desired_price_max && (
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
                    {!wishlist.settings.hide_location && item.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.location}
                      </p>
                    )}
                    {!wishlist.settings.hide_description && item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Search Terms */}
                  {!wishlist.settings.hide_search_terms && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Search for:</p>
                      <div className="space-y-1">
                        {item.ebay_search_term && (
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-bold">e</span>
                            </div>
                            <span>"{item.ebay_search_term}"</span>
                          </div>
                        )}
                        {item.additional_search_terms && (
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <Search className="h-3 w-3 mr-2" />
                            <span>"{item.additional_search_terms}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Search Links */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">Quick search:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${item.manufacturer || ''} ${item.item_name} ${item.pattern || ''}`.trim())}&LH_Sold=0&LH_Complete=0`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        <div className="text-center">
                          <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center mx-auto mb-1">
                            <span className="text-white font-bold text-xs">e</span>
                          </div>
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">eBay</span>
                        </div>
                      </a>

                      <a
                        href={`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(item.item_name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        <div className="text-center">
                          <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center mx-auto mb-1">
                            <span className="text-white font-bold text-xs">f</span>
                          </div>
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Facebook</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Wishlist Items
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This wishlist appears to be empty.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
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
            Wishlist shared on {format(new Date(wishlist.sharedAt), 'MMMM dd, yyyy')}
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