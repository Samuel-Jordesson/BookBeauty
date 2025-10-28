# 🚀 Deploy das Edge Functions via Dashboard

## Método mais fácil: Copiar e colar no Dashboard

### 1. Function: `create-checkout-session`

1. Acesse: https://supabase.com/dashboard/project/wtwxggubulpikvsdiusn/functions
2. Clique em **"Create a new function"**
3. Preencha:
   - **Function name:** `create-checkout-session`
   - **Region:** (deixe padrão)
4. Cole o código de: `supabase/functions/create-checkout-session/index.ts`
5. Clique em **"Deploy"**

### 2. Function: `stripe-webhook`

1. Na mesma página, clique em **"Create a new function"** novamente
2. Preencha:
   - **Function name:** `stripe-webhook`
   - **Region:** (deixe padrão)
3. Cole o código de: `supabase/functions/stripe-webhook/index.ts`
4. Clique em **"Deploy"**

---

## ✅ Verificar se funcionou:

1. Vá em: https://supabase.com/dashboard/project/wtwxggubulpikvsdiusn/functions
2. Você deve ver as duas functions listadas:
   - ✅ `create-checkout-session`
   - ✅ `stripe-webhook`

---

## 🧪 Testar o checkout:

1. Acesse seu site: `/pricing`
2. Clique em "Escolher Básico" ou "Escolher Premium"
3. Use cartão de teste: `4242 4242 4242 4242`
4. Preencha qualquer data de validade futura e CVC

**Se aparecer o checkout do Stripe, está funcionando!** 🎉

---

## 📝 Próximo passo:

Depois que o checkout funcionar, você precisa configurar o webhook no Stripe (ver `STRIPE_NEXT_STEPS.md`).
