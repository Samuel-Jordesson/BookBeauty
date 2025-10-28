🔍 Checklist de Verificação - Sistema Completo

## ✅ O que você já fez:
- [x] Criou as tabelas no banco
- [x] Configurou as variáveis de ambiente

## ⏳ O que ainda pode estar faltando:

### 1. 🗄️ Storage (Upload de Logo)
**Status**: ⚠️ CRÍTICO para upload de logo

**Verificar no Supabase Dashboard:**
1. Vá em **Storage** > **Buckets**
2. Deve existir o bucket `salon-assets`
3. Se não existir, execute:

```sql
-- Execute no SQL Editor do Supabase:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-assets',
  'salon-assets', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);
```

### 2. 🔐 Políticas RLS (Row Level Security)
**Status**: ⚠️ CRÍTICO para segurança

**Verificar se as políticas estão ativas:**
```sql
-- Execute no SQL Editor para verificar:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Se não existirem, execute:**
```sql
-- Habilitar RLS
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Políticas para Salons
CREATE POLICY "Usuários podem ver seus próprios salões"
  ON public.salons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios salões"
  ON public.salons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios salões"
  ON public.salons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios salões"
  ON public.salons FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Salões são visíveis publicamente pelo slug"
  ON public.salons FOR SELECT
  USING (true);

-- Políticas para Bookings
CREATE POLICY "Donos de salão podem ver seus agendamentos"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE salons.id = bookings.salon_id
      AND salons.user_id = auth.uid()
    )
  );

CREATE POLICY "Qualquer pessoa pode criar agendamentos"
  ON public.bookings FOR INSERT
  WITH CHECK (true);
```

### 3. 🔑 Configuração de Autenticação
**Status**: ⚠️ IMPORTANTE

**Verificar no Supabase Dashboard:**
1. Vá em **Authentication** > **Settings**
2. Verifique se **Enable email confirmations** está configurado
3. Configure **Site URL**: `http://localhost:8081`
4. Configure **Redirect URLs**: `http://localhost:8081/dashboard`

### 4. 📊 Índices para Performance
**Status**: ℹ️ OPCIONAL mas recomendado

```sql
-- Execute no SQL Editor:
CREATE INDEX IF NOT EXISTS idx_salons_slug ON public.salons(slug);
CREATE INDEX IF NOT EXISTS idx_salons_user_id ON public.salons(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_id ON public.bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
```

### 5. 🔄 Trigger para updated_at
**Status**: ℹ️ OPCIONAL

```sql
-- Execute no SQL Editor:
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_salons_updated_at
  BEFORE UPDATE ON public.salons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

## 🧪 Como Testar:

### Teste 1: Conexão Básica
1. Abra `http://localhost:8081/`
2. Tente criar uma conta
3. Se funcionar, conexão OK ✅

### Teste 2: CRUD de Salão
1. Faça login
2. Vá em "Configurações do Salão"
3. Preencha os dados e salve
4. Se funcionar, CRUD OK ✅

### Teste 3: Upload de Logo
1. Na configuração do salão
2. Clique em "Adicionar Logo"
3. Selecione uma imagem
4. Se funcionar, Storage OK ✅

### Teste 4: Agendamento
1. Copie o link do salão
2. Abra em nova aba
3. Tente fazer um agendamento
4. Se funcionar, sistema completo ✅

## 🚨 Problemas Comuns:

**Erro 401/403**: Políticas RLS não configuradas
**Erro 500**: Storage não configurado
**Erro de conexão**: URL/chave incorretas
**Upload falha**: Bucket não existe

## 📞 Próximos Passos:

1. Execute o script `test-supabase.js` no console
2. Verifique os resultados
3. Configure o que estiver faltando
4. Teste todas as funcionalidades
