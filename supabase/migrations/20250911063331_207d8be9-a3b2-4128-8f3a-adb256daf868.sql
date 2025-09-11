-- CRITICAL SECURITY FIX: Restrict content usage logs to user's own data
-- Current policy allows any authenticated user to view ALL users' content logs
-- This violates privacy and enables stalking/competitive intelligence gathering

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all content logs" ON public.content_usage_logs;

-- Create secure policy that restricts access to user's own content logs only
CREATE POLICY "Users can view their own content logs" 
ON public.content_usage_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Add security comment explaining the importance
COMMENT ON POLICY "Users can view their own content logs" ON public.content_usage_logs IS 
'SECURITY: Restricts content usage log visibility to user''s own records, protecting activity patterns and content consumption data from unauthorized access.';

-- Add index for better performance on user_id lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_content_usage_logs_user_id ON public.content_usage_logs(user_id);