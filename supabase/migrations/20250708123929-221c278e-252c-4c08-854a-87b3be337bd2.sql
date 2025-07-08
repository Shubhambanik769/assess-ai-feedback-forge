-- Fix storage policies for signatures bucket to be more permissive for demo
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their signature" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their signature" ON storage.objects;

-- Create permissive policies for demo
CREATE POLICY "Anyone can upload signatures" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Anyone can update signatures" ON storage.objects 
FOR UPDATE USING (bucket_id = 'signatures');

CREATE POLICY "Anyone can delete signatures" ON storage.objects 
FOR DELETE USING (bucket_id = 'signatures');