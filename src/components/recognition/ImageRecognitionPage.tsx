import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, Eye, Save, ArrowRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Loader as Loader2, X, Star } from 'lucide-react';
import { useImageRecognition, type RecognitionMatch, type ImageRecognitionResult } from '../../hooks/useImageRecognition';
import { useInventory } from '../../hooks/useInventory';
import { ItemModal } from '../inventory/ItemModal';

export const ImageRecognitionPage: React.FC = () => {
  const { analyzeImage, loading, error } = useImageRecognition();
  const { addItem } = useInventory();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<ImageRecognitionResult | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<RecognitionMatch | null>(null);
  const [editableDescription, setEditableDescription] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [prefilledItem, setPrefilledItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelection = (file: File) => {
    setSelectedImage(file);
    setRecognitionResult(null);
    setSelectedMatch(null);
    setEditableDescription('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    const result = await analyzeImage(selectedImage);
    if (result) {
      setRecognitionResult(result);
      setSelectedMatch(result.primaryMatch);
      setEditableDescription(result.primaryMatch.description);
    }
  };

  const handleMatchSelection = (match: RecognitionMatch) => {
    setSelectedMatch(match);
    setEditableDescription(match.description);
  };

  const handleSaveAsNewItem = () => {
    if (!selectedMatch || !selectedImage) return;

    // Create prefilled item data
    const prefilledData = {
      name: `${selectedMatch.manufacturer} ${selectedMatch.itemType}`.trim(),
      category: selectedMatch.collection.toLowerCase().replace(/\s+/g, '_'),
      manufacturer: selectedMatch.manufacturer,
      pattern: selectedMatch.pattern,
      year_manufactured: selectedMatch.era ? parseInt(selectedMatch.era.split('-')[0]) : null,
      current_value: selectedMatch.estimatedValue || 0,
      description: editableDescription,
      condition: 'good', // Default condition
      ai_identified: true,
      ai_confidence: selectedMatch.confidence,
      ai_analysis_id: recognitionResult?.analysisId,
    };

    setPrefilledItem(prefilledData);
    setShowItemModal(true);
  };

  const handleItemModalClose = () => {
    setShowItemModal(false);
    setPrefilledItem(null);
    // Reset the recognition flow
    setSelectedImage(null);
    setImagePreview(null);
    setRecognitionResult(null);
    setSelectedMatch(null);
    setEditableDescription('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full mr-3">
                <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                AI Recognition
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Upload a photo and let AI identify your collectible
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Image Upload */}
        {!selectedImage && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Upload Your Collectible Photo
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Take a photo or upload an existing image for AI identification
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Image
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Supports JPG, PNG, WebP • Max 5MB
                </p>
              </div>
            </div>

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageSelection(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleImageSelection(e.target.files[0])}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Image Preview & Analysis */}
        {selectedImage && imagePreview && !recognitionResult && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Analyze
                </h2>
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Selected item"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="lg:w-1/2 flex flex-col justify-center">
                <div className="text-center">
                  <Sparkles className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    AI Recognition Ready
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Our AI will analyze your photo to identify the collectible, including manufacturer, pattern, era, and estimated value.
                  </p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors font-medium text-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Analyzing Image...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Identify Item
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Choose Different Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Recognition Results */}
        {recognitionResult && selectedImage && imagePreview && (
          <div className="space-y-6">
            {/* Image and Primary Match */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/2">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Analyzed item"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="lg:w-1/2">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      AI Identification
                    </h2>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(selectedMatch?.confidence || 0)}`}>
                      {getConfidenceText(selectedMatch?.confidence || 0)} Confidence
                    </div>
                  </div>

                  {selectedMatch && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Collection</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedMatch.collection}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Item Type</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedMatch.itemType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Manufacturer</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedMatch.manufacturer}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Pattern</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedMatch.pattern}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Era</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedMatch.era}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Material</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedMatch.material}</p>
                        </div>
                      </div>

                      {selectedMatch.estimatedValue && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Estimated Value</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            ${selectedMatch.estimatedValue.toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description (editable)
                        </label>
                        <textarea
                          value={editableDescription}
                          onChange={(e) => setEditableDescription(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Edit the AI-generated description..."
                        />
                      </div>

                      <button
                        onClick={handleSaveAsNewItem}
                        className="w-full flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <Save className="h-5 w-5 mr-2" />
                        Save as New Item
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alternative Matches */}
            {recognitionResult.matches.length > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Alternative Matches ({recognitionResult.matches.length - 1})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recognitionResult.matches.slice(1).map((match) => (
                    <div
                      key={match.id}
                      onClick={() => handleMatchSelection(match)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedMatch?.id === match.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {match.manufacturer} {match.itemType}
                        </h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(match.confidence)}`}>
                          {Math.round(match.confidence * 100)}%
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Collection:</span>
                          <span className="text-gray-900 dark:text-white">{match.collection}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Pattern:</span>
                          <span className="text-gray-900 dark:text-white">{match.pattern}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Era:</span>
                          <span className="text-gray-900 dark:text-white">{match.era}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  setRecognitionResult(null);
                  setSelectedMatch(null);
                  setEditableDescription('');
                }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Item Modal for saving */}
      {showItemModal && prefilledItem && (
        <ItemModal
          item={null}
          prefilledData={prefilledItem}
          selectedImageFile={selectedImage}
          onClose={handleItemModalClose}
        />
      )}
    </div>
  );
};