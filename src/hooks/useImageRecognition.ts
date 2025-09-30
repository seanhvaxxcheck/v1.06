import { useState } from 'react';

export interface RecognitionMatch {
  id: string;
  confidence: number;
  collection: string;
  itemType: string;
  material: string;
  manufacturer: string;
  pattern: string;
  era: string;
  description: string;
  estimatedValue?: number;
}

export interface ImageRecognitionResult {
  matches: RecognitionMatch[];
  primaryMatch: RecognitionMatch;
  analysisId: string;
  processedAt: string;
}

export const useImageRecognition = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (imageFile: File): Promise<ImageRecognitionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Convert image to base64 for API transmission
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 data
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-recognition`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          filename: imageFile.name,
          fileType: imageFile.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeImage,
    loading,
    error,
  };
};