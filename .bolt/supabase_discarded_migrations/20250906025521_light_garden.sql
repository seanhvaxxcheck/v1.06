-- Create storage bucket for item photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own item photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy to allow authenticated users to view their own photos
CREATE POLICY "Users can view their own item photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy to allow authenticated users to update their own photos
CREATE POLICY "Users can update their own item photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy to allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own item photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'item-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to view photos (since bucket is public)
CREATE POLICY "Public can view item photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'item-photos');</parameter>