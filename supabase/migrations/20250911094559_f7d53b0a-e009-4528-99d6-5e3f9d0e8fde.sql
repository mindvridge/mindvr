-- Update RLS policy to allow reading admin credentials for login
DROP POLICY IF EXISTS "Block client access to admin credentials" ON admins;

-- Allow public read access to admin credentials for login purposes
CREATE POLICY "Allow public read access to admin credentials" 
ON admins 
FOR SELECT 
USING (true);