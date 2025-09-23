import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface MarketAnalysisRequest {
  itemName: string;
  manufacturer?: string;
  pattern?: string;
  category: string;
  description?: string;
  photoUrl?: string;
}

interface eBayItem {
  title: string;
  price: number;
  soldDate: string;
  condition: string;
  url: string;
  imageUrl?: string;
}

interface MarketAnalysisResponse {
  averagePrice: number;
  recentSales: eBayItem[];
  priceRange: {
    min: number;
    max: number;
  };
  confidence: 'high' | 'medium' | 'low';
  searchTermsUsed: string[];
}

function getMockData(searchTerms: string[]): eBayItem[] {
  const generateEbaySearchUrl = (title: string) => {
    const searchQuery = encodeURIComponent(title.replace(/\s+/g, ' ').trim());
    return `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}&_sacat=0&LH_Sold=1&LH_Complete=1&_sop=13&rt=nc`;
  };

  const primaryTerm = searchTerms[0] || 'collectible';
  const manufacturer = searchTerms.find(term => 
    ['fenton', 'fire-king', 'anchor hocking', 'pyrex', 'corning'].some(brand => 
      term.toLowerCase().includes(brand)
    )
  ) || '';
  
  const mockSoldItems: eBayItem[] = [
    {
      title: `${manufacturer} ${primaryTerm} - Vintage Collectible`,
      price: Math.round((Math.random() * 50 + 50) * 100) / 100,
      soldDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      condition: "Excellent",
      url: generateEbaySearchUrl(`${manufacturer} ${primaryTerm} vintage`),
    },
    {
      title: `Vintage ${primaryTerm} ${manufacturer ? `by ${manufacturer}` : ''}`.trim(),
      price: Math.round((Math.random() * 40 + 40) * 100) / 100,
      soldDate: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
      condition: "Very Good",
      url: generateEbaySearchUrl(`vintage ${primaryTerm} ${manufacturer}`),
    },
    {
      title: `${primaryTerm} Collectible Glass ${manufacturer ? `- ${manufacturer}` : ''}`.trim(),
      price: Math.round((Math.random() * 60 + 60) * 100) / 100,
      soldDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
      condition: "Good",
      url: generateEbaySearchUrl(`${primaryTerm} collectible glass ${manufacturer}`),
    }
  ];

  return mockSoldItems.slice(0, 3);
}

function generateSearchTerms(request: MarketAnalysisRequest): string[] {
  const terms: string[] = [];
  
  const categoryName = request.category === 'milk_glass' ? 'milk glass' : 'jadite';
  
  const combinedTerms = [
    `${request.itemName} ${categoryName}`.trim(),
    `${categoryName} ${request.itemName}`.trim(),
    `vintage ${categoryName} ${request.itemName}`.trim(),
  ];
  
  if (request.manufacturer) {
    combinedTerms.push(
      `${request.manufacturer} ${categoryName}`.trim(),
      `${request.manufacturer} ${request.itemName} ${categoryName}`.trim(),
      `${categoryName} ${request.manufacturer}`.trim(),
      `${request.manufacturer} ${request.itemName}`.trim(),
      `${request.itemName} ${request.manufacturer}`.trim()
    );
  }
  
  if (request.pattern) {
    combinedTerms.push(
      `${request.pattern} ${categoryName}`.trim(),
      `${categoryName} ${request.pattern}`.trim()
    );
  }
  
  return [...new Set(combinedTerms.filter(Boolean))];
}

function calculateMarketAnalysis(soldItems: eBayItem[]): Omit<MarketAnalysisResponse, 'searchTermsUsed'> {
  if (soldItems.length === 0) {
    return {
      averagePrice: 0,
      recentSales: [],
      priceRange: { min: 0, max: 0 },
      confidence: 'low'
    };
  }

  const mostRecentPrice = soldItems[0].price;
  const prices = soldItems.map(item => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (soldItems.length >= 5) {
    const priceVariation = (maxPrice - minPrice) / mostRecentPrice;
    confidence = priceVariation < 0.3 ? 'high' : 'medium';
  } else if (soldItems.length >= 3) {
    confidence = 'medium';
  }

  return {
    averagePrice: Math.round(mostRecentPrice * 100) / 100,
    recentSales: soldItems.slice(0, 10),
    priceRange: {
      min: Math.round(minPrice * 100) / 100,
      max: Math.round(maxPrice * 100) / 100
    },
    confidence
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

    const requestData: MarketAnalysisRequest = await req.json();
    
    if (!requestData.itemName || !requestData.category) {
      return new Response(
        JSON.stringify({ error: "Item name and category are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const searchTerms = generateSearchTerms(requestData);
    console.log('Generated search terms:', searchTerms);
    
    const soldItems = getMockData(searchTerms);
    console.log('Generated mock data:', soldItems.length);
    
    const analysis = calculateMarketAnalysis(soldItems);
    
    const response: MarketAnalysisResponse = {
      ...analysis,
      searchTermsUsed: searchTerms
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('Market analysis error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze market data",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});