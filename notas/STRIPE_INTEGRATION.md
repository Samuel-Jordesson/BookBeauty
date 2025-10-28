# Integração com Stripe - Guia de Configuração

## 📋 Resumo

O sistema está configurado para integrar com o Stripe para processamento de pagamentos. Aqui está o que foi configurado e o que ainda precisa ser feito.

## ✅ O que já está configurado

1. **Biblioteca Stripe instalada**: `@stripe/stripe-js`
2. **Chave pública configurada**: Publishable Key do Stripe está no arquivo `src/integrations/stripe/config.ts`
3. **Product IDs configurados**:
   - Básico: `prod_TJqJ2VklXFnKBq` (R$ 9,99/mês)
   - Premium: `prod_TJqKIO36dhfRis` (R$ 19,99/mês)
4. **Migration criada**: Campos de assinatura adicionados à tabela `salons`

## 🔧 O que precisa ser feito

### 1. Criar Price IDs no Stripe Dashboard

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Para cada produto (Básico e Premium), crie um Price recorrente mensal
3. Copie os Price IDs (começam com `price_`)
4. Atualize o arquivo `src/integrations/stripe/config.ts` com os Price IDs

### 2. Configurar Backend para Checkout Session

Você precisa criar um endpoint backend que:

1. Cria uma Checkout Session no Stripe usando a Secret Key
2. Retorna a URL da sessão para redirecionamento
3. Configura webhooks para atualizar o status da assinatura no banco

#### Opções de Backend

**Opção 1: Supabase Edge Functions (Recomendado)**
```typescript
// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const { planId, userId, salonId } = await req.json()
  
  // Buscar Price ID do plano
  const priceId = getPriceId(planId)
  
  // Criar sessão de checkout
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${window.location.origin}/dashboard?success=true`,
    cancel_url: `${window.location.origin}/pricing?canceled=true`,
    metadata: {
      userId,
      salonId,
      planId,
    },
  })

  return new Response(
    JSON.stringify({ sessionId: session.id, url: session.url }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Opção 2: Node.js/Express Backend**
```javascript
// server.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout', async (req, res) => {
  const { planId, email } = req.body;
  
  const priceId = getPriceId(planId); // Função que retorna o Price ID
  
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.headers.origin}/dashboard?success=true`,
    cancel_url: `${req.headers.origin}/pricing?canceled=true`,
  });

  res.json({ url: session.url });
});
```

### 3. Configurar Webhooks

Configure webhooks no Stripe Dashboard para:
- `checkout.session.completed` - Atualizar assinatura quando pagamento for concluído
- `customer.subscription.updated` - Atualizar status da assinatura
- `customer.subscription.deleted` - Cancelar assinatura

### 4. Variáveis de Ambiente

Adicione ao `.env`:
```
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_SECRETA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_... (será gerado pelo Stripe)
```

## 🎯 Próximos Passos

1. Criar Price IDs no Stripe Dashboard
2. Configurar backend (Supabase Edge Function ou Node.js)
3. Configurar webhooks
4. Testar fluxo de checkout
5. Implementar lógica de verificação de assinatura no frontend

## 📝 Notas Importantes

- **Nunca exponha a Secret Key no frontend**
- Use a Publishable Key apenas no frontend
- Sempre valide webhooks usando o webhook secret
- Em produção, use as chaves de produção do Stripe

## 🔗 Recursos

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
