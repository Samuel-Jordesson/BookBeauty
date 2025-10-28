# 🔗 Configurar Webhook no Stripe

## Passo 1: Desativar verificação JWT no Supabase
✅ **Já feito** - Você desativou "Verify JWT with legacy secret"

---

## Passo 2: Configurar Webhook no Stripe Dashboard

### 1. Copiar a URL do webhook
No Supabase, copie esta URL:
```
https://wtwxggubulpikvsdiusn.supabase.co/functions/v1/stripe-webhook
```

### 2. Acessar Webhooks no Stripe
1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"** (no topo direito)

### 3. Configurar o Endpoint
1. **Endpoint URL:** Cole a URL que você copiou:
   ```
   https://wtwxggubulpikvsdiusn.supabase.co/functions/v1/stripe-webhook
   ```

2. **Events to send:** Clique em "Select events" e marque:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

3. Clique em **"Add endpoint"**

### 4. Copiar o Signing Secret
1. Na página do webhook recém-criado, copie o **"Signing secret"**
   - Começa com `whsec_`
   - Exemplo: `whsec_1234567890abcdef...`

---

## Passo 3: Adicionar Secret no Supabase

1. Volte para: https://supabase.com/dashboard/project/wtwxggubulpikvsdiusn/functions/secrets
2. Clique em **"Add another"**
3. Preencha:
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** Cole o signing secret que você copiou do Stripe
4. Clique em **"Save"**

---

## ✅ Pronto!

Agora você pode testar o checkout:
1. Acesse seu site: `/pricing`
2. Clique em "Escolher Básico" ou "Escolher Premium"
3. Use cartão de teste: `4242 4242 4242 4242`
4. Preencha qualquer data futura e CVC

**O webhook irá atualizar automaticamente o banco de dados quando o pagamento for concluído! 🎉**
