import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de planos para Price IDs
const PRICE_IDS: Record<string, string> = {
  basic: Deno.env.get('STRIPE_PRICE_BASIC') || '',
  premium: Deno.env.get('STRIPE_PRICE_PREMIUM') || '',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    const { planId, userId, salonId, userEmail } = await req.json()

    if (!planId || !userId || !salonId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planId, userId, salonId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const priceId = PRICE_IDS[planId]
    
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `Price ID not found for plan: ${planId}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&planId=${planId}`,
      cancel_url: `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/pricing?canceled=true`,
      metadata: {
        userId,
        salonId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          salonId,
          planId,
        },
      },
    })

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
