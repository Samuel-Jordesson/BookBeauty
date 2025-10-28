# Configuração do Stripe no Supabase

## 📋 Passo a Passo

### 1. Obter Price IDs no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/test/products
2. Clique no produto **"Basico"** (prod_TJqJ2VklXFnKBq)
3. Na seção **"Pricing"**, você verá o Price ID (começa com `price_`)
   - Se não existir, clique em **"Add price"** e crie um price recorrente mensal de R$ 9,99
4. Copie o Price ID e repita para **"Premium"** (R$ 19,99/mês)

### 2. Configurar Variáveis de Ambiente no Supabase

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
2. Vá em **Edge Functions** > **Secrets**
3. Adicione os seguintes secrets:

```
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_SECRETA_AQUI
STRIPE_PRICE_BASIC=price_XXXXXXXXXXXXXX (substitua pelo Price ID do Básico)
STRIPE_PRICE_PREMIUM=price_YYYYYYYYYYYYYY (substitua pelo Price ID do Premium)
SITE_URL=http://localhost:8080 (ou sua URL de produção)
SUPABASE_URL=https://wtwxggubulpikvsdiusn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key (encontre em Settings > API)
```

### 3. Fazer Deploy das Edge Functions

No terminal, execute:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar com seu projeto
supabase link --project-ref wtwxggubulpikvsdiusn

# Fazer deploy das functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 4. Configurar Webhook no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://wtwxggubulpikvsdiusn.supabase.co/functions/v1/stripe-webhook`
   - **Events to send**: Selecione:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Copie o **Signing secret** (começa com `whsec_`)
5. Adicione como secret no Supabase:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXX
   ```

### 5. Testar o Checkout

1. Acesse a página de preços: `/pricing`
2. Clique em **"Escolher Básico"** ou **"Escolher Premium"**
3. Será redirecionado para o checkout do Stripe
4. Use o cartão de teste: `4242 4242 4242 4242`
5. Qualquer data futura para expiração e CVC

## ✅ Verificação

Após o pagamento bem-sucedido:
- Você será redirecionado para `/dashboard?success=true`
- O webhook atualizará o plano do salão no banco de dados
- Verifique na tabela `salons` se os campos de assinatura foram atualizados

## 🔧 Troubleshooting

**Erro: "Price ID not found"**
- Verifique se os Price IDs estão configurados corretamente nos secrets

**Erro: "Webhook signature verification failed"**
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto no Supabase

**Checkout não abre**
- Verifique se as Edge Functions foram deployadas corretamente
- Verifique os logs: `supabase functions logs create-checkout-session`
