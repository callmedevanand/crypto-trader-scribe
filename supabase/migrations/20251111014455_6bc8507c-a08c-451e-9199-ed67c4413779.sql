-- Create storage bucket for trade images
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-images', 'trade-images', true);

-- Create RLS policies for trade images
CREATE POLICY "Users can view own trade images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own trade images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own trade images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own trade images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trade-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add image_url column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS image_url text;