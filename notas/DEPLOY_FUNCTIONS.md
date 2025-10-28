# 🚀 Como Fazer Deploy das Edge Functions

## ⚠️ Importante: Secrets que faltam

Você já configurou:
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_PRICE_BASIC  
- ✅ STRIPE_PRICE_PREMIUM
- ✅ SITE_URL

**Você ainda precisa adicionar:**

### 1. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

1. No Supabase Dashboard, vá em **Settings > API**
2. Copie:
   - **Project URL**: `https://wtwxggubulpikvsdiusn.supabase.co`
   - **service_role key** (a secret, não a anon key!)

3. Adicione como secrets:
   ```
   SUPABASE_URL=https://wtwxggubulpikvsdiusn.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```

### 2. Fazer Deploy via Supabase Dashboard (Mais Fácil!)

**Opção 1: Via Dashboard (Recomendado)**

1. Acesse: https://supabase.com/dashboard/project/wtwxggubulpikvsdiusn/functions
2. Clique em **"Create a new function"**
3. Para cada function:
   - Nome: `create-checkout-session`
   - Cole o código de `supabase/functions/create-checkout-session/index.ts`
   - Clique em "Deploy"

   Repita para `stripe-webhook`

**Opção 2: Via CLI**

```bash
# 1. Login
supabase login

# 2. Linkar projeto
supabase link --project-ref wtwxggubulpikvsdiusn

# 3. Deploy
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 3. Configurar Webhook no Stripe

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. URL: `https://wtwxggubulpikvsdiusn.supabase.co/functions/v1/stripe-webhook`
4. Eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Copie o **Signing secret** (começa com `whsec_`)
6. Adicione no Supabase como: `STRIPE_WEBHOOK_SECRET`

## ✅ Testar

Depois disso:
1. Acesse `/pricing`
2. Clique em "Escolher Básico"
3. Use cartão de teste: `4242 4242 4242 4242`

**Pronto!** 🎉
