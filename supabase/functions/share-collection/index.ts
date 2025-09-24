import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ShareCollectionRequest {
  shareId: string;
}

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

    // Initialize Supabase client with service role for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get shareId from URL parameters
    const url = new URL(req.url);
    const shareId = url.searchParams.get('shareId');

    if (!shareId) {
      return new Response(
        JSON.stringify({ error: "Share ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Looking up share link:', shareId);

    // Step 1: Validate the share link
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('share_links')
      .select('user_id, settings, is_active, expires_at')
      .eq('unique_share_id', shareId)
      .single();

    if (shareLinkError || !shareLink) {
      console.error('Share link not found:', shareLinkError);
      return new Response(
        JSON.stringify({ error: "Share link not found or invalid" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if link is active
    if (!shareLink.is_active) {
      return new Response(
        JSON.stringify({ error: "Share link has been disabled" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Share link has expired" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Valid share link found for user:', shareLink.user_id);
    console.log('Share settings:', shareLink.settings);

    // Step 2: Get the user's profile for collection owner info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', shareLink.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Step 3: Fetch the collection items
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', shareLink.user_id)
      .or('deleted.is.null,deleted.eq.0') // Only active items
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching collection items:', itemsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch collection" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 4: Filter sensitive data based on share settings
    const settings = shareLink.settings || {};
    const hidePurchasePrice = settings.hide_purchase_price !== false; // Default to true

    const filteredItems = (items || []).map(item => {
      const publicItem: any = {
        id: item.id,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        manufacturer: item.manufacturer,
        pattern: item.pattern,
        year_manufactured: item.year_manufactured,
        current_value: item.current_value,
        location: item.location,
        description: item.description,
        condition: item.condition,
        photo_url: item.photo_url,
        quantity: item.quantity,
        created_at: item.created_at,
      };

      // Conditionally include purchase_price based on settings
      if (!hidePurchasePrice) {
        publicItem.purchase_price = item.purchase_price;
      }

      return publicItem;
    });

    console.log(`Returning ${filteredItems.length} items for public view`);

    const response = {
      success: true,
      collection: {
        owner: {
          name: profile?.full_name || 'Anonymous Collector',
          // Don't include email for privacy
        },
        items: filteredItems,
        totalItems: filteredItems.length,
        totalValue: filteredItems.reduce((sum, item) => sum + ((item.current_value || 0) * (item.quantity || 1)), 0),
        settings: {
          hidePurchasePrice,
        },
        sharedAt: new Date().toISOString(),
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('Share collection error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to load shared collection",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});