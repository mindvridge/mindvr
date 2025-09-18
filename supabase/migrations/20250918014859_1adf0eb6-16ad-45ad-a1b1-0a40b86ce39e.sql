-- Fix security issue: Restrict VR usage logs access to only the user's own data
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations for authenticated sessions" ON public.vr_usage_logs;

-- Create secure policies that only allow users to access their own logs
CREATE POLICY "Users can view their own VR usage logs" 
ON public.vr_usage_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own VR usage logs" 
ON public.vr_usage_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own VR usage logs" 
ON public.vr_usage_logs 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own VR usage logs" 
ON public.vr_usage_logs 
FOR DELETE 
USING (auth.uid() = user_id);