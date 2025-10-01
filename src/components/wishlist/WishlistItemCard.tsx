import React from 'react';
import { Search, ExternalLink, DollarSign, Calendar, CircleCheck as CheckCircle, CreditCard as Edit, Trash2, Share, Play, Pause, Globe, Facebook } from 'lucide-react';
import { format } from 'date-fns';
import type { WishlistItem, FoundListing } from '../../hooks/useWishlist';

interface WishlistItemCardProps {
  item: WishlistItem;
  foundListings: FoundListing[];
  isSearching: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onShare: (item: WishlistItem) => void;
  onToggleStatus: (item: WishlistItem) => void;
  onManualSearch: (item: WishlistItem) => void;
}

export const WishlistItemCard: React.FC<WishlistItemCardProps> = ({
  item,
  foundListings,
  isSearching,
  onEdit,
  onDelete,
  onShare,
  onToggleStatus,
  onManualSearch,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group break-inside-avoid mb-4">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {item.item_name}
            </h3>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
            }`}>
              {item.status}
            </span>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onShare(item)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              title="Share wishlist item"
            >
              <Share className="h-3 w-3" />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Edit item"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Delete item"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Search Platforms */}
        <div className="space-y-2 mb-4">
          {item.ebay_search_term && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-white text-xs font-bold">e</span>
              </div>
              <span className="truncate">"{item.ebay_search_term}"</span>
            </div>
          )}
          
          {item.facebook_marketplace_url && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center mr-2 flex-shrink-0">
                <Facebook className="h-2 w-2 text-white" />
              </div>
              <a 
                href={item.facebook_marketplace_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 truncate"
              >
                Facebook Marketplace
              </a>
            </div>
          )}
          
          {item.additional_search_terms && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">"{item.additional_search_terms}"</span>
            </div>
          )}
          
          {item.desired_price_max && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Max: ${item.desired_price_max}</span>
            </div>
          )}
        </div>

        {/* Found Listings Count */}
        {foundListings.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center text-blue-700 dark:text-blue-300">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                {foundListings.length} matching listing{foundListings.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        )}

        {/* Last Checked */}
        {item.last_checked_at && (
          <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Last checked: {format(new Date(item.last_checked_at), 'MMM dd, HH:mm')}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {item.ebay_search_term && (
              <button
                onClick={() => onManualSearch(item)}
                disabled={isSearching}
                className="flex items-center px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-full transition-colors font-medium"
              >
                {isSearching ? (
                  <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                ) : (
                  <Search className="h-3 w-3 mr-1" />
                )}
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            )}
            
            <button
              onClick={() => onToggleStatus(item)}
              className={`flex items-center px-3 py-1.5 text-xs rounded-full transition-colors font-medium ${
                item.status === 'active' 
                  ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                  : 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              }`}
            >
              {item.status === 'active' ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Activate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};