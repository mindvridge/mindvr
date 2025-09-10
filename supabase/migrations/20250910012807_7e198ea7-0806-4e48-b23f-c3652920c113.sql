-- CRITICAL SECURITY FIX: Restrict content usage logs modifications to own records only
-- Users should only be able to modify/delete their own usage logs, not all logs

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can update content logs" ON public.content_usage_logs;
DROP POLICY IF EXISTS "Anyone can delete content logs" ON public.content_usage_logs;

-- Create secure policies that restrict operations to user's own records
CREATE POLICY "Users can update their own content logs" 
ON public.content_usage_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content logs" 
ON public.content_usage_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add security comments
COMMENT ON POLICY "Users can update their own content logs" ON public.content_usage_logs IS 
'SECURITY: Users can only update their own content usage logs, preventing tampering with other users audit trails.';

COMMENT ON POLICY "Users can delete their own content logs" ON public.content_usage_logs IS 
'SECURITY: Users can only delete their own content usage logs, protecting audit trail integrity.';

-- Note: SELECT policy remains as "Users can view all content logs" for dashboard functionality
-- Note: INSERT policy remains as "Anyone can create content logs" for logging functionality