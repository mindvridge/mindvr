-- Add RLS policy for admins to view all VR usage logs for dashboard
CREATE POLICY "Authenticated admins can view all vr usage logs for dashboard" 
ON public.vr_usage_logs 
FOR SELECT 
USING (is_admin_user());

-- Add RLS policy for admins to manage all VR usage logs
CREATE POLICY "Authenticated admins can manage all vr usage logs" 
ON public.vr_usage_logs 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Also add a general read policy for dashboard statistics (similar to user_sessions)
CREATE POLICY "Allow reading vr usage logs for dashboard statistics" 
ON public.vr_usage_logs 
FOR SELECT 
USING (true);