import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CheckoutRequest {
  price_id: string;
  mode: 'subscription' | 'payment';
  success_url: string;
  cancel_url: string;
}

async function findUserByCustomerId(supabase: any, customerId: string): Promise<string | null> {
  console.log('🔍 Finding user for customer:', customerId);
  
  const { data: customerRecord, error: customerError } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .maybeSingle();

  if (customerError) {
    console.error('❌ Error querying stripe_customers:', customerError);
    return null;
  }

  return customerRecord?.user_id || null;
}

async function getActiveSubscription(customerId: string, stripeSecretKey: string): Promise<any | null> {
  console.log('🔍 Checking for active subscription for customer:', customerId);
  
  try {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch subscriptions from Stripe');
      return null;
    }

    const result = await response.json();
    const activeSubscription = result.data?.[0];
    
    if (activeSubscription) {
      console.log('✅ Found active subscription:', activeSubscription.id);
      return activeSubscription;
    } else {
      console.log('ℹ️ No active subscription found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching active subscription:', error);
    return null;
  }
}

async function updateExistingSubscription(subscriptionId: string, newPriceId: string, stripeSecretKey: string): Promise<any> {
  console.log('🔄 Updating existing subscription:', subscriptionId, 'to price:', newPriceId);
  
  try {
    // First, get the current subscription to find the subscription item ID
    const getSubResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!getSubResponse.ok) {
      throw new Error('Failed to fetch current subscription');
    }

    const currentSub = await getSubResponse.json();
    const subscriptionItemId = currentSub.items.data[0]?.id;

    if (!subscriptionItemId) {
      throw new Error('No subscription item found');
    }

    // Update the subscription item to the new price
    const updateParams = new URLSearchParams({
      'items[0][id]': subscriptionItemId,
      'items[0][price]': newPriceId,
      'proration_behavior': 'create_prorations', // Handle prorations automatically
    });

    const updateResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: updateParams,
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      console.error('❌ Subscription update failed:', errorData);
      throw new Error('Failed to update subscription');
    }

    const updatedSubscription = await updateResponse.json();
    console.log('✅ Successfully updated subscription:', updatedSubscription.id);
    
    return updatedSubscription;
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('=== CHECKOUT REQUEST START ===');
    console.log('User:', user.id, user.email);

    const requestData: CheckoutRequest = await req.json();

    // Validate required fields
    if (!requestData.price_id || !requestData.success_url || !requestData.cancel_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Check if user already has a Stripe customer
    console.log('🔍 Checking for existing Stripe customer...');
    
    const { data: existingCustomer, error: customerQueryError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerQueryError) {
      console.error('❌ Error querying customers:', customerQueryError);
    }

    let customerId = existingCustomer?.customer_id;

    // Step 2: If no customer exists, search Stripe by email first
    if (!customerId) {
      console.log('🔍 No local customer found, searching Stripe by email...');
      
      try {
        const searchResponse = await fetch(`https://api.stripe.com/v1/customers/search?query=email:'${user.email}'`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        });

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult.data && searchResult.data.length > 0) {
            customerId = searchResult.data[0].id;
            console.log('✅ Found existing Stripe customer by email:', customerId);
            
            // Save this customer to our database
            const { error: saveError } = await supabase
              .from('stripe_customers')
              .upsert({
                user_id: user.id,
                customer_id: customerId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id'
              });

            if (saveError) {
              console.error('❌ Error saving found customer:', saveError);
            } else {
              console.log('✅ Saved existing customer to database');
            }
          }
        }
      } catch (searchError) {
        console.error('❌ Error searching Stripe customers:', searchError);
      }
    }

    // Step 3: Create new customer only if none exists
    if (!customerId) {
      console.log('🆕 Creating new Stripe customer...');
      
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email || '',
          'metadata[user_id]': user.id,
          'metadata[supabase_user_id]': user.id,
        }),
      });

      if (!customerResponse.ok) {
        const errorData = await customerResponse.text();
        console.error('❌ Stripe customer creation failed:', errorData);
        return new Response(
          JSON.stringify({ error: "Failed to create customer" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const customer = await customerResponse.json();
      customerId = customer.id;
      console.log('✅ Created new Stripe customer:', customerId);

      // Save new customer to database
      const { error: customerInsertError } = await supabase
        .from('stripe_customers')
        .upsert({
          user_id: user.id,
          customer_id: customerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (customerInsertError) {
        console.error('❌ Failed to save customer:', customerInsertError);
      } else {
        console.log('✅ Saved new customer to database');
      }
    } else {
      console.log('♻️ Using existing customer:', customerId);
    }

    // Step 4: Check for existing active subscription and handle upgrade
    if (requestData.mode === 'subscription') {
      const activeSubscription = await getActiveSubscription(customerId, stripeSecretKey);
      
      if (activeSubscription) {
        console.log('🔄 Found active subscription, updating instead of creating new one');
        
        try {
          const updatedSubscription = await updateExistingSubscription(
            activeSubscription.id, 
            requestData.price_id, 
            stripeSecretKey
          );
          
          // Update our database with the new subscription details
          const { error: updateDbError } = await supabase
            .from('stripe_subscriptions')
            .update({
              price_id: requestData.price_id,
              updated_at: new Date().toISOString(),
            })
            .eq('customer_id', customerId);

          if (updateDbError) {
            console.error('❌ Error updating subscription in database:', updateDbError);
          } else {
            console.log('✅ Updated subscription in database');
          }

          // Return success URL directly since subscription was updated
          return new Response(
            JSON.stringify({ 
              url: requestData.success_url.replace('{CHECKOUT_SESSION_ID}', 'subscription_updated'),
              subscription_id: updatedSubscription.id,
              customer_id: customerId,
              updated: true
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
          
        } catch (updateError) {
          console.error('❌ Failed to update subscription, falling back to checkout:', updateError);
          // Fall through to create checkout session as fallback
        }
      }
    }

    // Step 5: Create checkout session (for new subscriptions or if update failed)
    console.log('🛒 Creating checkout session...');
    
    const checkoutParams = new URLSearchParams({
      'mode': requestData.mode,
      'customer': customerId,
      'line_items[0][price]': requestData.price_id,
      'line_items[0][quantity]': '1',
      'success_url': requestData.success_url,
      'cancel_url': requestData.cancel_url,
      'client_reference_id': user.id,
      'metadata[user_id]': user.id,
      'metadata[user_email]': user.email || '',
      'metadata[supabase_user_id]': user.id,
    });

    // For subscriptions, add subscription-specific metadata
    if (requestData.mode === 'subscription') {
      checkoutParams.append('subscription_data[metadata][user_id]', user.id);
      checkoutParams.append('subscription_data[metadata][supabase_user_id]', user.id);
      checkoutParams.append('subscription_data[metadata][user_email]', user.email || '');
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: checkoutParams,
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error('❌ Stripe checkout failed:', errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripeResponse.json();
    console.log('✅ Created checkout session:', session.id);
    console.log('=== CHECKOUT REQUEST SUCCESS ===');

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id,
        customer_id: customerId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('=== CHECKOUT REQUEST FAILED ===');
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to create checkout session",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});