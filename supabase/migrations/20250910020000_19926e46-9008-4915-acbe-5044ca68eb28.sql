-- CRITICAL SECURITY FIX: Restrict user sessions visibility to own records only
-- Users should only be able to view their own login/logout sessions, not all users' sessions

-- Drop the overly permissive policy that exposes all user sessions
DROP POLICY IF EXISTS "Users can view all sessions" ON public.user_sessions;

-- Create secure policy that restricts session visibility to user's own records
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Add security comment
COMMENT ON POLICY "Users can view their own sessions" ON public.user_sessions IS 
'SECURITY: Users can only view their own login/logout sessions, protecting privacy and behavioral data of other users.';

-- Note: This assumes proper Supabase authentication is in place
-- If using custom auth, additional application-level security measures may be needed