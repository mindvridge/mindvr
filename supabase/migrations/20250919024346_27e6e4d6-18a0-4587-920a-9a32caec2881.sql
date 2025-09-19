-- Add policy for dashboard to read user information for sessions display
CREATE POLICY "Allow reading users for dashboard statistics" 
ON public.users 
FOR SELECT 
USING (true);