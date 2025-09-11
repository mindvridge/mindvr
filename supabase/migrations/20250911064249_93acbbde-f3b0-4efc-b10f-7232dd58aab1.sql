-- SECURITY FIX: Restrict content usage log creation to authenticated users only
-- Current policy allows anonymous users to create fake usage data

-- Drop the overly permissive INSERT policy that allows anyone to create content logs
DROP POLICY IF EXISTS "Anyone can create content logs" ON public.content_usage_logs;

-- Create secure policy that requires authentication for creating content logs
CREATE POLICY "Authenticated users can create their own content logs" 
ON public.content_usage_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add security comment
COMMENT ON POLICY "Authenticated users can create their own content logs" ON public.content_usage_logs IS 
'SECURITY: Prevents anonymous users from creating fake usage data. Ensures only authenticated users can create logs for themselves.';