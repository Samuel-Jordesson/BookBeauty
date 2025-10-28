-- Adicionar campos de personalização de fundo na tabela salons
ALTER TABLE salons 
ADD COLUMN background_type TEXT DEFAULT 'color' CHECK (background_type IN ('color', 'image')),
ADD COLUMN background_color TEXT DEFAULT '#1a1a1a',
ADD COLUMN background_image_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN salons.background_type IS 'Tipo de fundo: color ou image';
COMMENT ON COLUMN salons.background_color IS 'Cor de fundo em formato hexadecimal';
COMMENT ON COLUMN salons.background_image_url IS 'URL da imagem de fundo';
