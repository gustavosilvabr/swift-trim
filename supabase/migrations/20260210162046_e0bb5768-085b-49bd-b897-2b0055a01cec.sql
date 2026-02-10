
-- Create storage bucket for barber photos
INSERT INTO storage.buckets (id, name, public) VALUES ('barber-photos', 'barber-photos', true);

-- Allow public read
CREATE POLICY "Public read barber photos" ON storage.objects FOR SELECT USING (bucket_id = 'barber-photos');

-- Allow authenticated users to upload/update
CREATE POLICY "Authenticated upload barber photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'barber-photos');
CREATE POLICY "Authenticated update barber photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'barber-photos');
CREATE POLICY "Authenticated delete barber photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'barber-photos');
