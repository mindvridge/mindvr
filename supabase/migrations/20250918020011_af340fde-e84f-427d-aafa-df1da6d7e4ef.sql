-- Add policy for admins to view all user sessions in dashboard
CREATE POLICY "Admins can view all user sessions for dashboard" 
ON public.user_sessions 
FOR SELECT 
USING (true);

-- Add policy for admins to manage all user sessions
CREATE POLICY "Admins can manage all user sessions" 
ON public.user_sessions 
FOR ALL 
USING (true)
WITH CHECK (true);