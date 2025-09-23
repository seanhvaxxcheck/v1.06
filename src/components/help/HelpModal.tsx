import React, { useState } from 'react';
import { X, HelpCircle, Plus, Search, Settings, Download, Upload, Crown, Smartphone, Package, Star, Filter, Edit, Trash2, Camera, Heart, TrendingUp, Menu } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isOpen) return null;

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Package },
    { id: 'creating-items', title: 'Creating Items', icon: Plus },
    { id: 'searching-inventory', title: 'Searching & Filtering', icon: Search },
    { id: 'custom-fields', title: 'Custom Categories & Conditions', icon: Settings },
    { id: 'pwa-installation', title: 'Installing the App', icon: Smartphone },
    { id: 'import-export', title: 'Import & Export Data', icon: Download },
    { id: 'subscriptions', title: 'Subscription Plans', icon: Crown },
    { id: 'features', title: 'Advanced Features', icon: Star },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to MyGlassCase!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                MyGlassCase is your personal collection management platform designed specifically for Jadite and other collectibles. Here's how to get started:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Step 1: Add Your First Item
                </h4>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Click the "Create item" button on your dashboard or use the + button in the top navigation to add your first collectible to your inventory.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Step 2: Explore Your Collection
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Navigate to the "Collection" page to view all your items in a beautiful layout. Use search and filters to find specific pieces.
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Step 3: Mark Favorites
                </h4>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  Click on any item to view its details, then use the heart button to mark your favorite pieces. They'll appear in your dashboard in the favorites section.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick Navigation Tips:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Use the bottom navigation on mobile or top navigation on desktop</li>
                <li>• Your dashboard shows collection stats and recent additions</li>
                <li>• The Collection page has all your items with search and filtering</li>
                <li>• Settings page lets you customize categories and manage your account</li>
              </ul>
            </div>
          </div>
        );

      case 'creating-items':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Creating Items</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Adding items to your collection is easy and comprehensive. Here's everything you need to know:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  How to Add a New Item
                </h4>
                <ol className="text-blue-700 dark:text-blue-300 text-sm space-y-2 list-decimal list-inside">
                  <li>Click the "Create item" button on your dashboard or the + button in navigation</li>
                  <li>Fill in the item name (required) and select a category (required)</li>
                  <li>Add optional details like manufacturer, pattern, year, and pricing</li>
                  <li>Upload a photo using the camera or file picker</li>
                  <li>Set the condition and quantity</li>
                  <li>Add location and description for better organization</li>
                  <li>Click "Add Item" to save to your collection</li>
                </ol>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Adding Photos
                </h4>
                <div className="text-green-700 dark:text-green-300 text-sm space-y-2">
                  <p><strong>Camera Option:</strong> Take a photo directly</p>
                  <p><strong>Gallery Option:</strong> Choose an existing photo from your device</p>
                  <p><strong>Tips:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Use good lighting for clear photos</li>
                    <li>Show the item from multiple angles if possible</li>
                    <li>Include any maker's marks or signatures</li>
                    <li>Photos help with identification and valuation</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Required vs Optional Fields</h4>
                <div className="text-yellow-700 dark:text-yellow-300 text-sm">
                  <p className="mb-2"><strong>Required:</strong></p>
                  <ul className="list-disc list-inside ml-4 mb-3">
                    <li>Item Name</li>
                    <li>Category</li>
                  </ul>
                  <p className="mb-2"><strong>Optional but Recommended:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Photo (helps with identification)</li>
                    <li>Manufacturer (increases value accuracy)</li>
                    <li>Current Value (for collection tracking)</li>
                    <li>Condition (affects market value)</li>
                    <li>Quantity (if you have multiple)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'searching-inventory':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Searching & Filtering Your Collection</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Find exactly what you're looking for with powerful search and filtering tools:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Search Functionality
                </h4>
                <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                  <p><strong>What you can search:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Item names (e.g., "vase", "bowl", "plate")</li>
                    <li>Manufacturers (e.g., "Fenton", "Fire-King", "Anchor Hocking")</li>
                    <li>Patterns (e.g., "Hobnail", "Jadeite", "Swirl")</li>
                    <li>Categories and conditions</li>
                    <li>Descriptions and locations</li>
                    <li>Years and prices</li>
                  </ul>
                  <p className="mt-2"><strong>Search Tips:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Search is case-insensitive</li>
                    <li>Partial matches work (searching "Fen" finds "Fenton")</li>
                    <li>Search across multiple fields simultaneously</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtering Options
                </h4>
                <div className="text-green-700 dark:text-green-300 text-sm space-y-2">
                  <p><strong>Category Filter:</strong> Filter by specific categories like Milk Glass, Jadite, or your custom categories</p>
                  <p><strong>Condition Filter:</strong> Show only items in specific conditions (Excellent, Very Good, Good, Fair, Poor)</p>
                  <p><strong>View Modes:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Active:</strong> Shows your current collection items</li>
                    <li><strong>Archived:</strong> Shows items you've archived/deleted</li>
                  </ul>
                  <p><strong>Combining Filters:</strong> Use search + category + condition filters together for precise results</p>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">View Options</h4>
                <div className="text-purple-700 dark:text-purple-300 text-sm space-y-2">
                  <p><strong>Masonry View:</strong> Pinterest-style layout with varying heights</p>
                  <p><strong>Grid View:</strong> Uniform grid layout for consistent browsing</p>
                  <p><strong>Clearing Filters:</strong> Click "Clear all filters" when no results are found to reset all filters</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'custom-fields':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Custom Categories & Conditions</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Customize your collection organization with your own categories and condition types:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Adding Custom Categories
                </h4>
                <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                  <p><strong>Method 1 - From Item Creation:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>When creating/editing an item, click the Category dropdown</li>
                    <li>Select "+ Add New Category" at the bottom</li>
                    <li>Enter your custom category name</li>
                    <li>Click "Add" to save it</li>
                    <li>The new category will be automatically selected for your item</li>
                  </ol>
                  <p className="mt-3"><strong>Method 2 - From Settings:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Go to Settings → Custom Fields</li>
                    <li>Find the "Categories" section</li>
                    <li>Type your new category name in the input field</li>
                    <li>Click the + button to add it</li>
                  </ol>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Adding Custom Conditions</h4>
                <div className="text-green-700 dark:text-green-300 text-sm space-y-2">
                  <p><strong>Method 1 - From Item Creation:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>When creating/editing an item, click the Condition dropdown</li>
                    <li>Select "+ Add New Condition" at the bottom</li>
                    <li>Enter your custom condition name (e.g., "Mint in Box", "Restored")</li>
                    <li>Click "Add" to save it</li>
                  </ol>
                  <p className="mt-3"><strong>Method 2 - From Settings:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Go to Settings → Custom Fields</li>
                    <li>Find the "Conditions" section</li>
                    <li>Type your new condition name</li>
                    <li>Click the + button to add it</li>
                  </ol>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Managing Custom Fields</h4>
                <div className="text-yellow-700 dark:text-yellow-300 text-sm space-y-2">
                  <p><strong>Removing Custom Fields:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Go to Settings → Custom Fields</li>
                    <li>Find the field you want to remove</li>
                    <li>Click the X button next to it</li>
                    <li>Existing items using that field will keep their values</li>
                  </ul>
                  <p className="mt-2"><strong>Best Practices:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Use descriptive names (e.g., "Depression Glass" instead of "DG")</li>
                    <li>Be consistent with naming conventions</li>
                    <li>Consider future organization needs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pwa-installation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Installing MyGlassCase as an App</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Install MyGlassCase on your device for quick access and offline functionality:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Mobile Installation (iOS/Android)
                </h4>
                <div className="text-blue-700 dark:text-blue-300 text-sm space-y-3">
                  <div>
                    <p className="font-medium mb-1">iOS (Safari):</p>
                    <ol className="list-decimal list-inside ml-4 space-y-1">
                      <li>Open MyGlassCase in Safari</li>
                      <li>Tap the Share button (square with arrow up)</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                      <li>The app icon will appear on your home screen</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Android (Chrome):</p>
                    <ol className="list-decimal list-inside ml-4 space-y-1">
                      <li>Open MyGlassCase in Chrome</li>
                      <li>Look for the "Install" prompt at the bottom</li>
                      <li>Tap "Install" or "Add to Home Screen"</li>
                      <li>Alternatively: Menu (3 dots) → "Add to Home Screen"</li>
                      <li>Confirm the installation</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Desktop Installation</h4>
                <div className="text-green-700 dark:text-green-300 text-sm space-y-2">
                  <p><strong>Chrome/Edge:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Look for the install icon in the address bar</li>
                    <li>Click the install prompt when it appears</li>
                    <li>Or go to Menu → "Install MyGlassCase"</li>
                    <li>Click "Install" to add to your desktop</li>
                  </ol>
                  <p className="mt-3"><strong>Benefits of Installation:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Faster loading and better performance</li>
                    <li>Works offline for viewing your collection</li>
                    <li>Native app-like experience</li>
                    <li>Desktop shortcut for quick access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'import-export':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Import & Export Data</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Backup your collection or import existing data in bulk:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Exporting Your Collection
                </h4>
                <div className="text-green-700 dark:text-green-300 text-sm space-y-2">
                  <p><strong>How to Export:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Go to the Import & Export page from the main menu</li>
                    <li>Choose your export format:</li>
                    <ul className="list-disc list-inside ml-8 space-y-1">
                      <li><strong>CSV:</strong> For Excel, Google Sheets, or other spreadsheet programs</li>
                      <li><strong>JSON:</strong> Complete backup with all metadata</li>
                    </ul>
                    <li>Click the export button for your preferred format</li>
                    <li>The file will download automatically</li>
                  </ol>
                  <p className="mt-2"><strong>When to Export:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Regular backups of your collection data</li>
                    <li>Before making major changes</li>
                    <li>For insurance documentation</li>
                    <li>To share with other collectors or appraisers</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Importing Data
                </h4>
                <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                  <p><strong>Supported Formats:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>CSV files (.csv)</li>
                    <li>Excel files (.xlsx, .xls)</li>
                    <li>JSON files (.json)</li>
                  </ul>
                  <p className="mt-2"><strong>How to Import:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Go to Import & Export page</li>
                    <li>Download the CSV template for proper formatting</li>
                    <li>Fill in your data using the template columns</li>
                    <li>Click "Choose File to Import" and select your file</li>
                    <li>Review the import results and any errors</li>
                  </ol>
                  <p className="mt-2"><strong>Required Columns:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Name (item name)</li>
                    <li>Category (milk_glass or jadite)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Import Tips & Troubleshooting</h4>
                <div className="text-yellow-700 dark:text-yellow-300 text-sm space-y-2">
                  <p><strong>Preparing Your Data:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Use the provided CSV template for best results</li>
                    <li>Ensure category values are "milk_glass" or "jadite"</li>
                    <li>Use numeric values for years, prices, and quantities</li>
                    <li>Condition values: excellent, very_good, good, fair, poor</li>
                  </ul>
                  <p className="mt-2"><strong>Common Issues:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Missing item names will cause import failures</li>
                    <li>Invalid category names will default to milk_glass</li>
                    <li>Non-numeric prices will default to 0</li>
                    <li>Check the import results for any errors</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'subscriptions':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subscription Plans & Upgrades</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose the right plan for your collection size and unlock advanced features:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Available Plans</h4>
                <div className="text-gray-700 dark:text-gray-300 text-sm space-y-3">
                  <div>
                    <p className="font-medium text-blue-600 dark:text-blue-400">Starter (Free)</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Up to 10 items</li>
                      <li>Basic inventory management</li>
                      <li>Photo storage (1 per item)</li>
                      <li>Email support</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400">Pro ($5/month)</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Up to 100 items</li>
                      <li>Market analysis & pricing</li>
                      <li>Wishlist items</li>
                      <li>Item deletion capability</li>
                      <li>Priority support</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-purple-600 dark:text-purple-400">Collector ($10/month)</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Unlimited items</li>
                      <li>All Pro features</li>
                      <li>Priority support</li>
                      <li>First access to new features</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Crown className="h-5 w-5 mr-2" />
                  How to Upgrade Your Plan
                </h4>
                <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                  <p><strong>Method 1 - When You Hit Limits:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Try to add an item beyond your plan's limit</li>
                    <li>An upgrade modal will appear automatically</li>
                    <li>Choose your desired plan</li>
                    <li>Click "Upgrade Now" and confirm</li>
                    <li>Complete the Stripe checkout process</li>
                  </ol>
                  <p className="mt-3"><strong>Method 2 - Proactive Upgrade:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Go to Settings → Subscription</li>
                    <li>View available plans</li>
                    <li>Click "Upgrade Now" on your desired plan</li>
                    <li>Confirm the upgrade in the popup</li>
                    <li>Complete the secure checkout</li>
                  </ol>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">Upgrade Process Details</h4>
                <div className="text-green-700 dark:text-green-300 text-sm space-y-2">
                  <p><strong>What Happens During Upgrade:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>You'll see a confirmation modal with plan details</li>
                    <li>Clicking "Confirm Upgrade" redirects to secure Stripe checkout</li>
                    <li>Your subscription updates immediately upon payment</li>
                    <li>New features become available instantly</li>
                    <li>You're charged the prorated amount for the current period</li>
                  </ul>
                  <p className="mt-2"><strong>Payment & Security:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>All payments processed securely through Stripe</li>
                    <li>30-day money-back guarantee on all plans</li>
                    <li>Cancel anytime from your account settings</li>
                    <li>Automatic renewal unless cancelled</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Advanced Features</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Discover powerful features to enhance your collection management:
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Favorites System
                </h4>
                <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                  <p><strong>How to Use Favorites:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Click on any item to open its details</li>
                    <li>Click the heart icon to add/remove from favorites</li>
                    <li>Favorited items appear in your dashboard carousel</li>
                    <li>Use favorites for your most prized pieces</li>
                  </ol>
                  <p className="mt-2"><strong>Dashboard Carousel:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Auto-rotates through your favorite items every 3 seconds</li>
                    <li>Use arrow buttons to manually navigate</li>
                    <li>Click any favorite item to view full details</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Market Analysis (Pro/Collector)
                </h4>
                <div className="text-green-700 dark:text-green-300 text-sm space-y-2">
                  <p><strong>How to Use Market Analysis:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Open any item's details page</li>
                    <li>Click "Market Analysis" in the quick actions</li>
                    <li>View recent sold listings and price trends</li>
                    <li>Update your item's value based on market data</li>
                  </ol>
                  <p className="mt-2"><strong>What You Get:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Average market price for similar items</li>
                    <li>Recent sold listings with prices and conditions</li>
                    <li>Price range analysis</li>
                    <li>Confidence rating for the analysis</li>
                    <li>One-click value updates</li>
                  </ul>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Item Management
                </h4>
                <div className="text-purple-700 dark:text-purple-300 text-sm space-y-2">
                  <p><strong>Editing Items:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Click any item to view its details</li>
                    <li>Click "Edit Item" to modify information</li>
                    <li>Update photos, prices, conditions, or any other details</li>
                    <li>Changes save automatically</li>
                  </ul>
                  <p className="mt-2"><strong>Archiving Items (Pro/Collector):</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Click "Delete Item" to archive (not permanently delete)</li>
                    <li>Archived items can be viewed in "Archived" view mode</li>
                    <li>Restore archived items anytime</li>
                    <li>Keeps your active collection organized</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Collection Statistics</h4>
                <div className="text-yellow-700 dark:text-yellow-300 text-sm space-y-2">
                  <p><strong>Dashboard Stats:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Total Items:</strong> Count of all items in your collection</li>
                    <li><strong>Total Value:</strong> Sum of current values for all items</li>
                    <li><strong>Favorites:</strong> Number of items marked as favorites</li>
                  </ul>
                  <p className="mt-2"><strong>Profit/Loss Tracking:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Compare purchase price vs current value</li>
                    <li>Track investment performance over time</li>
                    <li>Identify your best performing pieces</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Select a topic from the sidebar to view help content.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Help Center</h2>
            </div>
            <div className="flex items-center space-x-2">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Everything you need to know about MyGlassCase
          </p>
          
          {/* Desktop tabs - horizontal */}
          <div className="hidden md:flex mt-4 space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <section.icon className="h-4 w-4 mr-2" />
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="p-4">
              <div className="grid grid-cols-1 gap-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <section.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};