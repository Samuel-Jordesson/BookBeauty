-- Adicionar campos de assinatura na tabela salons
ALTER TABLE salons 
ADD COLUMN subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
ADD COLUMN subscription_current_period_end TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN salons.subscription_plan IS 'Plano de assinatura: free, basic ou premium';
COMMENT ON COLUMN salons.stripe_customer_id IS 'ID do cliente no Stripe';
COMMENT ON COLUMN salons.stripe_subscription_id IS 'ID da assinatura no Stripe';
COMMENT ON COLUMN salons.subscription_status IS 'Status da assinatura no Stripe';
COMMENT ON COLUMN salons.subscription_current_period_end IS 'Data de término do período atual da assinatura';

-- Índice para buscar por subscription_status
CREATE INDEX idx_salons_subscription_status ON salons(subscription_status);
CREATE INDEX idx_salons_stripe_customer_id ON salons(stripe_customer_id);
