import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface EbaySearchRequest {
  wishlistItemId?: string;
}

interface EbayListing {
  title: string;
  price: number;
  url: string;
  imageUrl?: string;
  endTime: string;
  condition?: string;
}

function getMockEbayData(searchTerm: string, maxPrice?: number): EbayListing[] {
  const basePrice = maxPrice ? Math.min(maxPrice * 0.8, 50) : 50;
  
  return [
    {
      title: `${searchTerm} - Vintage Collectible`,
      price: Math.round((Math.random() * basePrice + basePrice * 0.5) * 100) / 100,
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}`,
      imageUrl: undefined,
      endTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      condition: 'Very Good',
    },
    {
      title: `Rare ${searchTerm} Collection Item`,
      price: Math.round((Math.random() * basePrice + basePrice * 0.3) * 100) / 100,
      url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}`,
      imageUrl: undefined,
      endTime: new Date(Date.now() + Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      condition: 'Good',
    },
  ].filter(item => !maxPrice || item.price <= maxPrice);
}

async function processWishlistItem(supabase: any, item: any): Promise<number> {
  if (!item.ebay_search_term?.trim()) {
    console.log(`Skipping item ${item.id} - no eBay search term`);
    return 0;
  }

  console.log(`Processing wishlist item: ${item.item_name} (${item.ebay_search_term})`);
  
  try {
    const listings = getMockEbayData(
      item.ebay_search_term,
      item.desired_price_max
    );

    let newListingsCount = 0;

    for (const listing of listings) {
      const { data: existingListing } = await supabase
        .from('found_listings')
        .select('id')
        .eq('wishlist_item_id', item.id)
        .eq('listing_url', listing.url)
        .single();

      if (!existingListing) {
        const { error: insertError } = await supabase
          .from('found_listings')
          .insert({
            wishlist_item_id: item.id,
            platform: 'ebay',
            listing_title: listing.title,
            listing_price: listing.price,
            listing_url: listing.url,
            listing_image_url: listing.imageUrl,
            found_at: new Date().toISOString(),
            notified: false,
          });

        if (insertError) {
          console.error('Error inserting found listing:', insertError);
        } else {
          newListingsCount++;
          console.log(`Found new listing: ${listing.title} - $${listing.price}`);
        }
      }
    }

    await supabase
      .from('wishlist_items')
      .update({ 
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    return newListingsCount;
    
  } catch (error) {
    console.error(`Error processing wishlist item ${item.id}:`, error);
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

    const requestData: EbaySearchRequest = await req.json().catch(() => ({}));
    
    let itemsToProcess = [];
    
    if (requestData.wishlistItemId) {
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
      const { data: items, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('status', 'active')
        .not('ebay_search_term', 'is', null)
        .not('ebay_search_term', 'eq', '');
        
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

    console.log(`Processing ${itemsToProcess.length} wishlist items`);
    
    let totalNewListings = 0;
    const results = [];
    
    for (const item of itemsToProcess) {
      const newListingsCount = await processWishlistItem(supabase, item);
      totalNewListings += newListingsCount;
      
      results.push({
        itemId: item.id,
        itemName: item.item_name,
        newListingsFound: newListingsCount,
      });
    }

    const response = {
      success: true,
      itemsProcessed: itemsToProcess.length,
      totalNewListings,
      results,
      processedAt: new Date().toISOString(),
    };

    console.log('eBay monitoring completed:', response);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('eBay monitor error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process eBay monitoring",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});