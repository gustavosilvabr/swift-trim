
-- Create subscriptions table for unlimited cut plans
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'Corte Ilimitado',
  plan_price NUMERIC NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Public can create subscriptions (sign up)
CREATE POLICY "Anyone can create subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (true);

-- Anyone can view subscriptions (for the site to check)
CREATE POLICY "Anyone can view subscriptions" ON public.subscriptions
  FOR SELECT USING (true);

-- Owner full access
CREATE POLICY "Owner full access subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'owner')
  );

-- Authenticated can manage subscriptions
CREATE POLICY "Authenticated can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
