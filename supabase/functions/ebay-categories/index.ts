import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Mock eBay categories for collectibles
const COLLECTIBLE_CATEGORIES = [
  { id: '1', name: 'Collectibles > Decorative Collectibles > Glassware' },
  { id: '2', name: 'Collectibles > Kitchen & Home > Dinnerware & Serveware' },
  { id: '3', name: 'Collectibles > Decorative Collectibles > Vases' },
  { id: '4', name: 'Collectibles > Kitchen & Home > Kitchenware' },
  { id: '5', name: 'Antiques > Decorative Arts > Glass' },
  { id: '6', name: 'Pottery & Glass > Glass > Glassware' },
  { id: '7', name: 'Collectibles > Advertising > Merchandise & Memorabilia' },
  { id: '8', name: 'Collectibles > Decorative Collectibles > Bowls' },
  { id: '9', name: 'Collectibles > Kitchen & Home > Barware' },
  { id: '10', name: 'Collectibles > Decorative Collectibles > Figurines' },
];

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For now, return mock categories
    // In production, you would fetch real categories from eBay API
    return new Response(
      JSON.stringify({ 
        categories: COLLECTIBLE_CATEGORIES,
        cached: true,
        updated_at: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('eBay categories error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch eBay categories",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});