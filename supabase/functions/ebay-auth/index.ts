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
      
      // Use eBay's traditional sign-in URL format instead of OAuth2
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ruName = ebayClientId; // Use client ID as RuName for now
      
      // Use eBay's traditional authentication URL format
      const authUrl = `https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&runame=${encodeURIComponent(ruName)}&SessID=${sessionId}`;

      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (requestData.action === 'handle_callback') {
      // Handle eBay traditional auth callback
      const { sessionId, username } = requestData;
      
      if (!sessionId || !username) {
        return new Response(
          JSON.stringify({ error: "Missing session ID or username" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Extract user ID from session ID
      const userId = sessionId.split('_')[1];
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Invalid session ID parameter" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get eBay auth token using traditional API
      const tokenResponse = await fetch('https://api.ebay.com/ws/api.dll', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
          'X-EBAY-API-DEV-NAME': Deno.env.get('EBAY_DEV_ID') || '',
          'X-EBAY-API-APP-NAME': ebayClientId,
          'X-EBAY-API-CERT-NAME': ebayClientSecret,
          'X-EBAY-API-CALL-NAME': 'FetchToken',
          'X-EBAY-API-SITEID': '0',
        },
        body: `<?xml version="1.0" encoding="utf-8"?>
          <FetchTokenRequest xmlns="urn:ebay:apis:eBLBaseComponents">
            <SessionID>${sessionId}</SessionID>
          </FetchTokenRequest>`,
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('eBay token fetch failed:', errorData);
        return new Response(
          JSON.stringify({ error: "Failed to fetch eBay token" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const tokenXml = await tokenResponse.text();
      
      // Parse XML response to extract token (simplified parsing)
      const tokenMatch = tokenXml.match(/<eBayAuthToken>(.*?)<\/eBayAuthToken>/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (!token) {
        console.error('No token found in eBay response:', tokenXml);
        return new Response(
          JSON.stringify({ error: "Failed to extract eBay token" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (18 * 60 * 60 * 1000)); // 18 hours for eBay auth tokens

      // Store credentials in database
      const { error: dbError } = await supabase
        .from('ebay_credentials')
        .upsert({
          user_id: userId,
          access_token: token,
          refresh_token: '', // eBay traditional auth doesn't use refresh tokens
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