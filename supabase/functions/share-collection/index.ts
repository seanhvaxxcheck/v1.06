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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the share link from database
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('share_links')
      .select('user_id, settings, expires_at, is_active, created_at')
      .eq('unique_share_id', shareId)
      .single();

    if (shareLinkError || !shareLink) {
      console.error('Share link not found:', shareLinkError);
      return new Response(
        JSON.stringify({ error: "Share link not found or has been disabled" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if link is active and not expired
    if (!shareLink.is_active || (shareLink.expires_at && new Date(shareLink.expires_at) < new Date())) {
      return new Response(
        JSON.stringify({ error: "Share link has expired or been disabled" }),
        {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', shareLink.user_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get inventory items for the user
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        category,
        subcategory,
        manufacturer,
        pattern,
        year_manufactured,
        current_value,
        purchase_price,
        purchase_date,
        condition,
        location,
        description,
        photo_url,
        quantity,
        created_at
      `)
      .eq('user_id', shareLink.user_id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch collection items" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate stats
    const totalItems = items?.length || 0;
    const totalValue = items?.reduce((sum, item) => sum + (item.current_value || 0), 0) || 0;
    const categories = [...new Set(items?.map(item => item.category).filter(Boolean))] || [];
    const manufacturers = [...new Set(items?.map(item => item.manufacturer).filter(Boolean))] || [];
    
    const years = items?.map(item => item.year_manufactured).filter(Boolean) || [];
    const oldestYear = years.length > 0 ? Math.min(...years) : 0;
    const newestYear = years.length > 0 ? Math.max(...years) : 0;

    const collection = {
      owner: {
        name: profile.full_name || profile.email.split('@')[0] || 'Anonymous Collector'
      },
      items: items || [],
      stats: {
        totalItems,
        totalValue,
        categories,
        manufacturers,
        oldestYear: oldestYear || Infinity,
        newestYear: newestYear || 0
      },
      settings: shareLink.settings || {},
      sharedAt: shareLink.created_at
    };

    return new Response(
      JSON.stringify({ collection }),
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
