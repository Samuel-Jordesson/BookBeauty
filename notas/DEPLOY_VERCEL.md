# 🚀 Deploy na Vercel - BookBeauty

Guia completo para fazer deploy do BookBeauty na Vercel.

## 📋 Pré-requisitos

1. Conta na Vercel (gratuita): https://vercel.com/signup
2. Repositório no GitHub conectado
3. Variáveis de ambiente configuradas

## 🎯 Passo a Passo

### 1. Acessar a Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Faça login com sua conta GitHub

### 2. Importar Projeto

1. Clique em **"Add New..."** > **"Project"**
2. Conecte seu repositório GitHub (se ainda não estiver conectado)
3. Selecione o repositório: `Samuel-Jordesson/BookBeauty`
4. Clique em **"Import"**

### 3. Configurar o Projeto

A Vercel detecta automaticamente que é um projeto Vite, mas verifique:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `./`

### 4. Configurar Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

```
VITE_SUPABASE_URL=https://wtwxggubulpikvsdiusn.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase_aqui
VITE_STRIPE_PUBLISHABLE_KEY=sua_chave_publica_stripe_aqui
```

⚠️ **Importante**: Substitua os valores pelas suas chaves reais!

**Onde encontrar as chaves:**

- **VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY**: 
  - Acesse: https://supabase.com/dashboard/project/wtwxggubulpikvsdiusn/settings/api
  - Copie a URL do projeto e a chave `anon/public`

- **VITE_STRIPE_PUBLISHABLE_KEY**:
  - Acesse: https://dashboard.stripe.com/test/apikeys
  - Copie a chave que começa com `pk_test_`

### 5. Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (geralmente 1-2 minutos)
3. Após o sucesso, você receberá uma URL: `https://bookbeauty-xxx.vercel.app`

### 6. Configurar Domínio Personalizado (Opcional)

1. Na página do projeto, vá em **"Settings"** > **"Domains"**
2. Adicione seu domínio personalizado
3. Siga as instruções de DNS fornecidas pela Vercel

## 🔄 Deploys Automáticos

A Vercel automaticamente:
- Faz deploy toda vez que você faz `git push` na branch `main`
- Cria previews para Pull Requests
- Rebuilda quando você atualiza variáveis de ambiente

## 🛠️ Troubleshooting

### Build falha

**Erro**: "Module not found" ou "Cannot find module"

**Solução**: 
- Verifique se todas as dependências estão no `package.json`
- Limpe cache e tente novamente: Vercel Dashboard > Settings > Build & Development Settings > Clear Build Cache

### Variáveis de ambiente não funcionam

**Solução**:
- Certifique-se de que todas as variáveis começam com `VITE_`
- Após adicionar variáveis, faça um novo deploy
- Verifique se as variáveis estão configuradas para o ambiente correto (Production, Preview, Development)

### Erro 404 nas rotas

**Solução**:
- O arquivo `vercel.json` já está configurado com rewrites
- Se ainda assim não funcionar, certifique-se de que o `vercel.json` está na raiz do projeto

### Problemas com Supabase CORS

**Solução**:
- Acesse: https://supabase.com/dashboard/project/wtwxggubulpikvsdiusn/settings/api
- Na seção "CORS", adicione sua URL da Vercel: `https://bookbeauty-xxx.vercel.app`

## 📱 URLs do Projeto

Após o deploy, você terá:

- **Production**: `https://bookbeauty-xxx.vercel.app`
- **Preview**: URLs geradas automaticamente para cada PR

## ✅ Checklist Final

- [ ] Projeto importado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy bem-sucedido
- [ ] Site funcionando corretamente
- [ ] CORS configurado no Supabase
- [ ] Domínio personalizado configurado (opcional)

## 🎉 Pronto!

Seu BookBeauty está no ar! Agora é só compartilhar o link com seus clientes! 🚀

