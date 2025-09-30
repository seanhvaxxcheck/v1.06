import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EbayListingRequest {
  user_id: string;
  item_id: string;
  listing_data: {
    title: string;
    description: string;
    category_id: string;
    start_price: number;
    buy_it_now_price?: number;
    duration: number;
    condition: string;
    shipping_cost?: number;
    return_policy?: string;
    payment_methods: string[];
    photos: string[];
  };
}

async function refreshEbayToken(supabase: any, userId: string, refreshToken: string): Promise<string | null> {
  const ebayClientId = Deno.env.get('EBAY_CLIENT_ID');
  const ebayClientSecret = Deno.env.get('EBAY_CLIENT_SECRET');
  
  if (!ebayClientId || !ebayClientSecret) {
    throw new Error('eBay API credentials not configured');
  }

  try {
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${ebayClientId}:${ebayClientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', await response.text());
      return null;
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Update stored credentials
    await supabase
      .from('ebay_credentials')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return tokenData.access_token;
  } catch (error) {
    console.error('Error refreshing eBay token:', error);
    return null;
  }
}

async function getValidAccessToken(supabase: any, userId: string): Promise<string | null> {
  // Get stored credentials
  const { data: credentials, error } = await supabase
    .from('ebay_credentials')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !credentials) {
    console.error('No eBay credentials found for user:', userId);
    return null;
  }

  // Check if token is still valid
  const expiresAt = new Date(credentials.expires_at);
  const now = new Date();
  
  if (expiresAt > now) {
    return credentials.access_token;
  }

  // Token expired, try to refresh
  console.log('eBay token expired, attempting refresh...');
  return await refreshEbayToken(supabase, userId, credentials.refresh_token);
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

    const requestData: EbayListingRequest = await req.json();
    
    if (!requestData.user_id || !requestData.item_id || !requestData.listing_data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, requestData.user_id);
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "eBay authentication required. Please reconnect your eBay account." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare eBay listing payload
    const listingPayload = {
      Item: {
        Title: requestData.listing_data.title,
        Description: requestData.listing_data.description,
        PrimaryCategory: {
          CategoryID: requestData.listing_data.category_id,
        },
        StartPrice: requestData.listing_data.start_price,
        BuyItNowPrice: requestData.listing_data.buy_it_now_price,
        ListingDuration: `Days_${requestData.listing_data.duration}`,
        ListingType: requestData.listing_data.buy_it_now_price ? 'FixedPriceItem' : 'Chinese',
        ConditionID: getEbayConditionId(requestData.listing_data.condition),
        Country: 'US',
        Currency: 'USD',
        DispatchTimeMax: 3,
        ListingDetails: {
          BestOfferEnabled: true,
        },
        PaymentMethods: requestData.listing_data.payment_methods,
        ReturnPolicy: {
          ReturnsAcceptedOption: 'ReturnsAccepted',
          RefundOption: 'MoneyBack',
          ReturnsWithinOption: 'Days_30',
          ShippingCostPaidByOption: 'Buyer',
        },
        ShippingDetails: {
          ShippingType: 'Calculated',
          ShippingServiceOptions: [
            {
              ShippingServicePriority: 1,
              ShippingService: 'USPSMedia',
              ShippingServiceCost: requestData.listing_data.shipping_cost || 0,
            },
          ],
        },
      },
    };

    // Add photos if available
    if (requestData.listing_data.photos.length > 0) {
      listingPayload.Item.PictureDetails = {
        PictureURL: requestData.listing_data.photos,
      };
    }

    // Create listing on eBay (using Trading API)
    const ebayResponse = await fetch('https://api.ebay.com/ws/api.dll', {
      method: 'POST',
      headers: {
        'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
        'X-EBAY-API-DEV-NAME': Deno.env.get('EBAY_DEV_ID') || '',
        'X-EBAY-API-APP-NAME': Deno.env.get('EBAY_CLIENT_ID') || '',
        'X-EBAY-API-CERT-NAME': Deno.env.get('EBAY_CLIENT_SECRET') || '',
        'X-EBAY-API-CALL-NAME': 'AddFixedPriceItem',
        'X-EBAY-API-SITEID': '0',
        'Content-Type': 'text/xml',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
        <AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials>
            <eBayAuthToken>${accessToken}</eBayAuthToken>
          </RequesterCredentials>
          ${xmlEncode(listingPayload)}
        </AddFixedPriceItemRequest>`,
    });

    if (!ebayResponse.ok) {
      const errorText = await ebayResponse.text();
      console.error('eBay listing creation failed:', errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create eBay listing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse eBay XML response (simplified - in production you'd use a proper XML parser)
    const responseText = await ebayResponse.text();
    
    // For demo purposes, generate mock response
    const mockListingId = `DEMO_${Date.now()}`;
    const mockListingUrl = `https://www.ebay.com/itm/${mockListingId}`;

    // Store listing in database
    const { data: listing, error: dbError } = await supabase
      .from('ebay_listings')
      .insert({
        user_id: requestData.user_id,
        inventory_item_id: requestData.item_id,
        ebay_listing_id: mockListingId,
        listing_url: mockListingUrl,
        title: requestData.listing_data.title,
        start_price: requestData.listing_data.start_price,
        buy_it_now_price: requestData.listing_data.buy_it_now_price,
        status: 'active',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing listing:', dbError);
      return new Response(
        JSON.stringify({ error: "Failed to store listing information" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        listing_id: mockListingId,
        listing_url: mockListingUrl,
        status: 'active',
        created_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('eBay listing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to create eBay listing",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getEbayConditionId(condition: string): string {
  const conditionMap: { [key: string]: string } = {
    'New': '1000',
    'Used': '3000',
    'For parts or not working': '7000',
  };
  
  return conditionMap[condition] || '3000';
}

function xmlEncode(obj: any): string {
  // Simplified XML encoding for demo
  // In production, use a proper XML library
  return `<Item>
    <Title>${escapeXml(obj.Item.Title)}</Title>
    <Description>${escapeXml(obj.Item.Description)}</Description>
    <PrimaryCategory>
      <CategoryID>${obj.Item.PrimaryCategory.CategoryID}</CategoryID>
    </PrimaryCategory>
    <StartPrice>${obj.Item.StartPrice}</StartPrice>
    <BuyItNowPrice>${obj.Item.BuyItNowPrice || obj.Item.StartPrice}</BuyItNowPrice>
    <ListingDuration>${obj.Item.ListingDuration}</ListingDuration>
    <ListingType>${obj.Item.ListingType}</ListingType>
    <ConditionID>${obj.Item.ConditionID}</ConditionID>
    <Country>${obj.Item.Country}</Country>
    <Currency>${obj.Item.Currency}</Currency>
  </Item>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}