-- CRITICAL SECURITY FIX: Prevent session hijacking and manipulation
-- Restrict all session operations to user's own records only

-- Drop the overly permissive policies that allow anyone to manipulate any user's sessions
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can delete sessions" ON public.user_sessions;

-- Create secure INSERT policy - users can only create sessions for themselves
CREATE POLICY "Users can create their own sessions" 
ON public.user_sessions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create secure UPDATE policy - users can only update their own sessions
CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create secure DELETE policy - users can only delete their own sessions
CREATE POLICY "Users can delete their own sessions" 
ON public.user_sessions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add security comments
COMMENT ON POLICY "Users can create their own sessions" ON public.user_sessions IS 
'SECURITY: Prevents session hijacking by ensuring users can only create sessions for themselves.';

COMMENT ON POLICY "Users can update their own sessions" ON public.user_sessions IS 
'SECURITY: Prevents session manipulation by ensuring users can only update their own session records.';

COMMENT ON POLICY "Users can delete their own sessions" ON public.user_sessions IS 
'SECURITY: Prevents unauthorized session deletion by ensuring users can only delete their own sessions.';