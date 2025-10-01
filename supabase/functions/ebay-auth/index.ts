import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EbayAuthRequest {
  action: 'get_auth_url' | 'handle_callback' | 'refresh_token';
  user_id?: string;
  sessionId?: string;
  username?: string;
}

// Helper: Get eBay session token
async function getEbaySessionToken(ruName: string, devId: string, appId: string, certId: string) {
  console.log('[SESSION] Getting eBay session token...');
  
  const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<GetSessionIDRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RuName>${ruName}</RuName>
</GetSessionIDRequest>`;

  const response = await fetch('https://api.ebay.com/ws/api.dll', {
    method: 'POST',
    headers: {
      'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
      'X-EBAY-API-DEV-NAME': devId,
      'X-EBAY-API-APP-NAME': appId,
      'X-EBAY-API-CERT-NAME': certId,
      'X-EBAY-API-CALL-NAME': 'GetSessionID',
      'X-EBAY-API-SITEID': '0',
      'Content-Type': 'text/xml',
    },
    body: xmlRequest,
  });

  if (!response.ok) {
    throw new Error(`Failed to get session token: ${response.status}`);
  }

  const xmlResponse = await response.text();
  console.log('[SESSION] eBay XML response:', xmlResponse);
  
  // Check for eBay API errors first
  const ackMatch = xmlResponse.match(/<Ack>([^<]+)<\/Ack>/);
  if (ackMatch && ackMatch[1] === 'Failure') {
    const shortMessageMatch = xmlResponse.match(/<ShortMessage>([^<]+)<\/ShortMessage>/);
    const longMessageMatch = xmlResponse.match(/<LongMessage>([^<]+)<\/LongMessage>/);
    const errorCode = xmlResponse.match(/<ErrorCode>([^<]+)<\/ErrorCode>/);
    
    const errorDetails = {
      shortMessage: shortMessageMatch ? shortMessageMatch[1] : 'Unknown error',
      longMessage: longMessageMatch ? longMessageMatch[1] : 'No detailed error message',
      errorCode: errorCode ? errorCode[1] : 'Unknown code'
    };
    
    console.error('[SESSION] eBay API Error:', errorDetails);
    throw new Error(`eBay API Error: ${errorDetails.shortMessage} - ${errorDetails.longMessage} (Code: ${errorDetails.errorCode})`);
  }
  
  // Parse SessionID from XML response
  const sessionIdMatch = xmlResponse.match(/<SessionID>([^<]+)<\/SessionID>/);
  if (!sessionIdMatch) {
    console.error('[SESSION] Full eBay response for debugging:', xmlResponse);
    throw new Error('No SessionID found in eBay response. Check eBay API credentials and RuName configuration.');
  }

  return sessionIdMatch[1];
}

// Helper: Fetch user token after authentication
async function fetchUserToken(sessionId: string, devId: string, appId: string, certId: string) {
  console.log('[TOKEN] Fetching user token for session:', sessionId);
  
  const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<FetchTokenRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <SessionID>${sessionId}</SessionID>
</FetchTokenRequest>`;

  const response = await fetch('https://api.ebay.com/ws/api.dll', {
    method: 'POST',
    headers: {
      'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
      'X-EBAY-API-DEV-NAME': devId,
      'X-EBAY-API-APP-NAME': appId,
      'X-EBAY-API-CERT-NAME': certId,
      'X-EBAY-API-CALL-NAME': 'FetchToken',
      'X-EBAY-API-SITEID': '0',
      'Content-Type': 'text/xml',
    },
    body: xmlRequest,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.status}`);
  }

  const xmlResponse = await response.text();
  console.log('[TOKEN] eBay XML response:', xmlResponse);
  
  // Check for eBay API errors first
  const ackMatch = xmlResponse.match(/<Ack>([^<]+)<\/Ack>/);
  if (ackMatch && ackMatch[1] === 'Failure') {
    const shortMessageMatch = xmlResponse.match(/<ShortMessage>([^<]+)<\/ShortMessage>/);
    const longMessageMatch = xmlResponse.match(/<LongMessage>([^<]+)<\/LongMessage>/);
    const errorCode = xmlResponse.match(/<ErrorCode>([^<]+)<\/ErrorCode>/);
    
    const errorDetails = {
      shortMessage: shortMessageMatch ? shortMessageMatch[1] : 'Unknown error',
      longMessage: longMessageMatch ? longMessageMatch[1] : 'No detailed error message',
      errorCode: errorCode ? errorCode[1] : 'Unknown code'
    };
    
    console.error('[TOKEN] eBay API Error:', errorDetails);
    throw new Error(`eBay API Error: ${errorDetails.shortMessage} - ${errorDetails.longMessage} (Code: ${errorDetails.errorCode})`);
  }
  
  // Parse eBayAuthToken from XML response
  const tokenMatch = xmlResponse.match(/<eBayAuthToken>([^<]+)<\/eBayAuthToken>/);
  if (!tokenMatch) {
    console.error('[TOKEN] Full eBay response for debugging:', xmlResponse);
    throw new Error('No eBayAuthToken found in response. The session may have expired or authentication failed.');
  }

  // Parse expiration date
  const expirationMatch = xmlResponse.match(/<HardExpirationTime>([^<]+)<\/HardExpirationTime>/);
  const expirationDate = expirationMatch ? new Date(expirationMatch[1]) : new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000); // 18 months default

  return {
    token: tokenMatch[1],
    expiresAt: expirationDate,
  };
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

    const ebayDevId = Deno.env.get('EBAY_DEV_ID');
    const ebayAppId = Deno.env.get('EBAY_CLIENT_ID');
    const ebayCertId = Deno.env.get('EBAY_CLIENT_SECRET');
    const ebayRuName = Deno.env.get('EBAY_RU_NAME');
    
    if (!ebayDevId || !ebayAppId || !ebayCertId || !ebayRuName) {
      return new Response(
        JSON.stringify({ 
          error: "eBay API credentials not configured",
          missing: {
            devId: !ebayDevId,
            appId: !ebayAppId,
            certId: !ebayCertId,
            ruName: !ebayRuName
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData: EbayAuthRequest = await req.json();

    // GENERATE AUTH URL
    if (requestData.action === 'get_auth_url') {
      try {
        // Get session token from eBay
        const sessionId = await getEbaySessionToken(ebayRuName, ebayDevId, ebayAppId, ebayCertId);
        
        // Generate the Auth'n'Auth URL
        const authUrl = `https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&runame=${ebayRuName}&SessID=${sessionId}`;
        
        console.log('[AUTH] Generated Auth\'n\'Auth URL for user:', requestData.user_id);
        console.log('[AUTH] Session ID:', sessionId);

        return new Response(
          JSON.stringify({ 
            auth_url: authUrl, 
            session_id: sessionId 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error: any) {
        console.error('[AUTH] Error generating auth URL:', error);
        return new Response(
          JSON.stringify({ error: "Failed to generate auth URL", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // HANDLE AUTH CALLBACK
    if (requestData.action === 'handle_callback') {
      const { sessionId, username, user_id } = requestData;
      
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "Missing session ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log('[CALLBACK] Processing callback for session:', sessionId);

      try {
        // Fetch the user token using the session ID
        const tokenData = await fetchUserToken(sessionId, ebayDevId, ebayAppId, ebayCertId);
        
        console.log('[CALLBACK] Successfully fetched user token');

        // Store in database
        const { error: dbError } = await supabase
          .from('ebay_credentials')
          .upsert({
            user_id: user_id,
            access_token: tokenData.token,
            refresh_token: '', // Auth'n'Auth doesn't use refresh tokens
            expires_at: tokenData.expiresAt.toISOString(),
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

        console.log('[CALLBACK] Successfully stored credentials for user:', user_id);

        return new Response(
          JSON.stringify({ 
            success: true,
            expires_at: tokenData.expiresAt.toISOString(),
            message: "eBay connected successfully"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (error: any) {
        console.error('[CALLBACK] Error fetching token:', error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch eBay token", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // CHECK CONNECTION STATUS
    if (requestData.action === 'check_connection') {
      const { user_id } = requestData;
      
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "Missing user ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const { data: credentials, error: dbError } = await supabase
          .from('ebay_credentials')
          .select('expires_at')
          .eq('user_id', user_id)
          .maybeSingle();

        if (dbError) {
          console.error('[CHECK] DB error:', dbError);
          return new Response(
            JSON.stringify({ connected: false }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isConnected = credentials && new Date(credentials.expires_at) > new Date();
        
        return new Response(
          JSON.stringify({ 
            connected: isConnected,
            expires_at: credentials?.expires_at
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      } catch (error: any) {
        console.error('[CHECK] Error checking connection:', error);
        return new Response(
          JSON.stringify({ connected: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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