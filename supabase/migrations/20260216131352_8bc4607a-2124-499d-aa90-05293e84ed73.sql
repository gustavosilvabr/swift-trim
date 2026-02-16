
-- Services/Products configuration table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'servico',
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage services" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- Seed default services
INSERT INTO public.services (name, category, price, sort_order) VALUES
  ('Corte', 'servico', 35, 1),
  ('Sobrancelha', 'servico', 15, 2),
  ('Corte + Sobrancelha', 'servico', 45, 3);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
