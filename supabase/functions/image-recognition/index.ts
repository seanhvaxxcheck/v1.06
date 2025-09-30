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
  webSearchResults: WebSearchResult[];
  analysisId: string;
  processedAt: string;
}

interface WebSearchResult {
  title: string;
  url: string;
  price?: number;
  imageUrl?: string;
  source: 'ebay' | 'etsy' | 'mercari' | 'facebook';
  snippet?: string;
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
    textAnnotations?: { description: string; }[];
    error?: {
      code: number;
      message: string;
    };
  }];
}

// Enhanced category mapping based on your example
const categoryMapping: { [key: string]: { category: string; subcategory: string; manufacturer?: string; pattern?: string; era?: string; } } = {
  // Fire-King Jadeite
  "Jadeite Fire-King Mug": { category: "Jadeite", subcategory: "Cup", manufacturer: "Anchor Hocking", pattern: "Fire-King", era: "1940s-1970s" },
  "Fire-King Ball Pitcher": { category: "Jadeite", subcategory: "Pitcher", manufacturer: "Anchor Hocking", pattern: "Fire-King", era: "1940s-1970s" },
  "Fire-King Jadeite Cup": { category: "Jadeite", subcategory: "Cup", manufacturer: "Anchor Hocking", pattern: "Fire-King", era: "1940s-1970s" },
  "Fire-King Jadeite Bowl": { category: "Jadeite", subcategory: "Bowl", manufacturer: "Anchor Hocking", pattern: "Fire-King", era: "1940s-1970s" },
  "Fire-King Restaurant Ware": { category: "Jadeite", subcategory: "Restaurant Ware", manufacturer: "Anchor Hocking", pattern: "Fire-King", era: "1940s-1970s" },
  
  // Fenton Glass
  "Fenton Hobnail Vase": { category: "Milk Glass", subcategory: "Vase", manufacturer: "Fenton", pattern: "Hobnail", era: "1940s-1980s" },
  "Fenton Milk Glass": { category: "Milk Glass", subcategory: "Decorative", manufacturer: "Fenton", pattern: "Various", era: "1905-2011" },
  "Fenton Art Glass": { category: "Art Glass", subcategory: "Decorative", manufacturer: "Fenton", pattern: "Various", era: "1905-2011" },
  
  // General patterns
  "Milk Glass Hobnail": { category: "Milk Glass", subcategory: "Decorative", pattern: "Hobnail", era: "1940s-1980s" },
  "Depression Glass": { category: "Depression Glass", subcategory: "Dinnerware", era: "1929-1939" },
  "Vintage Glassware": { category: "Collectible Glass", subcategory: "Various", era: "Mid-20th Century" },
  
  // Add more mappings as needed
};

