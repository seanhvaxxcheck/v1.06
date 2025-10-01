import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EbayAuthRequest {
  action: 'get_auth_url' | 'handle_callback' | 'refresh_token';
  user_id?: string;
  code?: string;
  state?: string;
}

// Helper: Refresh eBay token
async function refreshEbayToken(userId: string, supabase: any, ebayClientId: string, ebayClientSecret: string) {
  console.log('[REFRESH] Getting credentials for user:', userId);
  
  const { data: creds, error: fetchError } = await supabase
    .from('ebay_credentials')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (fetchError || !creds) {
    throw new Error('No eBay credentials found');
  }

  // Check if token needs refresh (expires in less than 5 minutes)
  const expiresAt = new Date(creds.expires_at);
  const now = new Date();
  const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 1000 / 60;

  if (minutesUntilExpiry > 5) {
    console.log('[REFRESH] Token still valid for', Math.round(minutesUntilExpiry), 'minutes');
    return { access_token: creds.access_token, refreshed: false };
  }

  console.log('[REFRESH] Token expiring soon, refreshing...');

  const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${ebayClientId}:${ebayClientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: creds.refresh_token,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token refresh failed: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  const newExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

  // Update database
  await supabase
    .from('ebay_credentials')
    .update({
      access_token: tokenData.access_token,
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  console.log('[REFRESH] Token refreshed successfully');
  return { access_token: tokenData.access_token, refreshed: true };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ebayClientId = Deno.env.get('EBAY_CLIENT_ID');
    const ebayClientSecret = Deno.env.get('EBAY_CLIENT_SECRET');
    const ebayRedirectUri = Deno.env.get('EBAY_REDIRECT_URI');
    
    if (!ebayClientId || !ebayClientSecret || !ebayRedirectUri) {
      return new Response(
        JSON.stringify({ error: "eBay API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData: EbayAuthRequest = await req.json();

    // GENERATE AUTH URL
    if (requestData.action === 'get_auth_url') {
      // Crypto-secure random state
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const state = `${requestData.user_id}_${randomHex}`;
      
      // Minimal required scopes for listing items
      const scopes = [
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
        'https://api.ebay.com/oauth/api_scope/sell.account.readonly'
      ];

      const authUrl = `https://auth.ebay.com/oauth2/authorize?` +
        `client_id=${encodeURIComponent(ebayClientId)}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(ebayRedirectUri)}&` +
        `scope=${encodeURIComponent(scopes.join(' '))}&` +
        `state=${encodeURIComponent(state)}`;

      console.log('[AUTH] Generated OAuth URL for user:', requestData.user_id);

      return new Response(
        JSON.stringify({ auth_url: authUrl, state }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // HANDLE OAUTH CALLBACK
    if (requestData.action === 'handle_callback') {
      const { code, state } = requestData;
      
      if (!code || !state) {
        return new Response(
          JSON.stringify({ error: "Missing code or state" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract user ID from state (format: userId_randomHex)
      const userId = state.split('_')[0];
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Invalid state parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log('[CALLBACK] Exchanging code for token, user:', userId);

      // Exchange code for token
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
        const errorText = await tokenResponse.text();
        console.error('[CALLBACK] Token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ error: "Failed to get eBay token", details: errorText }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenData = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

      // Store in database
      const { error: dbError } = await supabase
        .from('ebay_credentials')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (dbError) {
        console.error('[CALLBACK] DB error:', dbError);
        return new Response(
          JSON.stringify({ error: "Failed to store credentials", details: dbError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log('[CALLBACK] Successfully stored credentials for user:', userId);

      return new Response(
        JSON.stringify({ 
          success: true,
          expires_at: expiresAt.toISOString(),
          message: "eBay connected successfully"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // REFRESH TOKEN
    if (requestData.action === 'refresh_token') {
      if (!requestData.user_id) {
        return new Response(
          JSON.stringify({ error: "user_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await refreshEbayToken(
        requestData.user_id, 
        supabase, 
        ebayClientId, 
        ebayClientSecret
      );

      return new Response(
        JSON.stringify({ 
          success: true,
          refreshed: result.refreshed,
          message: result.refreshed ? "Token refreshed" : "Token still valid"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('[ERROR]', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "eBay authentication failed",
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});