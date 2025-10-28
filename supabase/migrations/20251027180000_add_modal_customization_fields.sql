-- Adicionar campos de personalização do modal na tabela salons
ALTER TABLE salons 
ADD COLUMN button_color TEXT DEFAULT '#dc2626',
ADD COLUMN font_family TEXT DEFAULT 'Inter',
ADD COLUMN modal_background_color TEXT DEFAULT '#ffffff',
ADD COLUMN modal_opacity INTEGER DEFAULT 95;

-- Comentários para documentação
COMMENT ON COLUMN salons.button_color IS 'Cor do botão e bordas dos inputs em formato hexadecimal';
COMMENT ON COLUMN salons.font_family IS 'Fonte utilizada no modal de agendamento';
COMMENT ON COLUMN salons.modal_background_color IS 'Cor de fundo do modal de agendamento em formato hexadecimal';
COMMENT ON COLUMN salons.modal_opacity IS 'Opacidade do modal de agendamento (0-100)';
