# 🔄 Migração para Novo Banco Supabase

## ✅ Configuração Atualizada

### 📊 Novo Banco de Dados
- **URL**: `https://wtwxggubulpikvsdiusn.supabase.co`
- **Chave Pública**: Configurada no cliente
- **Chave de Serviço**: Disponível para operações server-side

### 🔧 Arquivos Atualizados
- ✅ `src/integrations/supabase/client.ts` - Cliente atualizado com nova URL e chave

## 🚀 Próximos Passos Necessários

### 1. Executar Migrações no Novo Banco
Execute as migrações no novo banco Supabase:

```sql
-- 1. Migração principal (tabelas e políticas)
-- Execute: supabase/migrations/20251027150515_f0a609f9-99f8-414d-a308-04b18cffdf7f.sql

-- 2. Configuração do Storage
-- Execute: supabase/migrations/20251027160000_setup_storage.sql
```

### 2. Configurar Storage no Dashboard
1. Acesse: https://wtwxggubulpikvsdiusn.supabase.co
2. Vá em **Storage** > **Buckets**
3. Verifique se o bucket `salon-assets` foi criado
4. Configure as políticas se necessário

### 3. Testar Funcionalidades
1. **Autenticação**: Criar conta e fazer login
2. **Salão**: Criar/editar informações do salão
3. **Logo**: Upload de imagem
4. **Agendamentos**: Criar e visualizar agendamentos

## 📋 Checklist de Migração

- [x] Atualizar cliente Supabase
- [ ] Executar migração das tabelas
- [ ] Executar migração do storage
- [ ] Testar autenticação
- [ ] Testar CRUD de salões
- [ ] Testar upload de logo
- [ ] Testar agendamentos
- [ ] Verificar políticas RLS

## 🔍 Verificação de Conexão

Para testar se a conexão está funcionando:

1. Abra o DevTools do navegador (F12)
2. Vá na aba **Console**
3. Execute: `supabase.auth.getSession()`
4. Deve retornar informações da sessão ou null

## ⚠️ Importante

- **Dados**: O novo banco está vazio, será necessário criar novos dados
- **Usuários**: Será necessário criar novas contas
- **Storage**: Configure o bucket antes de testar uploads
- **Políticas**: Verifique se as políticas RLS estão ativas

## 🎯 Funcionalidades Disponíveis

Após a migração completa:
- ✅ Autenticação (login/registro)
- ✅ CRUD de salões
- ✅ Upload de logo
- ✅ Agendamentos
- ✅ Real-time subscriptions
- ✅ Políticas de segurança
