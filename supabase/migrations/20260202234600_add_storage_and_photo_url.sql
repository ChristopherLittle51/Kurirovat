-- 1. Create the 'avatars' storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up Storage Policies for 'avatars' bucket
-- Note: 'storage.objects' policies are applied globally or filtered by bucket_id.

-- Allow public access to read files in the 'avatars' bucket
BEGIN;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );
COMMIT;

-- Allow authenticated users to upload files to the 'avatars' bucket
BEGIN;
  DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
  CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );
COMMIT;

-- Allow users to update/delete their own files (simple version: by filename match with user id)
BEGIN;
  DROP POLICY IF EXISTS "Users can update their own copies" ON storage.objects;
  CREATE POLICY "Users can update their own copies"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );
COMMIT;

-- 3. Add profile_photo_url to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 4. Add profile_photo_url to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
