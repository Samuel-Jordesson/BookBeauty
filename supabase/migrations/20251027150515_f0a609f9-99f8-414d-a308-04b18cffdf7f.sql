-- Tabela de Salões/Barbearias
CREATE TABLE public.salons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Agendamentos
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

-- Permitir leitura pública de salões pelo slug (para página de agendamento)
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

-- Trigger para atualizar updated_at
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

-- Índices para melhor performance
CREATE INDEX idx_salons_slug ON public.salons(slug);
CREATE INDEX idx_salons_user_id ON public.salons(user_id);
CREATE INDEX idx_bookings_salon_id ON public.bookings(salon_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);