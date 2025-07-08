
-- Fix RLS policies for assignment file uploads and submissions
-- The assignment-files bucket and submissions table need permissive policies for demo

-- Fix storage policies for assignment-files bucket
DROP POLICY IF EXISTS "Users can upload assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update assignment files" ON storage.objects;

-- Create permissive policies for assignment-files bucket
CREATE POLICY "Anyone can upload assignment files" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'assignment-files');

CREATE POLICY "Anyone can update assignment files" ON storage.objects 
FOR UPDATE USING (bucket_id = 'assignment-files');

CREATE POLICY "Anyone can delete assignment files" ON storage.objects 
FOR DELETE USING (bucket_id = 'assignment-files');

-- Also ensure the assignment-files bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-files', 'assignment-files', true)
ON CONFLICT (id) DO UPDATE SET
  public = true;
