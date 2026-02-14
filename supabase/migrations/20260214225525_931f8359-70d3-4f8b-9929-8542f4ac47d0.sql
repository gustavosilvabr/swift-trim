
-- Add new columns to barbers
ALTER TABLE public.barbers 
ADD COLUMN IF NOT EXISTS specialty text DEFAULT '',
ADD COLUMN IF NOT EXISTS default_price numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add financial columns to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS service_type text DEFAULT 'corte',
ADD COLUMN IF NOT EXISTS products_sold text DEFAULT '',
ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS observation text DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT '';

-- Site settings table (logo config, store photo, etc.)
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage settings" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  description text DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Gallery images table
CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view gallery" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage gallery" ON public.gallery_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Client messages tracking
CREATE TABLE public.client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_phone text NOT NULL,
  client_name text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT '15dias',
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'sent'
);
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view messages" ON public.client_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage messages" ON public.client_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- WhatsApp automation config
CREATE TABLE public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT false,
  days_threshold integer DEFAULT 15,
  message_template text DEFAULT 'Fala meu parceiro! Já tem mais de {DIAS} dias desde seu último corte 😎 Bora ficar na régua novamente? Clique aqui e agende seu horário!',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view config" ON public.whatsapp_config FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage config" ON public.whatsapp_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_images;

-- Storage buckets for gallery and store photos
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public read site-assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Auth upload site-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');
CREATE POLICY "Auth update site-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-assets');
CREATE POLICY "Auth delete site-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets');

CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Auth upload gallery" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "Auth update gallery" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery');
CREATE POLICY "Auth delete gallery" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery');

-- Insert default whatsapp config
INSERT INTO public.whatsapp_config (enabled, days_threshold) VALUES (false, 15);
