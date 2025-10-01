import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Search, DollarSign, ExternalLink, ArrowLeft, Globe, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SharedWishlistItem {
  id: string;
  item_name: string;
  ebay_search_term?: string;
  facebook_marketplace_url?: string;
  additional_search_terms?: string;
  desired_price_max?: number;
  status: string;
  created_at: string;
  share_settings: {
    include_search_terms?: boolean;
    include_price_limit?: boolean;
    include_facebook_url?: boolean;
  };
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
        // This would call a Supabase function to get the shared wishlist item
        // For now, we'll simulate the data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in production this would come from the API
        const mockItem: SharedWishlistItem = {
          id: shareId,
          item_name: 'Fenton Hobnail Milk Glass Vase',
          ebay_search_term: 'fenton hobnail milk glass vase',
          additional_search_terms: 'vintage glass vase collectible',
          desired_price_max: 75,
          status: 'active',
          created_at: new Date().toISOString(),
          share_settings: {
            include_search_terms: true,
            include_price_limit: true,
            include_facebook_url: false,
          },
          owner_name: 'Sarah Johnson',
        };
        
        setWishlistItem(mockItem);
        document.title = `Help find: ${mockItem.item_name} - MyGlassCase`;
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
                Help {wishlistItem.owner_name} Find This Item
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
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {wishlistItem.item_name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {wishlistItem.owner_name} is looking for this collectible
            </p>
          </div>

          {/* Search Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Search Details</h3>
              <div className="space-y-3">
                {wishlistItem.share_settings.include_search_terms && wishlistItem.ebay_search_term && (
                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center mr-3">
                      <span className="text-white text-xs font-bold">e</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">eBay Search</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">"{wishlistItem.ebay_search_term}"</p>
                    </div>
                  </div>
                )}

                {wishlistItem.share_settings.include_search_terms && wishlistItem.additional_search_terms && (
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Additional Terms</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">"{wishlistItem.additional_search_terms}"</p>
                    </div>
                  </div>
                )}

                {wishlistItem.share_settings.include_facebook_url && wishlistItem.facebook_marketplace_url && (
                  <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center mr-3">
                      <span className="text-white text-xs font-bold">f</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Facebook Marketplace</p>
                      <a 
                        href={wishlistItem.facebook_marketplace_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                      >
                        View search <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Preferences</h3>
              <div className="space-y-3">
                {wishlistItem.share_settings.include_price_limit && wishlistItem.desired_price_max && (
                  <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Maximum Price</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">${wishlistItem.desired_price_max}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Added to Wishlist</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(wishlistItem.created_at), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Help */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            How You Can Help
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Search Online</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use the search terms above to look on eBay, Facebook Marketplace, estate sales, or antique shops
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-green-600 dark:text-green-400 text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Check Local Sources</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Visit antique malls, estate sales, thrift stores, and collector shows in your area
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Share with Networks</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share this wishlist item with other collectors, Facebook groups, or collector forums
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Contact the Collector</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Found something? Contact {wishlistItem.owner_name} through MyGlassCase to let them know!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search Links */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Search Links
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {wishlistItem.ebay_search_term && (
              <a
                href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(wishlistItem.ebay_search_term)}&LH_Sold=0&LH_Complete=0`}
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
            )}

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
              href={`https://www.mercari.com/search/?keyword=${encodeURIComponent(wishlistItem.item_name)}`}
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
              href={`https://www.etsy.com/search?q=${encodeURIComponent(wishlistItem.item_name)}`}
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