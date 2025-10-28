# 🎨 Personalização de Fundo - Instruções de Migração

## 📋 **O que foi implementado:**

### ✅ **Funcionalidades Adicionadas:**
- **Seletor de tipo de fundo**: Cor sólida ou imagem
- **Seletor de cor**: Color picker com preview
- **Upload de imagem**: Upload de foto de fundo (até 10MB)
- **Preview em tempo real**: Visualização das mudanças
- **Aplicação automática**: Fundo aparece na página de agendamento

### 🔧 **Arquivos Modificados:**
- ✅ `src/components/SalonSettings.tsx` - Interface de personalização
- ✅ `src/pages/Booking.tsx` - Aplicação do fundo personalizado
- ✅ `src/integrations/supabase/types.ts` - Tipos atualizados
- ✅ `supabase/migrations/20251027170000_add_background_fields.sql` - Migração

## 🚀 **Como Aplicar a Migração:**

### **1. Execute a Migração no Supabase:**
```sql
-- Adicionar campos de personalização de fundo na tabela salons
ALTER TABLE salons 
ADD COLUMN background_type TEXT DEFAULT 'color' CHECK (background_type IN ('color', 'image')),
ADD COLUMN background_color TEXT DEFAULT '#1a1a1a',
ADD COLUMN background_image_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN salons.background_type IS 'Tipo de fundo: color ou image';
COMMENT ON COLUMN salons.background_color IS 'Cor de fundo em formato hexadecimal';
COMMENT ON COLUMN salons.background_image_url IS 'URL da imagem de fundo';
```

### **2. Atualize as Políticas de Storage:**
Certifique-se de que o bucket `salon-assets` permite upload de imagens de fundo na pasta `backgrounds/`.

## 🎯 **Como Usar:**

### **1. Acesse o Dashboard:**
- Vá para `http://localhost:8081/dashboard`
- Faça login com sua conta

### **2. Personalize o Fundo:**
- Na seção "Configurações do Salão"
- Encontre a nova seção "Fundo da Página de Agendamento"
- Escolha entre:
  - **Cor Sólida**: Use o color picker
  - **Imagem**: Faça upload de uma foto

### **3. Visualize o Resultado:**
- Acesse seu link de agendamento: `http://localhost:8081/{seu-slug}`
- O fundo personalizado será aplicado automaticamente

## 🎨 **Recursos da Personalização:**

### **Cor Sólida:**
- Color picker visual
- Campo de texto para código hexadecimal
- Preview em tempo real
- Cor padrão: `#1a1a1a` (cinza escuro)

### **Imagem:**
- Upload de PNG, JPG, GIF até 10MB
- Preview da imagem selecionada
- Botão para remover imagem
- Aplicação automática como fundo da página

## 🔄 **Fluxo de Funcionamento:**

1. **Configuração**: Usuário escolhe tipo e configura fundo
2. **Salvamento**: Dados são salvos no banco de dados
3. **Aplicação**: Página de agendamento aplica o fundo automaticamente
4. **Visualização**: Clientes veem o fundo personalizado

## 🎉 **Resultado Final:**

Agora cada salão pode ter sua própria identidade visual única na página de agendamento, criando uma experiência mais personalizada e profissional para os clientes!

---

**✨ A personalização de fundo está pronta para uso!**
