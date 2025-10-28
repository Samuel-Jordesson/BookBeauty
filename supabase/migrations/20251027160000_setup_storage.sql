  -- Configuração do Storage para logos de salões
  -- Este arquivo configura o bucket 'salon-assets' para armazenar logos e outros assets

  -- Criar bucket para assets dos salões
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'salon-assets',
    'salon-assets',
    true,
    5242880, -- 5MB em bytes
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  );

  -- Política para permitir upload de logos apenas para usuários autenticados
  CREATE POLICY "Usuários autenticados podem fazer upload de logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'salon-assets' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
  );

  -- Política para permitir leitura pública dos logos
  CREATE POLICY "Logos são públicos para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'salon-assets');

  -- Política para permitir atualização de logos apenas pelo dono
  CREATE POLICY "Usuários podem atualizar seus próprios logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'salon-assets' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
    AND (storage.filename(name)) LIKE auth.uid()::text || '-%'
  );

  -- Política para permitir exclusão de logos apenas pelo dono
  CREATE POLICY "Usuários podem deletar seus próprios logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'salon-assets' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
    AND (storage.filename(name)) LIKE auth.uid()::text || '-%'
  );
