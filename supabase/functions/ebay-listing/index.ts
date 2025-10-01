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

async function getValidAccessToken(supabase: any, userId: string): Promise<string | null> {
  console.log('[TOKEN] Getting valid access token for user:', userId);
  
  // Get stored credentials
  const { data: credentials, error } = await supabase
    .from('ebay_credentials')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !credentials) {
    console.error('[TOKEN] No eBay credentials found for user:', userId);
    return null;
  }

  console.log('[TOKEN] Found credentials, checking expiration...');
  
  // Check if token is still valid (Auth'n'Auth tokens don't refresh, they last 18 months)
  const expiresAt = new Date(credentials.expires_at);
  const now = new Date();
  
  if (expiresAt > now) {
    console.log('[TOKEN] Token is still valid');
    return credentials.access_token;
  }

  console.log('[TOKEN] Token has expired');
  return null;
}

function getEbayConditionId(condition: string): string {
  const conditionMap: { [key: string]: string } = {
    'New': '1000',
    'Used': '3000',
    'For parts or not working': '7000',
  };
  
  return conditionMap[condition] || '3000';
}

function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function createEbayListing(
  accessToken: string,
  listingData: any,
  devId: string,
  appId: string,
  certId: string
): Promise<{ listingId?: string; listingUrl?: string; error?: string }> {
  console.log('[LISTING] Creating eBay listing...');
  
  const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${accessToken}</eBayAuthToken>
  </RequesterCredentials>
  <Item>
    <Title>${escapeXml(listingData.title)}</Title>
    <Description><![CDATA[${listingData.description}]]></Description>
    <PrimaryCategory>
      <CategoryID>${listingData.category_id}</CategoryID>
    </PrimaryCategory>
    <StartPrice>${listingData.start_price}</StartPrice>
    <ListingDuration>Days_${listingData.duration}</ListingDuration>
    <ListingType>FixedPriceItem</ListingType>
    ${listingData.buy_it_now_price ? `<BuyItNowPrice>${listingData.buy_it_now_price}</BuyItNowPrice>` : ''}
    <ConditionID>${getEbayConditionId(listingData.condition)}</ConditionID>
    <Country>US</Country>
    <Currency>USD</Currency>
    <DispatchTimeMax>3</DispatchTimeMax>
    <ListingDetails>
      <BestOfferEnabled>true</BestOfferEnabled>
    </ListingDetails>
    <PaymentMethods>PayPal</PaymentMethods>
    <PaymentMethods>VisaMC</PaymentMethods>
    <ReturnPolicy>
      <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
      <RefundOption>MoneyBack</RefundOption>
      <ReturnsWithinOption>Days_30</ReturnsWithinOption>
      <ShippingCostPaidByOption>Buyer</ShippingCostPaidByOption>
    </ReturnPolicy>
    <ShippingDetails>
      <ShippingType>Flat</ShippingType>
      <ShippingServiceOptions>
        <ShippingServicePriority>1</ShippingServicePriority>
        <ShippingService>USPSMedia</ShippingService>
        <ShippingServiceCost>${listingData.shipping_cost || 0}</ShippingServiceCost>
      </ShippingServiceOptions>
    </ShippingDetails>
    ${listingData.photos && listingData.photos.length > 0 ? `
    <PictureDetails>
      ${listingData.photos.map(photo => `<PictureURL>${escapeXml(photo)}</PictureURL>`).join('')}
    </PictureDetails>` : ''}
  </Item>
</AddFixedPriceItemRequest>`;

  console.log('[LISTING] Sending XML request to eBay...');
  
  const response = await fetch('https://api.ebay.com/ws/api.dll', {
    method: 'POST',
    headers: {
      'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
      'X-EBAY-API-DEV-NAME': devId,
      'X-EBAY-API-APP-NAME': appId,
      'X-EBAY-API-CERT-NAME': certId,
      'X-EBAY-API-CALL-NAME': 'AddFixedPriceItem',
      'X-EBAY-API-SITEID': '0',
      'Content-Type': 'text/xml',
    },
    body: xmlRequest,
  });

  if (!response.ok) {
    console.error('[LISTING] HTTP error:', response.status, response.statusText);
    return { error: `HTTP error: ${response.status}` };
  }

  const xmlResponse = await response.text();
  console.log('[LISTING] eBay XML response:', xmlResponse);
  
  // Check for eBay API errors
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
    
    console.error('[LISTING] eBay API Error:', errorDetails);
    return { error: `eBay API Error: ${errorDetails.shortMessage} - ${errorDetails.longMessage} (Code: ${errorDetails.errorCode})` };
  }
  
  // Parse ItemID from XML response
  const itemIdMatch = xmlResponse.match(/<ItemID>([^<]+)<\/ItemID>/);
  if (!itemIdMatch) {
    console.error('[LISTING] No ItemID found in eBay response');
    return { error: 'No ItemID found in eBay response' };
  }

  const listingId = itemIdMatch[1];
  const listingUrl = `https://www.ebay.com/itm/${listingId}`;
  
  console.log('[LISTING] Successfully created eBay listing:', listingId);
  
  return {
    listingId,
    listingUrl
  };
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

    // Get eBay API credentials
    const ebayDevId = Deno.env.get('EBAY_DEV_ID');
    const ebayAppId = Deno.env.get('EBAY_CLIENT_ID');
    const ebayCertId = Deno.env.get('EBAY_CLIENT_SECRET');
    
    if (!ebayDevId || !ebayAppId || !ebayCertId) {
      return new Response(
        JSON.stringify({ 
          error: "eBay API credentials not configured",
          missing: {
            devId: !ebayDevId,
            appId: !ebayAppId,
            certId: !ebayCertId
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    console.log('[LISTING] Processing listing request for user:', requestData.user_id);
    console.log('[LISTING] Item ID:', requestData.item_id);
    console.log('[LISTING] Listing title:', requestData.listing_data.title);

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

    console.log('[LISTING] Valid access token found, proceeding with listing creation');

    // Get item details from database to include photo
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('photo_url, name, description')
      .eq('id', requestData.item_id)
      .eq('user_id', requestData.user_id)
      .single();

    if (itemError || !item) {
      console.error('[LISTING] Item not found:', itemError);
      return new Response(
        JSON.stringify({ error: "Item not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Include item photo if available
    const photos = [];
    if (item.photo_url) {
      photos.push(item.photo_url);
      console.log('[LISTING] Including item photo:', item.photo_url);
    }
    
    // Add any additional photos from the request
    if (requestData.listing_data.photos) {
      photos.push(...requestData.listing_data.photos);
    }

    // Create the listing on eBay
    const listingResult = await createEbayListing(
      accessToken,
      {
        ...requestData.listing_data,
        photos: photos.slice(0, 12) // eBay allows max 12 photos
      },
      ebayDevId,
      ebayAppId,
      ebayCertId
    );

    if (listingResult.error) {
      console.error('[LISTING] Failed to create eBay listing:', listingResult.error);
      return new Response(
        JSON.stringify({ error: listingResult.error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('[LISTING] eBay listing created successfully:', listingResult.listingId);

    // Store listing in database
    const { data: listing, error: dbError } = await supabase
      .from('ebay_listings')
      .insert({
        user_id: requestData.user_id,
        inventory_item_id: requestData.item_id,
        ebay_listing_id: listingResult.listingId,
        listing_url: listingResult.listingUrl,
        title: requestData.listing_data.title,
        start_price: requestData.listing_data.start_price,
        buy_it_now_price: requestData.listing_data.buy_it_now_price,
        status: 'active',
      })
      .select()
      .single();

    if (dbError) {
      console.error('[LISTING] Error storing listing in database:', dbError);
      // Don't fail the request since the eBay listing was created successfully
    } else {
      console.log('[LISTING] Listing stored in database successfully');
    }

    return new Response(
      JSON.stringify({
        listing_id: listingResult.listingId,
        listing_url: listingResult.listingUrl,
        status: 'active',
        created_at: new Date().toISOString(),
        photos_included: photos.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('[LISTING] eBay listing error:', error);
    
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