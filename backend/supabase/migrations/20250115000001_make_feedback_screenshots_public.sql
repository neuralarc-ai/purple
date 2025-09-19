BEGIN;

-- Update feedback-screenshots bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'feedback-screenshots';

-- Update storage policies to allow public access to feedback screenshots
DROP POLICY IF EXISTS "Users can view feedback screenshots" ON storage.objects;

CREATE POLICY "Public can view feedback screenshots" ON storage.objects
FOR SELECT USING (
    bucket_id = 'feedback-screenshots'
);

COMMIT;
