import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SessionLoginRequest {
  session_id: string;
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

    const { session_id }: SessionLoginRequest = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Stripe session details
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

    console.log('Fetching Stripe session:', session_id);

    const sessionResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.text();
      console.error('Failed to fetch Stripe session:', errorData);
      return new Response(
        JSON.stringify({ error: "Invalid session ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await sessionResponse.json();
    console.log('Stripe session data:', {
      id: session.id,
      customer: session.customer,
      client_reference_id: session.client_reference_id,
      customer_email: session.customer_details?.email,
      payment_status: session.payment_status,
      mode: session.mode
    });

    // Get customer details
    let customerEmail = session.customer_details?.email;
    let customerId = session.customer;

    if (!customerEmail && customerId) {
      // Fetch customer details from Stripe
      const customerResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      });

      if (customerResponse.ok) {
        const customer = await customerResponse.json();
        customerEmail = customer.email;
      }
    }

    console.log('Extracted info:', {
      customer_email: customerEmail,
      customer_id: customerId,
      user_id: session.client_reference_id
    });

    return new Response(
      JSON.stringify({
        user_email: customerEmail,
        customer_id: customerId,
        user_id: session.client_reference_id,
        session_data: {
          payment_status: session.payment_status,
          mode: session.mode,
          amount_total: session.amount_total
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('Session login error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process session login",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});