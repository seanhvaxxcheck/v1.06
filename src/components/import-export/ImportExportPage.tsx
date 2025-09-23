import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, Info, X, Loader2 } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const ImportExportPage: React.FC = () => {
  const { items, addItem } = useInventory();
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const exportToCSV = () => {
    const headers = [
      'Name', 'Category', 'Manufacturer', 'Pattern', 'Year', 'Quantity',
      'Purchase Price', 'Current Value', 'Condition', 'Location', 'Description'
    ];
    
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.item_name}"`,
        `"${item.category}"`,
        `"${item.manufacturer}"`,
        `"${item.pattern}"`,
        item.year_manufactured || '',
        item.quantity || 1,
        item.purchase_price,
        item.current_value,
        `"${item.condition}"`,
        `"${item.location}"`,
        `"${item.description}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = {
      collection: items,
      exportedAt: new Date().toISOString(),
      totalItems: items.length,
      categories: {
        milk_glass: items.filter(item => item.category === 'milk_glass').length,
        jadite: items.filter(item => item.category === 'jadite').length,
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
        data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return headers.reduce((obj, header, index) => {
            obj[header.replace(/\s+/g, '_')] = values[index] || '';
            return obj;
          }, {} as any);
        });
      } else if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(text);
        data = Array.isArray(jsonData) ? jsonData : jsonData.collection || jsonData.items || [];
      } else {
        throw new Error('Unsupported file format. Please use CSV, Excel (.xlsx), or JSON files.');
      }

      let successCount = 0;
      const errors: string[] = [];

      for (const [index, row] of data.entries()) {
        try {
          // Map common column variations to our expected format
          const name = row.name || row.item_name || row.title || row.description || `Imported Item ${index + 1}`;
          const category = (row.category || row.type || '').toLowerCase();
          
          // Map category variations
          let mappedCategory: 'milk_glass' | 'jadite' = 'milk_glass';
          if (category.includes('jadite') || category.includes('jadeite') || category.includes('jade')) {
            mappedCategory = 'jadite';
          }

          // Map condition variations
          let mappedCondition = 'good';
          const condition = (row.condition || '').toLowerCase();
          if (condition.includes('excellent') || condition.includes('mint')) {
            mappedCondition = 'excellent';
          } else if (condition.includes('very good') || condition.includes('very_good')) {
            mappedCondition = 'very_good';
          } else if (condition.includes('fair')) {
            mappedCondition = 'fair';
          } else if (condition.includes('poor')) {
            mappedCondition = 'poor';
          }

          const itemData = {
            name: name,
            category: mappedCategory,
            subcategory: row.subcategory || row.sub_category || '',
            manufacturer: row.manufacturer || row.brand || row.maker || '',
            pattern: row.pattern || row.design || '',
            year_manufactured: row.year_manufactured || row.year || row.date ? Number(row.year_manufactured || row.year || row.date) : null,
            quantity: row.quantity || row.qty || row.amount ? Number(row.quantity || row.qty || row.amount) : 1,
            purchase_price: Number(row.purchase_price || row.paid || row.cost || row.price_paid || 0),
            current_value: Number(row.current_value || row.value || row.worth || row.estimated_value || 0),
            location: row.location || row.storage || row.room || '',
            description: row.description || row.notes || row.details || '',
            condition: mappedCondition as 'excellent' | 'very_good' | 'good' | 'fair' | 'poor',
            photo_url: null,
          };

          const result = await addItem(itemData);
          if (result?.error) {
            errors.push(`Row ${index + 1} (${name}): ${result.error}`);
          } else {
            successCount++;
          }
        } catch (err: any) {
          const itemName = row.name || row.item_name || `Row ${index + 1}`;
          errors.push(`${itemName}: ${err.message}`);
        }
      }

      setImportResults({ success: successCount, errors });
    } catch (error: any) {
      setImportResults({ success: 0, errors: [error.message] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import & Export</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Backup your collection or import items in bulk
        </p>
      </div>

      <div className="space-y-6">
        {/* Import Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Upload className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Items</h2>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Import multiple items at once from an Excel (.xlsx), CSV, or JSON file. Your file will be processed and items will be added to your collection.
          </p>


          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload Your File
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop your Excel, CSV, or JSON file here, or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition-colors font-medium"
              >
                {importing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </div>
                ) : (
                  'Choose File to Import'
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileImport}
                className="hidden"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Supports: Excel (.xlsx, .xls), CSV (.csv), JSON (.json)
              </p>
            </div>

            {/* Import Results */}
            {importResults && (
              <div className={`p-4 rounded-lg border ${
                importResults.errors.length > 0 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-start">
                  {importResults.errors.length > 0 ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      importResults.errors.length > 0 
                        ? 'text-yellow-800 dark:text-yellow-200' 
                        : 'text-green-800 dark:text-green-200'
                    }`}>
                      Import completed: {importResults.success} items successfully imported
                    </p>
                    {importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                          {importResults.errors.length} errors occurred:
                        </p>
                        <div className="max-h-32 overflow-y-auto">
                          <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                            {importResults.errors.map((error, index) => (
                              <li key={index} className="break-words">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Your Collection</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Download your collection data in various formats for backup or external use.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={exportToCSV}
                className="w-full flex items-center justify-center p-4 border border-blue-200 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Export as CSV</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Spreadsheet format for Excel or Google Sheets
                  </p>
                </div>
              </button>

              <button
                onClick={exportToJSON}
                className="w-full flex items-center justify-center p-4 border border-green-200 dark:border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Download className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Export as JSON</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete backup with metadata
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Template Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Template</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Download a template file to help format your data for import.
            </p>
            
            <button
              onClick={() => {
                const headers = [
                  'Name', 'Category', 'Manufacturer', 'Pattern', 'Year', 'Quantity',
                  'Purchase Price', 'Current Value', 'Condition', 'Location', 'Description'
                ];
                
                const sampleData = [
                  'Fenton Hobnail Vase', 'milk_glass', 'Fenton', 'Hobnail', '1950', 
                  '1', '25.00', '75.00', 'excellent', 'Display Cabinet', 'Beautiful vintage piece'
                ];
                
                const csvContent = [
                  headers.join(','),
                  sampleData.map(field => `"${field}"`).join(',')
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'myglasscase-import-template.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="w-full flex items-center justify-center p-4 border border-purple-200 dark:border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">CSV Template</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pre-formatted with correct headers and sample data
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};