import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EbayAuthRequest {
  action: 'get_auth_url' | 'handle_callback';
  user_id?: string;
  code?: string;
  state?: string;
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get eBay API credentials from environment
    const ebayClientId = Deno.env.get('EBAY_CLIENT_ID');
    const ebayClientSecret = Deno.env.get('EBAY_CLIENT_SECRET');
    const ebayRedirectUri = Deno.env.get('EBAY_REDIRECT_URI') || `${Deno.env.get('SUPABASE_URL')}/functions/v1/ebay-auth`;
    
    if (!ebayClientId || !ebayClientSecret) {
      return new Response(
        JSON.stringify({ error: "eBay API credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: EbayAuthRequest = await req.json();

    if (requestData.action === 'get_auth_url') {
      // Generate eBay OAuth URL
      const state = `user_${requestData.user_id}_${Date.now()}`;
      const scopes = 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.marketing.readonly https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.inventory.readonly https://api.ebay.com/oauth/api_scope/sell.inventory';
      
      const authUrl = `https://auth.ebay.com/oauth2/authorize?` +
        `client_id=${ebayClientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(ebayRedirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${state}`;

      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (requestData.action === 'handle_callback') {
      // Handle OAuth callback
      const { code, state } = requestData;
      
      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: "Missing authorization code or state" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Extract user ID from state
      const userId = state.split('_')[1];
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Invalid state parameter" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${ebayClientId}:${ebayClientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: ebayRedirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('eBay token exchange failed:', errorData);
        return new Response(
          JSON.stringify({ error: "Failed to exchange authorization code" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const tokenData = await tokenResponse.json();
      
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

      // Store credentials in database
      const { error: dbError } = await supabase
        .from('ebay_credentials')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (dbError) {
        console.error('Error storing eBay credentials:', dbError);
        return new Response(
          JSON.stringify({ error: "Failed to store eBay credentials" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          expires_at: expiresAt.toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('eBay auth error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process eBay authentication",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});