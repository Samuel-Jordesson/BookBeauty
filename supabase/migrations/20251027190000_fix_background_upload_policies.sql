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
