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

    // Initialize Supabase client with service role key for public access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching share link for ID:', shareId);

    // Get the share link details
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('share_links')
      .select(`
        id,
        user_id,
        settings,
        is_active,
        expires_at,
        created_at,
        profiles!inner(
          full_name,
          email
        )
      `)
      .eq('unique_share_id', shareId)
      .eq('is_active', true)
      .single();

    if (shareLinkError || !shareLink) {
      console.error('Share link not found or inactive:', shareLinkError);
      return new Response(
        JSON.stringify({ error: "Share link not found or has been disabled" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if link has expired
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Share link has expired" }),
        {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Found valid share link for user:', shareLink.user_id);

    // Get the user's collection items (only active items)
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', shareLink.user_id)
      .or('deleted.is.null,deleted.eq.0')
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching collection items:', itemsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch collection items" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Filter out sensitive information based on share settings
    const settings = shareLink.settings || {};
    const filteredItems = (items || []).map(item => {
      const filteredItem: any = {
        id: item.id,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        manufacturer: item.manufacturer,
        pattern: item.pattern,
        year_manufactured: item.year_manufactured,
        current_value: item.current_value,
        condition: item.condition,
        photo_url: item.photo_url,
        quantity: item.quantity,
        created_at: item.created_at,
      };

      // Conditionally include fields based on settings
      if (!settings.hide_purchase_price) {
        filteredItem.purchase_price = item.purchase_price;
      }
      
      if (!settings.hide_purchase_date) {
        filteredItem.purchase_date = item.purchase_date;
      }
      
      if (!settings.hide_location) {
        filteredItem.location = item.location;
      }
      
      if (!settings.hide_description) {
        filteredItem.description = item.description;
      }

      return filteredItem;
    });

    // Calculate collection stats (excluding sensitive data)
    const stats = {
      totalItems: filteredItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
      totalValue: filteredItems.reduce((sum, item) => sum + ((item.current_value || 0) * (item.quantity || 1)), 0),
      categories: [...new Set(filteredItems.map(item => item.category))].filter(Boolean),
      manufacturers: [...new Set(filteredItems.map(item => item.manufacturer))].filter(Boolean),
      oldestYear: Math.min(...filteredItems.map(item => item.year_manufactured).filter(Boolean)),
      newestYear: Math.max(...filteredItems.map(item => item.year_manufactured).filter(Boolean)),
    };

    const response = {
      collection: {
        owner: {
          name: shareLink.profiles.full_name || 'Anonymous Collector',
          // Don't include email for privacy
        },
        items: filteredItems,
        stats,
        settings: settings,
        sharedAt: shareLink.created_at,
      }
    };

    console.log(`Successfully fetched ${filteredItems.length} items for share link`);

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
        error: "Failed to fetch shared collection",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});