// Enhanced collectible knowledge base
const COLLECTIBLE_PATTERNS = {
  manufacturers: {
    'fenton': { name: 'Fenton Art Glass', era: '1905-2011', specialty: 'Art Glass', keywords: ['fenton'], baseValue: 50 },
    'anchor hocking': { name: 'Anchor Hocking', era: '1905-present', specialty: 'Fire-King Jadeite', keywords: ['anchor hocking', 'fire-king', 'fireking'], baseValue: 40 },
    'fire-king': { name: 'Anchor Hocking Fire-King', era: '1942-1976', specialty: 'Jadeite Dinnerware', keywords: ['fire-king', 'fireking', 'fire king'], baseValue: 45 },
    'federal glass': { name: 'Federal Glass Company', era: '1900-1979', specialty: 'Depression Glass', keywords: ['federal', 'federal glass'], baseValue: 30 },
    'pyrex': { name: 'Corning Pyrex', era: '1915-present', specialty: 'Kitchen Glass', keywords: ['pyrex', 'corning'], baseValue: 35 },
    'westmoreland': { name: 'Westmoreland Glass', era: '1889-1985', specialty: 'Milk Glass', keywords: ['westmoreland'], baseValue: 40 },
    'indiana glass': { name: 'Indiana Glass Company', era: '1907-2002', specialty: 'Depression Glass', keywords: ['indiana glass'], baseValue: 25 },
    'hazel atlas': { name: 'Hazel-Atlas Glass Company', era: '1902-1956', specialty: 'Depression Glass', keywords: ['hazel atlas', 'hazel-atlas'], baseValue: 30 },
  },
  
  patterns: {
    'hobnail': { description: 'Raised dot pattern resembling boot nails', era: '1940s-1980s', keywords: ['hobnail', 'dot', 'bubble'], valueMultiplier: 1.3 },
    'jadeite': { description: 'Jade green opaque glass dinnerware', era: '1930s-1970s', keywords: ['jadeite', 'jade', 'green glass'], valueMultiplier: 1.4 },
    'milk glass': { description: 'Opaque white or colored glass', era: '1800s-1980s', keywords: ['milk glass', 'white glass', 'opaque'], valueMultiplier: 1.2 },
    'depression glass': { description: 'Mass-produced colored glassware', era: '1929-1939', keywords: ['depression', 'colored glass'], valueMultiplier: 1.1 },
    'restaurant ware': { description: 'Heavy-duty commercial dinnerware', era: '1940s-1970s', keywords: ['restaurant', 'heavy', 'commercial'], valueMultiplier: 1.5 },
  },
  
  itemTypes: {
    'cup': { keywords: ['cup', 'mug', 'coffee cup', 'tea cup'], category: 'Dinnerware', baseValue: 15 },
    'bowl': { keywords: ['bowl', 'mixing bowl', 'serving bowl', 'cereal bowl'], category: 'Dinnerware', baseValue: 20 },
    'plate': { keywords: ['plate', 'dinner plate', 'salad plate', 'dish'], category: 'Dinnerware', baseValue: 18 },
    'vase': { keywords: ['vase', 'flower vase', 'bud vase'], category: 'Decorative', baseValue: 35 },
    'pitcher': { keywords: ['pitcher', 'jug', 'water pitcher', 'milk pitcher'], category: 'Serving', baseValue: 45 },
    'jar': { keywords: ['jar', 'cookie jar', 'canister', 'storage'], category: 'Storage', baseValue: 30 },
    'saucer': { keywords: ['saucer', 'small plate'], category: 'Dinnerware', baseValue: 12 },
    'platter': { keywords: ['platter', 'serving tray', 'large plate'], category: 'Serving', baseValue: 40 },
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
        { type: 'WEB_DETECTION', maxResults: 15 },
        { type: 'TEXT_DETECTION', maxResults: 10 }
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

async function callBoltAI(visionData: any): Promise<any> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.log('No OpenAI API key configured, skipping AI description generation');
    return null;
  }

  try {
    console.log('Calling ChatGPT for enhanced collectible analysis...');
    
    const prompt = `
Context:
You are an expert appraiser and identifier of vintage collectible glassware, specializing in Milk Glass, Jadeite, Depression Glass, and Art Glass. You are analyzing Google Vision API data to help collectors properly identify and catalog their items.

Task:
Analyze the Google Vision API data and provide expert identification:

1. IDENTIFICATION: Determine the most likely manufacturer, pattern, and item type
2. CATEGORIZATION: Assign proper category (Jadeite, Milk Glass, Depression Glass, Art Glass, etc.) and subcategory (Cup, Bowl, Vase, etc.)
3. HISTORICAL CONTEXT: Provide era/period and brief historical significance
4. VALUE ASSESSMENT: Estimate market value based on rarity, condition, and demand
5. CONFIDENCE: Rate your identification confidence (High/Medium/Low)
6. DESCRIPTION: Write a collector-friendly description with key identifying features

Key Manufacturers to Look For:
- Fire-King/Anchor Hocking (Jadeite, 1940s-1970s)
- Fenton Art Glass (Art Glass, 1905-2011)
- Westmoreland (Milk Glass, 1889-1985)
- Federal Glass (Depression Glass, 1900-1979)
- Hazel-Atlas (Depression Glass, 1902-1956)
- Indiana Glass (Depression Glass, 1907-2002)

Common Patterns:
- Hobnail (raised dots)
- Restaurant Ware (heavy commercial pieces)
- Swirl patterns
- Ribbed patterns

Input:
${JSON.stringify(visionData)}

REQUIRED OUTPUT FORMAT (must be valid JSON):
{
  "description": "This appears to be a Fire-King Jadeite restaurant ware cup, likely from the 1940s-1950s. The thick walls and jade green color are characteristic of Anchor Hocking's commercial dinnerware line.",
  "category": "Jadeite",
  "subcategory": "Cup",
  "manufacturer": "Anchor Hocking",
  "pattern": "Fire-King Restaurant Ware",
  "era": "1940s-1950s",
  "material": "Jadeite Glass",
  "estimatedValue": 25,
  "confidence": "High",
  "identifyingFeatures": ["Jade green color", "Thick walls", "Commercial weight", "Fire-King styling"],
  "historicalContext": "Fire-King jadeite was popular restaurant and home dinnerware, prized for durability and distinctive color."
}

IMPORTANT: 
- Always return valid JSON
- Use "Unknown" for uncertain fields
- Base estimates on actual collectible market values
- Consider condition affects value significantly
- Be specific about identifying features`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional antique appraiser and collectible glass expert with 30+ years of experience. You specialize in American glassware from 1900-1980, particularly Fire-King Jadeite, Fenton Art Glass, Milk Glass, and Depression Glass. You provide accurate identifications and fair market valuations for insurance and collection purposes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ChatGPT API error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        // Clean the content in case ChatGPT adds markdown formatting
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedResult = JSON.parse(cleanContent);
        console.log('ChatGPT analysis result:', parsedResult);
        return parsedResult;
      } catch (parseError) {
        console.error('Failed to parse ChatGPT response as JSON:', content);
        console.error('Parse error:', parseError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('ChatGPT API call failed:', error);
    return null;
  }
}

function mapVisionResultsToMatches(visionResponse: GoogleVisionResponse, analysisId: string, chatGPTResult?: any): RecognitionMatch[] {
  const response = visionResponse.responses[0];
  const labels = response.labelAnnotations || [];
  const webEntities = response.webDetection?.webEntities || [];
  const bestGuess = response.webDetection?.bestGuessLabels?.[0]?.label || '';
  const ocrText = response.textAnnotations?.map(t => t.description).join(' ') || '';
  
  console.log('Processing Vision API results:', {
    labelsCount: labels.length,
    webEntitiesCount: webEntities.length,
    bestGuess,
    ocrText: ocrText.substring(0, 100) + '...'
  });

  const matches: RecognitionMatch[] = [];
  
  // Start with base values
  let itemType = 'Glass Item';
  let confidence = 0.5;
  let manufacturer = 'Unknown';
  let collection = 'Collectible Glass';
  let pattern = 'Unknown Pattern';
  let era = 'Mid-20th Century';
  let material = 'Glass';
  let estimatedValue = 25;

  // 1. Check category mapping first (highest priority)
  let mappingFound = false;
  for (const entity of [...webEntities.map(e => e.description), bestGuess]) {
    if (entity && categoryMapping[entity]) {
      const mapping = categoryMapping[entity];
      collection = mapping.category;
      itemType = mapping.subcategory;
      if (mapping.manufacturer) manufacturer = mapping.manufacturer;
      if (mapping.pattern) pattern = mapping.pattern;
      if (mapping.era) era = mapping.era;
      confidence = 0.85; // High confidence for exact mapping
      mappingFound = true;
      console.log('Found exact mapping for:', entity, mapping);
      break;
    }
  }

  // 2. If no exact mapping, use pattern matching
  if (!mappingFound) {
    // Try to identify manufacturer from web entities and labels
    for (const entity of webEntities) {
      const entityDesc = entity.description.toLowerCase();
      
      for (const [key, info] of Object.entries(COLLECTIBLE_PATTERNS.manufacturers)) {
        if (info.keywords.some(keyword => entityDesc.includes(keyword))) {
          manufacturer = info.name;
          era = info.era;
          estimatedValue = info.baseValue;
          
          if (key === 'fenton') {
            collection = 'Fenton Art Glass';
            material = 'Art Glass';
          } else if (key.includes('fire-king') || key.includes('anchor hocking')) {
            collection = 'Fire-King Jadeite';
            material = 'Jadeite Glass';
            pattern = 'Fire-King';
          }
          confidence = Math.max(confidence, entity.score);
          break;
        }
      }
    }

    // Try to identify item type from labels
    for (const label of labels) {
      const labelDesc = label.description.toLowerCase();
      
      for (const [type, info] of Object.entries(COLLECTIBLE_PATTERNS.itemTypes)) {
        if (info.keywords.some(keyword => labelDesc.includes(keyword))) {
          itemType = type.charAt(0).toUpperCase() + type.slice(1);
          estimatedValue += info.baseValue;
          confidence = Math.max(confidence, label.score);
          break;
        }
      }
    }

    // Try to identify pattern from labels and entities
    for (const item of [...labels.map(l => l.description), ...webEntities.map(e => e.description)]) {
      const itemDesc = item.toLowerCase();
      
      for (const [patternKey, patternInfo] of Object.entries(COLLECTIBLE_PATTERNS.patterns)) {
        if (patternInfo.keywords.some(keyword => itemDesc.includes(keyword))) {
          pattern = patternKey.charAt(0).toUpperCase() + patternKey.slice(1);
          collection = patternInfo.description.includes('jade') ? 'Fire-King Jadeite' : 
                      patternInfo.description.includes('milk') ? 'Milk Glass' : collection;
          material = patternInfo.description.includes('jade') ? 'Jadeite Glass' : 
                    patternInfo.description.includes('milk') ? 'Milk Glass' : material;
          era = patternInfo.era;
          estimatedValue *= patternInfo.valueMultiplier;
          break;
        }
      }
    }
  }

  // 3. Use ChatGPT result if available to enhance description
  let description = '';
  if (chatGPTResult?.description) {
    description = chatGPTResult.description;
    
    // Override with ChatGPT suggestions if they seem more accurate
    if (chatGPTResult.category && chatGPTResult.category !== 'Unknown') {
      collection = chatGPTResult.category;
    }
    if (chatGPTResult.subcategory && chatGPTResult.subcategory !== 'Unknown') {
      itemType = chatGPTResult.subcategory;
    }
    if (chatGPTResult.manufacturer && chatGPTResult.manufacturer !== 'Unknown') {
      manufacturer = chatGPTResult.manufacturer;
    }
    if (chatGPTResult.pattern && chatGPTResult.pattern !== 'Unknown') {
      pattern = chatGPTResult.pattern;
    }
    if (chatGPTResult.era && chatGPTResult.era !== 'Unknown') {
      era = chatGPTResult.era;
    }
    if (chatGPTResult.material && chatGPTResult.material !== 'Unknown') {
      material = chatGPTResult.material;
    }
    if (chatGPTResult.estimatedValue && typeof chatGPTResult.estimatedValue === 'number') {
      estimatedValue = chatGPTResult.estimatedValue;
    }
    if (chatGPTResult.confidence) {
      const chatGPTConfidence = chatGPTResult.confidence.toLowerCase();
      if (chatGPTConfidence === 'high') confidence = Math.max(confidence, 0.85);
      else if (chatGPTConfidence === 'medium') confidence = Math.max(confidence, 0.65);
      else if (chatGPTConfidence === 'low') confidence = Math.max(confidence, 0.45);
    }
  } else {
    // Generate description from our analysis
    description = `${manufacturer !== 'Unknown' ? manufacturer + ' ' : ''}${itemType.toLowerCase()} in ${material.toLowerCase()}. ${
      collection.includes('Fenton') ? 'Fenton was renowned for their handcrafted art glass pieces.' :
      collection.includes('Fire-King') ? 'Fire-King jadeite was popular restaurant and home dinnerware.' :
      collection.includes('Milk Glass') ? 'Milk glass was popular decorative glassware from the 1800s through 1980s.' :
      'This appears to be a vintage collectible glass piece.'
    } Estimated from the ${era} period.`;
  }

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
    description,
    estimatedValue: Math.round(estimatedValue)
  };

  matches.push(primaryMatch);

  // Generate alternative matches based on other high-confidence labels
  const alternativeLabels = labels
    .filter(label => label.score > 0.6 && !label.description.toLowerCase().includes(itemType.toLowerCase()))
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
      description: "Unable to connect to AI services. This appears to be a vintage glass collectible. Please add details manually for accurate cataloging.",
      estimatedValue: 25
    }
  ];
  
  return fallbackMatches;
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
    const boltAIApiKey = Deno.env.get('BOLT_AI_API_KEY'); // For enhanced descriptions

    console.log('API Configuration:', {
      hasGoogleVisionKey: !!googleVisionApiKey,
      hasCustomModelEndpoint: !!customModelEndpoint,
      hasCustomModelKey: !!customModelApiKey,
      hasBoltAIKey: !!boltAIApiKey,
      useCustomModel
    });

    let matches: RecognitionMatch[] = [];
    let visionResponse: GoogleVisionResponse | null = null;

    try {
      // Step 1: Try custom model first if configured
      if (useCustomModel && customModelEndpoint && customModelApiKey) {
        console.log('Using custom model for recognition...');
        
        // Future: Call custom model
        // const customResult = await callCustomModel(requestData.image, customModelEndpoint, customModelApiKey);
        console.log('Custom model integration ready but not yet implemented');
      }
      
      // Step 2: Use Google Vision API (primary or fallback)
      if (matches.length === 0 && googleVisionApiKey) {
        console.log('Using Google Vision API for recognition...');
        
        visionResponse = await callGoogleVisionAPI(requestData.image, googleVisionApiKey);
        
        // Step 3: Enhance with ChatGPT if available
        let chatGPTResult = null;
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (openaiApiKey && visionResponse) {
          const visionData = {
            labels: visionResponse.responses[0].labelAnnotations?.map(l => l.description) || [],
            webEntities: visionResponse.responses[0].webDetection?.webEntities?.map(w => w.description) || [],
            bestGuessLabel: visionResponse.responses[0].webDetection?.bestGuessLabels?.[0]?.label || '',
            ocrText: visionResponse.responses[0].textAnnotations?.map(t => t.description).join(' ') || ''
          };
          
          chatGPTResult = await callBoltAI(visionData);
        }
        
        matches = mapVisionResultsToMatches(visionResponse, analysisId, chatGPTResult);
        
        console.log(`Google Vision API returned ${matches.length} matches`);
        console.log('Primary match details:', {
          itemType: matches[0]?.itemType,
          manufacturer: matches[0]?.manufacturer,
          collection: matches[0]?.collection,
          confidence: matches[0]?.confidence
        });
      }
      
      // Step 4: Fallback to mock data if no API is configured or all fail
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
      primaryConfidence: result.primaryMatch.confidence,
      usedGoogleVision: !!visionResponse,
      usedChatGPT: !!chatGPTResult
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