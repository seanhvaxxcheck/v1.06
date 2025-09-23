import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
};

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

async function findUserByCustomerId(supabase: any, customerId: string): Promise<string | null> {
  console.log('🔍 Finding user for customer:', customerId);
  
  // First check our stripe_customers table
  const { data: customerRecord, error: customerError } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .maybeSingle();

  if (customerError) {
    console.error('❌ Error querying stripe_customers:', customerError);
  }

  if (customerRecord?.user_id) {
    console.log('✅ Found user in stripe_customers:', customerRecord.user_id);
    return customerRecord.user_id;
  }

  // If not found, try to get customer from Stripe and check metadata
  console.log('🔍 Customer not in database, fetching from Stripe...');
  
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const customerResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (customerResponse.ok) {
      const customer = await customerResponse.json();
      console.log('📋 Stripe customer metadata:', customer.metadata);
      
      const userId = customer.metadata?.user_id || customer.metadata?.supabase_user_id;
      
      if (userId) {
        console.log('✅ Found user_id in Stripe metadata:', userId);
        
        // Save this customer to our database for future lookups
        const { error: saveError } = await supabase
          .from('stripe_customers')
          .upsert({
            user_id: userId,
            customer_id: customerId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (saveError) {
          console.error('❌ Error saving customer from Stripe:', saveError);
        } else {
          console.log('✅ Saved customer from Stripe to database');
        }
        
        return userId;
      }

      // If no user_id in metadata, try to find by email
      if (customer.email) {
        console.log('🔍 Trying to find user by email:', customer.email);
        
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        
        if (!userError && userData?.users) {
          const matchingUser = userData.users.find(u => u.email === customer.email);
          if (matchingUser) {
            console.log('✅ Found user by email:', matchingUser.id);
            
            // Save this customer mapping
            const { error: saveError } = await supabase
              .from('stripe_customers')
              .upsert({
                user_id: matchingUser.id,
                customer_id: customerId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id'
              });

            if (saveError) {
              console.error('❌ Error saving customer by email:', saveError);
            }
            
            return matchingUser.id;
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fetching customer from Stripe:', error);
  }

  console.log('❌ Could not find user for customer:', customerId);
  return null;
}

async function handleCustomerCreated(supabase: any, customer: any) {
  console.log('=== PROCESSING customer.created ===');
  console.log('Customer ID:', customer.id);
  console.log('Customer email:', customer.email);
  console.log('Customer metadata:', customer.metadata);
  
  const userId = await findUserByCustomerId(supabase, customer.id);
  
  if (!userId) {
    console.error('❌ Cannot process customer.created - no user found');
    return;
  }

  console.log('👤 Processing customer.created for user:', userId);

  try {
    // Upsert customer record (don't create duplicates)
    const { data, error } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        customer_id: customer.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('❌ Error upserting customer:', error);
      throw error;
    }

    console.log('✅ Successfully processed customer.created:', data);
  } catch (error) {
    console.error('❌ Failed to process customer.created:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(supabase: any, subscription: any) {
  console.log('=== PROCESSING customer.subscription.created ===');
  console.log('Subscription ID:', subscription.id);
  console.log('Customer ID:', subscription.customer);
  console.log('Status:', subscription.status);
  console.log('Price ID:', subscription.items.data[0]?.price?.id);

  const userId = await findUserByCustomerId(supabase, subscription.customer);
  
  if (!userId) {
    console.error('❌ Cannot process subscription.created - no user found for customer:', subscription.customer);
    return;
  }

  console.log('👤 Processing subscription.created for user:', userId);

  try {
    // Get payment method info if available
    let paymentMethodBrand = null;
    let paymentMethodLast4 = null;
    
    if (subscription.default_payment_method) {
      try {
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const pmResponse = await fetch(`https://api.stripe.com/v1/payment_methods/${subscription.default_payment_method}`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        });
        
        if (pmResponse.ok) {
          const paymentMethod = await pmResponse.json();
          paymentMethodBrand = paymentMethod.card?.brand;
          paymentMethodLast4 = paymentMethod.card?.last4;
        }
      } catch (pmError) {
        console.log('Could not fetch payment method details:', pmError);
      }
    }

    // Upsert subscription record (update existing or create new)
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .upsert({
        customer_id: subscription.customer,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0]?.price?.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        payment_method_brand: paymentMethodBrand,
        payment_method_last4: paymentMethodLast4,
        status: subscription.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id'
      })
      .select();

    if (error) {
      console.error('❌ Error upserting subscription:', error);
      throw error;
    }

    console.log('✅ Successfully processed subscription.created:', data);

    // Update user's profile subscription status
    await updateUserProfile(supabase, userId, subscription.status, subscription.items.data[0]?.price?.id);

  } catch (error) {
    console.error('❌ Failed to process subscription.created:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  console.log('=== PROCESSING customer.subscription.updated ===');
  console.log('Subscription ID:', subscription.id);
  console.log('Customer ID:', subscription.customer);
  console.log('Status:', subscription.status);

  const userId = await findUserByCustomerId(supabase, subscription.customer);
  
  if (!userId) {
    console.error('❌ Cannot process subscription.updated - no user found for customer:', subscription.customer);
    return;
  }

  console.log('👤 Processing subscription.updated for user:', userId);

  try {
    // Get payment method info if available
    let paymentMethodBrand = null;
    let paymentMethodLast4 = null;
    
    if (subscription.default_payment_method) {
      try {
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const pmResponse = await fetch(`https://api.stripe.com/v1/payment_methods/${subscription.default_payment_method}`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        });
        
        if (pmResponse.ok) {
          const paymentMethod = await pmResponse.json();
          paymentMethodBrand = paymentMethod.card?.brand;
          paymentMethodLast4 = paymentMethod.card?.last4;
        }
      } catch (pmError) {
        console.log('Could not fetch payment method details:', pmError);
      }
    }

    // Update subscription record
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .upsert({
        customer_id: subscription.customer,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0]?.price?.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        payment_method_brand: paymentMethodBrand,
        payment_method_last4: paymentMethodLast4,
        status: subscription.status,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'customer_id'
      })
      .select();

    if (error) {
      console.error('❌ Error updating subscription:', error);
      throw error;
    }

    console.log('✅ Successfully processed subscription.updated:', data);

    // Update user's profile subscription status
    await updateUserProfile(supabase, userId, subscription.status, subscription.items.data[0]?.price?.id);

  } catch (error) {
    console.error('❌ Failed to process subscription.updated:', error);
    throw error;
  }
}

async function handleCheckoutCompleted(supabase: any, session: any) {
  console.log('=== PROCESSING checkout.session.completed ===');
  console.log('Session ID:', session.id);
  console.log('Customer ID:', session.customer);
  console.log('Mode:', session.mode);
  console.log('Payment status:', session.payment_status);

  const userId = await findUserByCustomerId(supabase, session.customer);
  
  if (!userId) {
    console.error('❌ Cannot process checkout.completed - no user found for customer:', session.customer);
    return;
  }

  console.log('👤 Processing checkout.completed for user:', userId);

  try {
    // Ensure customer record exists and is up to date
    const { error: customerError } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        customer_id: session.customer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (customerError) {
      console.error('❌ Error ensuring customer record:', customerError);
    } else {
      console.log('✅ Customer record ensured');
    }

    // For subscription mode, the subscription events will handle the rest
    if (session.mode === 'subscription') {
      console.log('✅ Subscription checkout completed - subscription events will handle updates');
    }

  } catch (error) {
    console.error('❌ Failed to process checkout.session.completed:', error);
    throw error;
  }
}

async function updateUserProfile(supabase: any, userId: string, subscriptionStatus: string, priceId: string) {
  console.log('=== UPDATING USER PROFILE ===');
  console.log('User ID:', userId);
  console.log('Subscription Status:', subscriptionStatus);
  console.log('Price ID:', priceId);

  try {
    // Determine subscription tier from price_id
    let subscriptionTier = 'free';
    if (priceId === 'price_1S5equCZfIVspKe98prCSSX2') {
      subscriptionTier = 'free'; // Starter plan
    } else if (priceId === 'price_1S5euOCZfIVspKe9ysPWz3NY') {
      subscriptionTier = 'pro';
    } else if (priceId === 'price_1S3iyBCZfIVspKe9hG2VK67R') {
      subscriptionTier = 'collector';
    }

    // Map Stripe status to our status
    let profileStatus = 'inactive';
    if (['active', 'trialing'].includes(subscriptionStatus)) {
      profileStatus = 'active';
    } else if (subscriptionStatus === 'past_due') {
      profileStatus = 'past_due';
    } else if (['canceled', 'cancelled'].includes(subscriptionStatus)) {
      profileStatus = 'cancelled';
    }

    console.log('📝 Updating profile with:', {
      subscription_status: profileStatus,
      subscription_tier: subscriptionTier
    });

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_status: profileStatus,
        subscription_tier: subscriptionTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }

    console.log('✅ Successfully updated user profile:', data);

  } catch (error) {
    console.error('❌ Failed to update user profile:', error);
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Body length:', body.length);
    console.log('Has signature:', !!signature);

    // Parse the event
    let event: StripeEvent;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('❌ Error parsing webhook body:', err);
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('📨 Processing Stripe webhook event:', event.type, event.id);

    // Handle different event types
    try {
      switch (event.type) {
        case 'customer.created':
          await handleCustomerCreated(supabase, event.data.object);
          break;
          
        case 'customer.subscription.created':
          await handleSubscriptionCreated(supabase, event.data.object);
          break;
          
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(supabase, event.data.object);
          break;
          
        case 'checkout.session.completed':
          await handleCheckoutCompleted(supabase, event.data.object);
          break;
          
        default:
          console.log('ℹ️ Unhandled event type:', event.type);
      }

      console.log('✅ Successfully processed webhook event:', event.type);

      return new Response(
        JSON.stringify({ 
          received: true,
          event_type: event.type,
          event_id: event.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );

    } catch (processingError: any) {
      console.error('❌ Error processing webhook event:', processingError);
      
      return new Response(
        JSON.stringify({ 
          error: "Event processing failed",
          event_type: event.type,
          details: processingError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Webhook processing failed",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});