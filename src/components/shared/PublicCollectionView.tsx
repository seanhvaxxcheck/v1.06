import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Image as ImageIcon, Calendar, MapPin, Award, ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import { useShareLinks, type SharedCollection } from '../../hooks/useShareLinks';
import { OptimizedImage } from '../inventory/OptimizedImage';
import { format } from 'date-fns';

export const PublicCollectionView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { getSharedCollection } = useShareLinks();
  const [collection, setCollection] = useState<SharedCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedCollection = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await getSharedCollection(shareId);
        
        if (error) {
          setError(error);
        } else {
          setCollection(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    loadSharedCollection();
  }, [shareId, getSharedCollection]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${collection?.owner.name}'s Collection - MyGlassCase`,
          text: `Check out this amazing collection of ${collection?.totalItems} items!`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing or sharing failed
        console.log('Sharing cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shared collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Collection Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'This collection link is invalid, expired, or has been disabled.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Visit MyGlassCase
            </button>
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
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {collection.owner.name}'s Collection
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Shared via MyGlassCase
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Share this collection"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit MyGlassCase
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Collection Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {collection.totalItems}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${collection.totalValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {format(new Date(collection.sharedAt), 'MMM dd, yyyy')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Shared On</p>
            </div>
          </div>
        </div>

        {/* Collection Items - Pinterest Style */}
        {collection.items.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {collection.items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden break-inside-avoid mb-4"
              >
                <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                  <OptimizedImage
                    src={item.photo_url}
                    alt={item.name}
                    className="w-full h-full"
                    fallbackIcon={<ImageIcon className="h-8 w-8 text-gray-400" />}
                  />
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex px-3 py-1 bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 text-xs rounded-full font-medium">
                      {item.category}
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

                  {item.subcategory && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {item.subcategory}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${(item.current_value || 0).toLocaleString()}
                      </p>
                      {!collection.settings.hidePurchasePrice && item.purchase_price && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Paid: ${item.purchase_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {(item.quantity || 0) > 1 && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          Qty: {item.quantity}
                        </p>
                      )}
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                        {item.condition}
                      </span>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-1">
                      {item.pattern && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Pattern: {item.pattern}
                        </p>
                      )}
                      {item.year_manufactured && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Year: {item.year_manufactured}
                        </p>
                      )}
                      {item.location && (
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location}
                        </div>
                      )}
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
              No Items in Collection
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This collection doesn't have any items yet.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Start Your Own Collection
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              MyGlassCase helps collectors organize, track, and share their treasures.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};