import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Calendar, Award, MapPin, Info, Image as ImageIcon, ArrowLeft, ExternalLink } from 'lucide-react';
import { OptimizedImage } from '../inventory/OptimizedImage';
import { format } from 'date-fns';

interface SharedItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  manufacturer?: string;
  pattern?: string;
  year_manufactured?: number;
  current_value: number;
  purchase_price?: number;
  purchase_date?: string;
  condition: string;
  location?: string;
  description?: string;
  photo_url?: string;
  quantity: number;
  created_at: string;
}

interface SharedCollection {
  owner: {
    name: string;
  };
  items: SharedItem[];
  stats: {
    totalItems: number;
    totalValue: number;
    categories: string[];
    manufacturers: string[];
    oldestYear: number;
    newestYear: number;
  };
  settings: {
    hide_purchase_price?: boolean;
    hide_purchase_date?: boolean;
    hide_location?: boolean;
    hide_description?: boolean;
  };
  sharedAt: string;
}

export const PublicCollectionView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [collection, setCollection] = useState<SharedCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedCollection = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-collection?shareId=${shareId}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load collection');
        }

        const data = await response.json();
        setCollection(data.collection);
        
        // Update page title
        document.title = `${data.collection.owner.name}'s Collection - MyGlassCase`;
      } catch (err: any) {
        console.error('Error fetching shared collection:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedCollection();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading collection...</p>
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
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || 'This collection link may have been disabled or removed.'}
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
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
                {collection.owner.name}'s Collection
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Shared via MyGlassCase
            </p>
            <div className="mt-4">
              <a
                href="/"
                className="inline-flex items-center text-green-600 hover:text-green-500 font-medium"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Create your own collection
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Collection Items - Pinterest Style */}
        {collection.items.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {collection.items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden break-inside-avoid mb-4"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-700">
                  <OptimizedImage
                    src={item.photo_url}
                    alt={item.name}
                    className="w-full h-full"
                    fallbackIcon={<ImageIcon className="h-12 w-12 text-gray-400" />}
                  />
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex px-3 py-1 bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 text-xs rounded-full font-medium backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
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
                      {!collection.settings.hide_purchase_price && item.purchase_price && (
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
                    {!collection.settings.hide_location && item.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.location}
                      </p>
                    )}
                    {!collection.settings.hide_description && item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Items to Display
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This collection appears to be empty or all items are private.
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
            Collection shared on {format(new Date(collection.sharedAt), 'MMMM dd, yyyy')}
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            Start Your Own Collection
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
};