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
      // Check for required environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL environment variable is not configured');
      }
      
      if (!supabaseAnonKey) {
        throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not configured');
      }

      console.log('=== IMAGE RECOGNITION DEBUG ===');
      console.log('Supabase URL:', supabaseUrl);
      console.log('File name:', imageFile.name);
      console.log('File size:', imageFile.size);
      console.log('File type:', imageFile.type);
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

      console.log('Base64 conversion complete, length:', base64Image.length);
      const apiUrl = `${supabaseUrl}/functions/v1/image-recognition`;
      console.log('API URL:', apiUrl);
      
      console.log('Making fetch request...');
      const response = await Promise.race([
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            filename: imageFile.name,
            fileType: imageFile.type,
          }),
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000)
        )
      ]);

      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('API error response:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          const errorText = await response.text();
          console.error('Raw error response:', errorText);
        }
        throw new Error(errorMessage);
      }

      console.log('Parsing response...');
      const result = await response.json();
      console.log('Response parsed successfully');
      console.log('=== IMAGE RECOGNITION SUCCESS ===');
      return result;

    } catch (err: any) {
      console.error('=== IMAGE RECOGNITION ERROR ===');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      let userFriendlyMessage = err.message;
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        userFriendlyMessage = 'Unable to connect to the AI service. Please check your internet connection and try again.';
      } else if (err.message.includes('timeout')) {
        userFriendlyMessage = 'The AI analysis is taking too long. Please try again with a smaller image.';
      } else if (err.message.includes('VITE_SUPABASE_URL')) {
        userFriendlyMessage = 'Application configuration error. Please contact support.';
      } else if (err.message.includes('VITE_SUPABASE_ANON_KEY')) {
        userFriendlyMessage = 'Application configuration error. Please contact support.';
      }
      
      setError(userFriendlyMessage);
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