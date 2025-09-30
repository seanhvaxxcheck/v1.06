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

// Mock AI recognition data generator
function generateMockRecognition(filename: string): ImageRecognitionResponse {
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate realistic collectible matches
  const possibleMatches = [
    {
      collection: "Fire-King Jadeite",
      itemType: "Coffee Cup",
      material: "Jadeite Glass",
      manufacturer: "Anchor Hocking",
      pattern: "Restaurant Ware",
      era: "1940-1976",
      confidence: 0.85,
      estimatedValue: 25,
      description: "Classic Fire-King jadeite coffee cup in restaurant ware pattern. These were produced by Anchor Hocking from 1940-1976 and are highly sought after by collectors for their distinctive jade green color and durability."
    },
    {
      collection: "Fenton Milk Glass",
      itemType: "Hobnail Vase",
      material: "Milk Glass",
      manufacturer: "Fenton Art Glass",
      pattern: "Hobnail",
      era: "1950-1980",
      confidence: 0.78,
      estimatedValue: 45,
      description: "Fenton hobnail milk glass vase featuring the iconic raised dot pattern. Fenton was renowned for their handcrafted art glass, and hobnail pieces are among their most popular collectibles."
    },
    {
      collection: "Depression Glass",
      itemType: "Dinner Plate",
      material: "Pressed Glass",
      manufacturer: "Federal Glass Company",
      pattern: "Madrid",
      era: "1932-1939",
      confidence: 0.72,
      estimatedValue: 35,
      description: "Depression-era pressed glass dinner plate in the Madrid pattern by Federal Glass Company. These pieces were mass-produced during the Great Depression and are now valuable collectibles."
    },
    {
      collection: "Pyrex Mixing Bowls",
      itemType: "Mixing Bowl",
      material: "Borosilicate Glass",
      manufacturer: "Corning Glass Works",
      pattern: "Primary Colors",
      era: "1945-1986",
      confidence: 0.69,
      estimatedValue: 30,
      description: "Vintage Pyrex mixing bowl from the Primary Colors collection. These colorful, durable bowls were kitchen staples and are now prized by collectors for their mid-century modern aesthetic."
    }
  ];

  // Randomly select 2-3 matches
  const numMatches = Math.floor(Math.random() * 2) + 2; // 2-3 matches
  const selectedMatches = possibleMatches
    .sort(() => Math.random() - 0.5)
    .slice(0, numMatches)
    .map((match, index) => ({
      ...match,
      id: `match_${analysisId}_${index}`,
      // Adjust confidence slightly for variety
      confidence: Math.max(0.5, match.confidence + (Math.random() - 0.5) * 0.2)
    }))
    .sort((a, b) => b.confidence - a.confidence); // Sort by confidence

  return {
    matches: selectedMatches,
    primaryMatch: selectedMatches[0],
    analysisId,
    processedAt: new Date().toISOString(),
  };
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

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    // Generate mock recognition results
    const result = generateMockRecognition(requestData.filename);

    console.log('Generated recognition result:', {
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