-- Allow public read access to the profiles table
-- This enables the /api/resume serverless function to read the profile using the anon key
CREATE POLICY "Public can view profiles" ON profiles
    FOR SELECT 
    USING (true);
