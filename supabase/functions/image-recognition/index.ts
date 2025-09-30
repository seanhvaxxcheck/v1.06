import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ImageRecognitionRequest {
  image: string; // base64 encoded image
  filename: string;
  fileType: string;
}

interface RecognitionMatch {
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

interface ImageRecognitionResponse {
  matches: RecognitionMatch[];
  primaryMatch: RecognitionMatch;
  analysisId: string;
  processedAt: string;
}

interface GoogleVisionLabel {
  description: string;
  score: number;
  topicality?: number;
}

interface GoogleVisionWebEntity {
  entityId?: string;
  score: number;
  description: string;
}

interface GoogleVisionResponse {
  responses: [{
    labelAnnotations?: GoogleVisionLabel[];
    webDetection?: {
      webEntities?: GoogleVisionWebEntity[];
      bestGuessLabels?: { label: string; languageCode: string; }[];
    };
    error?: {
      code: number;
      message: string;
    };
  }];
}

// Collectible knowledge base for mapping Vision API results
const COLLECTIBLE_PATTERNS = {
  manufacturers: {
    'fenton': { name: 'Fenton Art Glass', era: '1905-2011', specialty: 'Art Glass' },
    'anchor hocking': { name: 'Anchor Hocking', era: '1905-present', specialty: 'Fire-King Jadeite' },
    'fire-king': { name: 'Anchor Hocking', era: '1942-1976', specialty: 'Fire-King Jadeite' },
    'federal glass': { name: 'Federal Glass Company', era: '1900-1979', specialty: 'Depression Glass' },
    'pyrex': { name: 'Corning Glass Works', era: '1915-present', specialty: 'Kitchen Glass' },
    'corning': { name: 'Corning Glass Works', era: '1851-present', specialty: 'Kitchen & Laboratory Glass' },
    'westmoreland': { name: 'Westmoreland Glass Company', era: '1889-1985', specialty: 'Milk Glass' },
    'indiana glass': { name: 'Indiana Glass Company', era: '1907-2002', specialty: 'Depression Glass' },
  },
  
  patterns: {
    'hobnail': { description: 'Raised dot pattern resembling boot nails', era: '1940s-1980s' },
    'jadeite': { description: 'Jade green opaque glass', era: '1930s-1970s' },
    'milk glass': { description: 'Opaque white or colored glass', era: '1800s-1980s' },
    'depression glass': { description: 'Mass-produced glassware from 1929-1939', era: '1929-1939' },
    'restaurant ware': { description: 'Heavy-duty dinnerware for commercial use', era: '1940s-1970s' },
  },
  
  itemTypes: {
    'cup': ['coffee cup', 'tea cup', 'mug', 'cup'],
    'bowl': ['mixing bowl', 'serving bowl', 'cereal bowl', 'soup bowl'],
    'plate': ['dinner plate', 'salad plate', 'dessert plate', 'serving plate'],
    'vase': ['flower vase', 'bud vase', 'decorative vase'],
    'dish': ['candy dish', 'serving dish', 'butter dish', 'covered dish'],
    'pitcher': ['water pitcher', 'milk pitcher', 'cream pitcher'],
    'jar': ['cookie jar', 'canister', 'storage jar'],
  }
};

async function callGoogleVisionAPI(base64Image: string, apiKey: string): Promise<GoogleVisionResponse> {
  const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  
  const requestBody = {
    requests: [{
      image: {
        content: base64Image
      },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'WEB_DETECTION', maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
      ]
    }]
  };

  console.log('Calling Google Vision API...');
  
  const response = await fetch(visionApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Vision API error:', response.status, errorText);
    throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
  }

  const result: GoogleVisionResponse = await response.json();
  console.log('Google Vision API response received');
  
  // Check for API-level errors
  if (result.responses[0]?.error) {
    throw new Error(`Google Vision API error: ${result.responses[0].error.message}`);
  }
  
  return result;
}

async function callCustomModel(base64Image: string, modelEndpoint: string, apiKey: string): Promise<any> {
  // Placeholder for future custom model integration
  console.log('Custom model integration not yet implemented');
  
  // This would be the structure for a custom model call:
  /*
  const response = await fetch(modelEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Image,
      model_version: 'collectibles-v1',
      confidence_threshold: 0.5
    }),
  });
  
  return await response.json();
  */
  
  return null;
}

