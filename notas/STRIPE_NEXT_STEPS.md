# 🚀 Próximos Passos - Integração Stripe

## ✅ O que já está pronto

1. ✅ Edge Functions criadas (`create-checkout-session` e `stripe-webhook`)
2. ✅ Frontend configurado para chamar checkout
3. ✅ Botões atualizados para acionar pagamento
4. ✅ Migration de banco criada

## 🔧 O que você precisa fazer AGORA

### 1. Obter Price IDs no Stripe (OBRIGATÓRIO)

1. Acesse: https://dashboard.stripe.com/test/products
2. **Para "Basico" (prod_TJqJ2VklXFnKBq)**:
   - Se não tiver Price, clique em "Add price"
   - Configure: R$ 9,99 / Mês (recurring)
   - Copie o Price ID (começa com `price_`)
3. **Para "Premium" (prod_TJqKIO36dhfRis)**:
   - Se não tiver Price, clique em "Add price"
   - Configure: R$ 19,99 / Mês (recurring)
   - Copie o Price ID (começa com `price_`)

### 2. Configurar Secrets no Supabase

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
2. Vá em **Edge Functions** > **Secrets**
3. Adicione:

```
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_SECRETA_AQUI
STRIPE_PRICE_BASIC=price_SEU_PRICE_ID_AQUI
STRIPE_PRICE_PREMIUM=price_SEU_PRICE_ID_AQUI
SITE_URL=http://localhost:8080
SUPABASE_URL=https://wtwxggubulpikvsdiusn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_do_supabase
```

**Encontrar Service Role Key:**
- Supabase Dashboard > Settings > API
- Copie a "service_role" key (⚠️ nunca exponha no frontend!)

### 3. Fazer Deploy das Functions

```bash
# Instalar CLI (se necessário)
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref wtwxggubulpikvsdiusn

# Deploy
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 4. Configurar Webhook no Stripe

1. Stripe Dashboard > Webhooks > Add endpoint
2. URL: `https://wtwxggubulpikvsdiusn.supabase.co/functions/v1/stripe-webhook`
3. Eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copie o Signing secret e adicione no Supabase:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX
   ```

### 5. Testar! 🎉

1. Acesse `/pricing`
2. Clique em "Escolher Básico" ou "Escolher Premium"
3. Use cartão de teste: `4242 4242 4242 4242`
4. Qualquer data futura e CVC

## ⚠️ Ainda não funciona?

❌ **Sem Price IDs configurados** - Vá em Stripe Dashboard e crie os Prices  
❌ **Sem Secrets no Supabase** - Configure as variáveis de ambiente  
❌ **Functions não deployadas** - Execute o deploy das Edge Functions  
❌ **Webhook não configurado** - Configure o endpoint no Stripe

## 📝 Checklist

- [ ] Price IDs criados no Stripe
- [ ] Secrets configurados no Supabase
- [ ] Edge Functions deployadas
- [ ] Webhook configurado no Stripe
- [ ] Teste realizado com cartão de teste

**Depois disso, o pagamento vai funcionar normalmente!** 🎉
