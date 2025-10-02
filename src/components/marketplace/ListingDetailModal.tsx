import React, { useState } from 'react';
import { X, MessageCircle, Tag, DollarSign, Package, User, Calendar, Trash2, TriangleAlert as AlertTriangle } from 'lucide-react';
import { MarketplaceListing } from '../../hooks/useMarketplace';
import { useAuth } from '../../contexts/AuthContext';
import { OptimizedImage } from '../inventory/OptimizedImage';
import { format } from 'date-fns';

interface ListingDetailModalProps {
  listing: MarketplaceListing;
  onClose: () => void;
  onContact: (listing: MarketplaceListing) => void;
  onDelete?: (listingId: string) => Promise<void>;
}

const DeleteConfirmationModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}> = ({ onConfirm, onCancel, deleting }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
          Delete this listing?
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          This action cannot be undone. Your listing will be permanently removed from the marketplace.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  onContact,
  onDelete,
}) => {
  const { user } = useAuth();
  const isOwnListing = listing.user_id === user?.id;
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(listing.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Listing Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden mb-4">
                <OptimizedImage
                  src={listing.photo_url}
                  alt={listing.title}
                  className="w-full h-full"
                  fallbackIcon={<Package className="h-24 w-24 text-gray-400" />}
                />
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <span className={`inline-flex px-3 py-1 text-sm rounded-full font-medium ${
                  listing.listing_type === 'sale'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                    : listing.listing_type === 'trade'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
                }`}>
                  {listing.listing_type === 'sale' ? 'For Sale' : listing.listing_type === 'trade' ? 'For Trade' : 'Sale or Trade'}
                </span>
                <span className="inline-flex px-3 py-1 text-sm rounded-full font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {listing.condition}
                </span>
              </div>

              {listing.asking_price && (
                <div className="flex items-center space-x-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  <DollarSign className="h-8 w-8" />
                  <span>{listing.asking_price.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {listing.title}
                </h3>

                <div className="space-y-3">
                  {listing.category && (
                    <div className="flex items-start">
                      <Tag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                        <p className="text-gray-900 dark:text-white font-medium">{listing.category}</p>
                      </div>
                    </div>
                  )}

                  {listing.subcategory && (
                    <div className="flex items-start">
                      <Tag className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Subcategory</p>
                        <p className="text-gray-900 dark:text-white font-medium">{listing.subcategory}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Listed by</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {listing.user_profile?.full_name ? (() => {
                          const nameParts = listing.user_profile.full_name.trim().split(/\s+/);
                          if (nameParts.length >= 2) {
                            const firstName = nameParts[0];
                            const lastInitial = nameParts[nameParts.length - 1][0];
                            return `${firstName} ${lastInitial}.`;
                          }
                          return listing.user_profile.full_name;
                        })() : listing.user_profile?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Listed on</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {format(new Date(listing.created_at), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {listing.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              )}

              {listing.trade_preferences && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Trade Preferences</h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {listing.trade_preferences}
                  </p>
                </div>
              )}

              {!isOwnListing && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Contact Seller button clicked in modal');
                    onContact(listing);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-full font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Contact Seller</span>
                </button>
              )}
              {isOwnListing && onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>Delete Listing</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmationModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          deleting={deleting}
        />
      )}
    </>
  );
};
