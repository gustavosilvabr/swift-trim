
-- Barbers table
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view barbers" ON public.barbers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update barbers" ON public.barbers FOR UPDATE TO authenticated USING (true);

-- Blocked dates/times
CREATE TABLE public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  blocked_date DATE NOT NULL,
  blocked_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage blocked slots" ON public.blocked_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Available time slots
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  slot_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view time slots" ON public.time_slots FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage time slots" ON public.time_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Appointments
CREATE TYPE public.appointment_status AS ENUM ('pendente', 'confirmado', 'concluido', 'cancelado');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.barbers;

-- Insert 2 barbers
INSERT INTO public.barbers (name, phone, photo_url) VALUES
  ('Barbeiro 1', '5561992140623', null),
  ('Barbeiro 2', '5561992140623', null);

-- Insert default time slots for both barbers (Mon-Sat, 8:00-18:00)
DO $$
DECLARE
  b RECORD;
  d INT;
  h INT;
BEGIN
  FOR b IN SELECT id FROM public.barbers LOOP
    FOR d IN 1..6 LOOP -- Mon to Sat
      FOR h IN 8..18 LOOP
        INSERT INTO public.time_slots (barber_id, day_of_week, slot_time)
        VALUES (b.id, d, make_time(h, 0, 0));
        IF h < 18 THEN
          INSERT INTO public.time_slots (barber_id, day_of_week, slot_time)
          VALUES (b.id, d, make_time(h, 30, 0));
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
