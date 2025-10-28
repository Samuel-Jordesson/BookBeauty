-- Atualizar valores padrão para tema minimalista vermelho e preto
-- Fundo preto
ALTER TABLE salons 
  ALTER COLUMN background_color SET DEFAULT '#000000';

-- Modal com fundo cinza escuro (quase preto)
ALTER TABLE salons 
  ALTER COLUMN modal_background_color SET DEFAULT '#1a1a1a';

-- Cor do botão vermelho (já está correto, mas garantindo)
ALTER TABLE salons 
  ALTER COLUMN button_color SET DEFAULT '#dc2626';