function mapVisionResultsToMatches(visionResponse: GoogleVisionResponse, analysisId: string): RecognitionMatch[] {
  const response = visionResponse.responses[0];
  const labels = response.labelAnnotations || [];
  const webEntities = response.webDetection?.webEntities || [];
  const bestGuess = response.webDetection?.bestGuessLabels?.[0]?.label || '';
  
  console.log('Processing Vision API results:', {
    labelsCount: labels.length,
    webEntitiesCount: webEntities.length,
    bestGuess
  });

  const matches: RecognitionMatch[] = [];
  
  // Extract relevant labels for collectibles
  const glassLabels = labels.filter(label => 
    label.description.toLowerCase().includes('glass') ||
    label.description.toLowerCase().includes('ceramic') ||
    label.description.toLowerCase().includes('porcelain') ||
    label.description.toLowerCase().includes('dish') ||
    label.description.toLowerCase().includes('bowl') ||
    label.description.toLowerCase().includes('cup') ||
    label.description.toLowerCase().includes('plate') ||
    label.description.toLowerCase().includes('vase')
  );

  // Try to identify item type from labels
  let itemType = 'Unknown Item';
  let confidence = 0.5;
  
  for (const [type, keywords] of Object.entries(COLLECTIBLE_PATTERNS.itemTypes)) {
    for (const keyword of keywords) {
      const matchingLabel = labels.find(label => 
        label.description.toLowerCase().includes(keyword.toLowerCase())
      );
      if (matchingLabel) {
        itemType = type.charAt(0).toUpperCase() + type.slice(1);
        confidence = Math.max(confidence, matchingLabel.score);
        break;
      }
    }
  }

  // Try to identify manufacturer from web entities or labels
  let manufacturer = 'Unknown';
  let collection = 'Collectible Glass';
  let pattern = 'Unknown Pattern';
  let era = 'Mid-20th Century';
  let material = 'Glass';

  // Check web entities for manufacturer information
  for (const entity of webEntities) {
    const entityDesc = entity.description.toLowerCase();
    
    for (const [key, info] of Object.entries(COLLECTIBLE_PATTERNS.manufacturers)) {
      if (entityDesc.includes(key)) {
        manufacturer = info.name;
        era = info.era;
        if (key === 'fenton') {
          collection = 'Fenton Art Glass';
          material = 'Art Glass';
        } else if (key.includes('fire-king') || key.includes('anchor hocking')) {
          collection = 'Fire-King Jadeite';
          material = 'Jadeite Glass';
        }
        confidence = Math.max(confidence, entity.score);
        break;
      }
    }
  }

  // Check labels for glass type indicators
  const milkGlassIndicators = ['milk glass', 'white glass', 'opaque glass'];
  const jaditeIndicators = ['green glass', 'jade glass', 'jadeite'];
  
  for (const label of labels) {
    const labelDesc = label.description.toLowerCase();
    
    if (milkGlassIndicators.some(indicator => labelDesc.includes(indicator))) {
      collection = 'Milk Glass';
      material = 'Milk Glass';
      pattern = 'Milk Glass';
    } else if (jaditeIndicators.some(indicator => labelDesc.includes(indicator))) {
      collection = 'Fire-King Jadeite';
      material = 'Jadeite Glass';
      pattern = 'Jadeite';
    }
  }

  // Estimate value based on identified characteristics
  let estimatedValue = 25; // Base value
  
  if (manufacturer !== 'Unknown') estimatedValue += 20;
  if (collection.includes('Fenton')) estimatedValue += 30;
  if (collection.includes('Fire-King')) estimatedValue += 25;
  if (itemType.toLowerCase().includes('vase')) estimatedValue += 15;
  if (confidence > 0.8) estimatedValue += 10;

  // Create primary match
  const primaryMatch: RecognitionMatch = {
    id: `match_${analysisId}_primary`,
    confidence: Math.min(confidence, 0.95), // Cap confidence at 95%
    collection,
    itemType,
    material,
    manufacturer,
    pattern,
    era,
    description: `${manufacturer} ${itemType.toLowerCase()} in ${material.toLowerCase()}. ${
      collection.includes('Fenton') ? 'Fenton was renowned for their handcrafted art glass pieces.' :
      collection.includes('Fire-King') ? 'Fire-King jadeite was popular restaurant and home dinnerware.' :
      collection.includes('Milk Glass') ? 'Milk glass was popular decorative glassware from the 1800s through 1980s.' :
      'This appears to be a vintage collectible glass piece.'
    } Estimated from the ${era} period.`,
    estimatedValue
  };

  matches.push(primaryMatch);

  // Generate alternative matches based on other high-confidence labels
  const alternativeLabels = labels
    .filter(label => label.score > 0.6 && label.description !== itemType)
    .slice(0, 2);

  for (let i = 0; i < alternativeLabels.length; i++) {
    const altLabel = alternativeLabels[i];
    const altMatch: RecognitionMatch = {
      id: `match_${analysisId}_alt_${i}`,
      confidence: Math.max(0.4, altLabel.score - 0.1),
      collection: 'Alternative Identification',
      itemType: altLabel.description,
      material: 'Glass',
      manufacturer: 'Unknown',
      pattern: 'Unknown',
      era: 'Mid-20th Century',
      description: `Alternative identification as ${altLabel.description}. This could be a different type of collectible glass piece.`,
      estimatedValue: Math.round(estimatedValue * 0.8)
    };
    matches.push(altMatch);
  }

  return matches;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: ImageRecognitionRequest = await req.json();

    if (!requestData.image || !requestData.filename) {
      return new Response(
        JSON.stringify({ error: "Image data and filename are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Processing image recognition request:', {
      filename: requestData.filename,
      fileType: requestData.fileType,
      imageSize: requestData.image.length
    });

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get API configuration from environment variables
    const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    const customModelEndpoint = Deno.env.get('CUSTOM_MODEL_ENDPOINT');
    const customModelApiKey = Deno.env.get('CUSTOM_MODEL_API_KEY');
    const useCustomModel = Deno.env.get('USE_CUSTOM_MODEL') === 'true';

    let matches: RecognitionMatch[] = [];

    try {
      if (useCustomModel && customModelEndpoint && customModelApiKey) {
        console.log('Using custom model for recognition...');
        
        // Future: Call custom model
        const customResult = await callCustomModel(requestData.image, customModelEndpoint, customModelApiKey);
        
        if (customResult) {
          // Map custom model results to our format
          // This will be implemented when you have a custom model
          console.log('Custom model results received');
        } else {
          console.log('Custom model failed, falling back to Google Vision');
        }
      }
      
      // Use Google Vision API (primary or fallback)
      if (matches.length === 0 && googleVisionApiKey) {
        console.log('Using Google Vision API for recognition...');
        
        const visionResponse = await callGoogleVisionAPI(requestData.image, googleVisionApiKey);
        matches = mapVisionResultsToMatches(visionResponse, analysisId);
        
        console.log(`Google Vision API returned ${matches.length} matches`);
      }
      
      // Fallback to mock data if no API is configured or all fail
      if (matches.length === 0) {
        console.log('No API configured or all APIs failed, using fallback data');
        matches = generateFallbackMatches(analysisId);
      }

    } catch (apiError: any) {
      console.error('AI API error:', apiError);
      
      // Fallback to mock data on API failure
      console.log('API failed, using fallback data');
      matches = generateFallbackMatches(analysisId);
    }

    const result: ImageRecognitionResponse = {
      matches,
      primaryMatch: matches[0],
      analysisId,
      processedAt: new Date().toISOString(),
    };

    console.log('Recognition analysis complete:', {
      analysisId: result.analysisId,
      matchesCount: result.matches.length,
      primaryConfidence: result.primaryMatch.confidence
    });

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('Image recognition error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process image recognition",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Fallback function for when APIs are unavailable
function generateFallbackMatches(analysisId: string): RecognitionMatch[] {
  console.log('Generating fallback matches for analysis:', analysisId);
  
  const fallbackMatches = [
    {
      id: `match_${analysisId}_fallback`,
      confidence: 0.6,
      collection: "Collectible Glass",
      itemType: "Glass Item",
      material: "Glass",
      manufacturer: "Unknown",
      pattern: "Unknown",
      era: "Mid-20th Century",
      description: "Unable to identify specific details. This appears to be a vintage glass collectible. Please add details manually for accurate cataloging.",
      estimatedValue: 25
    }
  ];
  
  return fallbackMatches;
}