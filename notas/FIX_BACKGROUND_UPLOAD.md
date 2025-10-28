# 🔧 Correção do Erro de Upload de Imagem de Fundo

## ❌ **Problema Identificado:**
- Erro: "new row violates row-level security policy"
- Causa: Políticas de RLS só permitiam upload na pasta `logos`
- Upload de imagens de fundo tentava usar pasta `backgrounds`

## ✅ **Solução Implementada:**

### **Nova Migração Criada:**
- Arquivo: `supabase/migrations/20251027190000_fix_background_upload_policies.sql`
- Atualiza políticas de RLS para incluir pasta `backgrounds`
- Mantém segurança para usuários autenticados

## 🚀 **Como Aplicar a Correção:**

### **1. Execute a Migração no Supabase:**
```sql
-- Corrigir políticas de RLS para permitir upload de imagens de fundo
-- Esta migração atualiza as políticas para incluir a pasta 'backgrounds'

-- Atualizar política de INSERT para incluir pasta backgrounds
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de logos" ON storage.objects;

CREATE POLICY "Usuários autenticados podem fazer upload de assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'salon-assets' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = 'logos' 
    OR (storage.foldername(name))[1] = 'backgrounds'
  )
);

-- Atualizar política de UPDATE para incluir pasta backgrounds
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios logos" ON storage.objects;

CREATE POLICY "Usuários podem atualizar seus próprios assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'salon-assets' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = 'logos' 
    OR (storage.foldername(name))[1] = 'backgrounds'
  )
  AND (storage.filename(name)) LIKE auth.uid()::text || '-%'
);

-- Atualizar política de DELETE para incluir pasta backgrounds
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios logos" ON storage.objects;

CREATE POLICY "Usuários podem deletar seus próprios assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'salon-assets' 
  AND auth.role() = 'authenticated'
  AND (
    (storage.foldername(name))[1] = 'logos' 
    OR (storage.foldername(name))[1] = 'backgrounds'
  )
  AND (storage.filename(name)) LIKE auth.uid()::text || '-%'
);

-- Atualizar política de SELECT para incluir pasta backgrounds
DROP POLICY IF EXISTS "Logos são públicos para leitura" ON storage.objects;

CREATE POLICY "Assets são públicos para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'salon-assets');
```

### **2. Verificar no Supabase Dashboard:**
1. Acesse **Authentication > Policies**
2. Verifique se as políticas foram atualizadas
3. Confirme que `salon-assets` bucket permite ambas as pastas

## 🎯 **O que foi Corrigido:**

### **Políticas Atualizadas:**
- ✅ **INSERT**: Permite upload em `logos` e `backgrounds`
- ✅ **UPDATE**: Permite atualização em ambas as pastas
- ✅ **DELETE**: Permite exclusão em ambas as pastas
- ✅ **SELECT**: Permite leitura pública de ambas as pastas

### **Segurança Mantida:**
- ✅ Apenas usuários autenticados podem fazer upload
- ✅ Usuários só podem modificar seus próprios arquivos
- ✅ Arquivos são públicos para leitura (exibição)

## 🔄 **Após Aplicar a Correção:**

1. **Teste o Upload:**
   - Tente fazer upload de uma imagem de fundo
   - Deve funcionar sem erros

2. **Verifique o Resultado:**
   - Imagem deve aparecer no preview
   - Deve ser aplicada na página de agendamento

---

**✨ Após aplicar esta migração, o upload de imagens de fundo funcionará perfeitamente!**
