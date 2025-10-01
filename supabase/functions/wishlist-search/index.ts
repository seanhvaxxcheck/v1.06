import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface WishlistSearchRequest {
  wishlistItemId?: string;
  platforms?: ('ebay' | 'facebook' | 'mercari' | 'etsy')[];
}

interface SearchResult {
  title: string;
  price: number;
  url: string;
  imageUrl?: string;
  platform: 'ebay' | 'facebook' | 'mercari' | 'etsy';
  condition?: string;
  location?: string;
  seller?: string;
  endTime?: string;
}

function generateMockSearchResults(
  searchTerms: string[], 
  platforms: string[], 
  maxPrice?: number
): SearchResult[] {
  const results: SearchResult[] = [];
  const basePrice = maxPrice ? Math.min(maxPrice * 0.8, 100) : 75;
  
  platforms.forEach(platform => {
    const platformResults = searchTerms.flatMap(term => {
      const numResults = Math.floor(Math.random() * 3) + 1; // 1-3 results per term per platform
      
      return Array.from({ length: numResults }, (_, i) => {
        const price = Math.round((Math.random() * basePrice + basePrice * 0.3) * 100) / 100;
        
        // Skip if over max price
        if (maxPrice && price > maxPrice) return null;
        
        const platformInfo = {
          ebay: { 
            baseUrl: 'https://www.ebay.com/itm/',
            titlePrefix: 'Vintage',
            conditions: ['New', 'Used', 'Very Good', 'Good', 'Fair']
          },
          facebook: { 
            baseUrl: 'https://www.facebook.com/marketplace/item/',
            titlePrefix: 'Local',
            conditions: ['Like New', 'Good', 'Fair']
          },
          mercari: { 
            baseUrl: 'https://www.mercari.com/us/item/',
            titlePrefix: 'Authentic',
            conditions: ['New', 'Like New', 'Good', 'Fair']
          },
          etsy: { 
            baseUrl: 'https://www.etsy.com/listing/',
            titlePrefix: 'Handmade',
            conditions: ['New', 'Vintage', 'Good']
          }
        };
        
        const info = platformInfo[platform as keyof typeof platformInfo];
        const condition = info.conditions[Math.floor(Math.random() * info.conditions.length)];
        
        return {
          title: `${info.titlePrefix} ${term} - ${condition} Condition`,
          price,
          url: `${info.baseUrl}${Date.now()}${i}`,
          platform: platform as any,
          condition,
          location: platform === 'facebook' ? 'Local pickup' : undefined,
          seller: `seller_${Math.random().toString(36).substr(2, 8)}`,
          endTime: platform === 'ebay' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        };
      }).filter(Boolean);
    });
    
    results.push(...platformResults as SearchResult[]);
  });

  return results.slice(0, 15); // Limit total results
}

async function processWishlistSearch(supabase: any, item: any, platforms: string[]): Promise<number> {
  console.log(`Processing wishlist search for: ${item.item_name}`);
  
  const searchTerms = [
    item.ebay_search_term,
    item.additional_search_terms,
    item.item_name
  ].filter(Boolean).filter(term => term.trim());

  if (searchTerms.length === 0) {
    console.log(`Skipping item ${item.id} - no search terms`);
    return 0;
  }

  try {
    const searchResults = generateMockSearchResults(
      searchTerms,
      platforms,
      item.desired_price_max
    );

    let newListingsCount = 0;

    for (const result of searchResults) {
      // Check if this listing already exists
      const { data: existingListing } = await supabase
        .from('found_listings')
        .select('id')
        .eq('wishlist_item_id', item.id)
        .eq('listing_url', result.url)
        .single();

      if (!existingListing) {
        const { error: insertError } = await supabase
          .from('found_listings')
          .insert({
            wishlist_item_id: item.id,
            platform: result.platform,
            listing_title: result.title,
            listing_price: result.price,
            listing_url: result.url,
            listing_image_url: result.imageUrl,
            found_at: new Date().toISOString(),
            notified: false,
          });

        if (insertError) {
          console.error('Error inserting found listing:', insertError);
        } else {
          newListingsCount++;
          console.log(`Found new listing: ${result.title} - $${result.price} on ${result.platform}`);
        }
      }
    }

    // Update last checked timestamp
    await supabase
      .from('wishlist_items')
      .update({ 
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    return newListingsCount;
    
  } catch (error) {
    console.error(`Error processing wishlist search ${item.id}:`, error);
    return 0;
  }
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: WishlistSearchRequest = await req.json().catch(() => ({}));
    const platforms = requestData.platforms || ['ebay', 'facebook', 'mercari', 'etsy'];
    
    let itemsToProcess = [];
    
    if (requestData.wishlistItemId) {
      // Search specific item
      const { data: item, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('id', requestData.wishlistItemId)
        .single();
        
      if (error) {
        return new Response(
          JSON.stringify({ error: "Wishlist item not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      itemsToProcess = [item];
    } else {
      // Search all active items
      const { data: items, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('status', 'active')
        .or('ebay_search_term.neq.,additional_search_terms.neq.,item_name.neq.');
        
      if (error) {
        console.error('Error fetching wishlist items:', error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch wishlist items" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      itemsToProcess = items || [];
    }

    console.log(`Processing ${itemsToProcess.length} wishlist items across ${platforms.length} platforms`);
    
    let totalNewListings = 0;
    const results = [];
    
    for (const item of itemsToProcess) {
      const newListingsCount = await processWishlistSearch(supabase, item, platforms);
      totalNewListings += newListingsCount;
      
      results.push({
        itemId: item.id,
        itemName: item.item_name,
        newListingsFound: newListingsCount,
        platformsSearched: platforms,
      });
    }

    const response = {
      success: true,
      itemsProcessed: itemsToProcess.length,
      platformsSearched: platforms,
      totalNewListings,
      results,
      processedAt: new Date().toISOString(),
    };

    console.log('Wishlist search completed:', response);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('Wishlist search error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process wishlist search",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});