import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    // Get wishlist item ID from URL parameters
    const url = new URL(req.url);
    const itemId = url.searchParams.get('itemId');

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: "Item ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role key for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching wishlist item for ID:', itemId);

    // Get the wishlist item with owner information
    const { data: wishlistItem, error: itemError } = await supabase
      .from('wishlist_items')
      .select(`
        id,
        item_name,
        category,
        subcategory,
        manufacturer,
        pattern,
        year_manufactured,
        desired_price_max,
        condition,
        location,
        description,
        photo_url,
        quantity,
        status,
        created_at,
        profiles!inner(
          full_name,
          email
        )
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !wishlistItem) {
      console.error('Wishlist item not found:', itemError);
      return new Response(
        JSON.stringify({ error: "Wishlist item not found or has been removed" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Found wishlist item:', wishlistItem.item_name);

    // Format the response
    const response = {
      wishlistItem: {
        id: wishlistItem.id,
        item_name: wishlistItem.item_name,
        category: wishlistItem.category,
        subcategory: wishlistItem.subcategory,
        manufacturer: wishlistItem.manufacturer,
        pattern: wishlistItem.pattern,
        year_manufactured: wishlistItem.year_manufactured,
        desired_price_max: wishlistItem.desired_price_max,
        condition: wishlistItem.condition,
        location: wishlistItem.location,
        description: wishlistItem.description,
        photo_url: wishlistItem.photo_url,
        quantity: wishlistItem.quantity,
        status: wishlistItem.status,
        created_at: wishlistItem.created_at,
        owner_name: wishlistItem.profiles.full_name || 'Anonymous Collector',
      }
    };

    console.log(`Successfully fetched wishlist item: ${wishlistItem.item_name}`);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('Share wishlist error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch shared wishlist item",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
