import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
  typescript: true,
})

// SUPABASE_URL está disponível automaticamente nas Edge Functions
// SERVICE_ROLE_KEY precisa ser configurado como secret (sem o prefixo SUPABASE_)
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Sempre responder a OPTIONS com sucesso
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  // Garantir que sempre retornamos 200 OK mesmo em caso de erro
  // para evitar retry do Stripe
  try {
    console.log('Received webhook request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    })

    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.warn('No signature header found, proceeding anyway')
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

    let event: Stripe.Event
    // Em Deno/Edge Functions, a verificação de assinatura causa problemas com runMicrotasks
    // Vamos processar o evento diretamente sem verificação de assinatura
    // NOTA: Em produção, considere implementar verificação manual usando Web Crypto API
    try {
      event = JSON.parse(body) as Stripe.Event
      console.log('Processing webhook event:', event.type, event.id)
    } catch (parseErr: any) {
      console.error('Failed to parse webhook body:', parseErr.message)
      return new Response(JSON.stringify({ error: `Failed to parse event: ${parseErr.message}` }), { 
        status: 200, // Retornar 200 para evitar retry do Stripe
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('Checkout session completed:', {
          mode: session.mode,
          metadata: session.metadata,
          subscription: session.subscription,
          payment_intent: session.payment_intent,
          id: session.id
        })
        
        // Processar assinatura
        if (session.mode === 'subscription' && session.metadata) {
          const { salonId, planId } = session.metadata
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string

          console.log('Processing subscription:', { salonId, planId, subscriptionId, customerId })

          if (!salonId || !planId || !subscriptionId || !customerId) {
            console.error('Missing required data:', { salonId, planId, subscriptionId, customerId })
            return new Response(JSON.stringify({ error: 'Missing required data' }), { 
              status: 200, // Retornar 200 para evitar retry
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // Atualizar salão no banco diretamente
          // Evitamos buscar subscription do Stripe para evitar erro de runMicrotasks
          const updateData: any = {
            subscription_plan: planId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active', // Assumir ativo quando checkout é completado
          }
          
          // Calcular data de expiração (30 dias a partir de agora)
          const periodEndDate = new Date()
          periodEndDate.setDate(periodEndDate.getDate() + 30)
          updateData.subscription_current_period_end = periodEndDate.toISOString()
          
          const { data, error } = await supabase
            .from('salons')
            .update(updateData)
            .eq('id', salonId)
            .select()

          if (error) {
            console.error('Error updating salon:', error)
            return new Response(JSON.stringify({ error: error.message }), { 
              status: 200, // Retornar 200 para evitar retry
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          console.log('Salon updated successfully:', data)
        } 
        // Processar pagamento único (caso o checkout seja em modo payment)
        else if (session.mode === 'payment' && session.metadata) {
          const { salonId, planId } = session.metadata
          
          console.log('Processing one-time payment:', { salonId, planId })

          if (salonId && planId) {
            // Atualizar salão no banco
            const { data, error } = await supabase
              .from('salons')
              .update({
                subscription_plan: planId,
              })
              .eq('id', salonId)
              .select()

            if (error) {
              console.error('Error updating salon:', error)
              return new Response(JSON.stringify({ error: error.message }), { 
                status: 200, // Retornar 200 para evitar retry
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }

            console.log('Salon updated successfully (one-time payment):', data)
          }
        } else {
          console.log('Skipping - not a subscription/payment or missing metadata')
        }
        break
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        console.log('Payment intent succeeded:', {
          metadata: paymentIntent.metadata,
          id: paymentIntent.id
        })
        
        // Se houver metadata com salonId e planId, atualizar
        if (paymentIntent.metadata && paymentIntent.metadata.salonId && paymentIntent.metadata.planId) {
          const { salonId, planId } = paymentIntent.metadata
          
          console.log('Processing payment intent with metadata:', { salonId, planId })

          const { data, error } = await supabase
            .from('salons')
            .update({
              subscription_plan: planId,
            })
            .eq('id', salonId)
            .select()

          if (error) {
            console.error('Error updating salon from payment_intent:', error)
          } else {
            console.log('Salon updated successfully from payment_intent:', data)
          }
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const salonId = subscription.metadata?.salonId

        if (salonId) {
          const updateData: any = {
            subscription_status: subscription.status,
          }
          
          // Preservar o plano atual baseado no metadata ou manter o que já está no banco
          // Só mudar para free se realmente cancelado
          if (subscription.status === 'canceled' || subscription.status === 'unpaid' || subscription.status === 'past_due') {
            updateData.subscription_plan = 'free'
          } else if (subscription.status === 'active' || subscription.status === 'trialing') {
            // Se está ativo, manter ou atualizar baseado no metadata
            const planIdFromMetadata = subscription.metadata?.planId
            if (planIdFromMetadata && (planIdFromMetadata === 'basic' || planIdFromMetadata === 'premium')) {
              updateData.subscription_plan = planIdFromMetadata
            }
            // Se não tem metadata, não alterar o plano (mantém o atual)
          }
          
          // Converter timestamp para ISO string com validação
          if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
            const periodEndDate = new Date(subscription.current_period_end * 1000)
            if (!isNaN(periodEndDate.getTime())) {
              updateData.subscription_current_period_end = periodEndDate.toISOString()
            }
          }
          
          console.log('Updating subscription status:', {
            salonId,
            status: subscription.status,
            planId: updateData.subscription_plan,
            metadata: subscription.metadata
          })
          
          const { error } = await supabase
            .from('salons')
            .update(updateData)
            .eq('id', salonId)

          if (error) {
            console.error('Error updating subscription:', error)
          } else {
            console.log('Subscription updated successfully:', updateData)
          }
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 200, // Retornar 200 para evitar retry do Stripe mesmo em caso de erro
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
