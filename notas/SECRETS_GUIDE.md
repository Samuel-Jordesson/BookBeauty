# 🔐 Guia de Secrets para Edge Functions

## ✅ Secrets que você JÁ configurou:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_BASIC`
- `STRIPE_PRICE_PREMIUM`
- `SITE_URL`

## ⚠️ IMPORTANTE sobre SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY

O Supabase **BLOQUEIA** secrets que começam com `SUPABASE_`** por segurança.

**SOLUÇÃO:** Essas variáveis já estão disponíveis automaticamente nas Edge Functions! 

### O que você precisa fazer:

**Para o webhook funcionar, você precisa adicionar APENAS:**

#### `SERVICE_ROLE_KEY`
- Key: `SERVICE_ROLE_KEY` (sem o prefixo SUPABASE_)
- Value: Sua service_role key (encontre em Settings > API no Supabase)

#### `STRIPE_WEBHOOK_SECRET` 
- Key: `STRIPE_WEBHOOK_SECRET`
- Value: Será gerado após configurar o webhook no Stripe (começa com `whsec_`)

---

## 📝 Passo a passo:

### 1. Adicionar SERVICE_ROLE_KEY:
1. No Supabase Dashboard: **Settings > API**
2. Copie a **service_role key** (não a anon key!)
3. Vá em **Edge Functions > Secrets**
4. Clique em **"Add another"**
5. Key: `SERVICE_ROLE_KEY`
6. Value: cole a service_role key
7. Clique em **"Save"**

### 2. Atualizar o código do webhook:

Vou atualizar o código para usar `SERVICE_ROLE_KEY` em vez de `SUPABASE_SERVICE_ROLE_KEY`.

### 3. Depois, configurar o webhook no Stripe (ver STRIPE_NEXT_STEPS.md)

---

## ✅ Resumo das secrets necessárias:

| Key | Onde encontrar | Status |
|-----|----------------|--------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API keys | ✅ Configurado |
| `STRIPE_PRICE_BASIC` | Stripe Dashboard > Products > Basic > Price ID | ✅ Configurado |
| `STRIPE_PRICE_PREMIUM` | Stripe Dashboard > Products > Premium > Price ID | ✅ Configurado |
| `SITE_URL` | URL do seu site (ex: http://localhost:8080) | ✅ Configurado |
| `SERVICE_ROLE_KEY` | Supabase > Settings > API > service_role key | ⚠️ Adicionar agora |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks > Signing secret | ⚠️ Adicionar depois |

**Observação:** 
- `SUPABASE_URL` está disponível automaticamente nas Edge Functions
- NUNCA use `SUPABASE_` como prefixo nas secrets - o Supabase bloqueia isso por segurança!
