-- CRITICAL SECURITY FIX: Add user-specific access controls to VR usage logs
-- The user_id column already exists, just need to update the policies

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can create VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can update VR usage logs" ON public.vr_usage_logs;

-- Create secure policies that restrict access to user's own VR usage data
CREATE POLICY "Users can view their own VR usage logs" 
ON public.vr_usage_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own VR usage logs" 
ON public.vr_usage_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own VR usage logs" 
ON public.vr_usage_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own VR usage logs" 
ON public.vr_usage_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add security comments
COMMENT ON POLICY "Users can view their own VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Restricts VR usage log visibility to user''s own records, protecting device IDs and usage patterns.';

COMMENT ON POLICY "Users can create their own VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Ensures users can only create VR usage logs for themselves.';

COMMENT ON POLICY "Users can update their own VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Prevents unauthorized modification of other users'' VR usage data.';

COMMENT ON POLICY "Users can delete their own VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Allows users to delete only their own VR usage records.';

-- Add index for better performance on user_id lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_vr_usage_logs_user_id ON public.vr_usage_logs(user_id);