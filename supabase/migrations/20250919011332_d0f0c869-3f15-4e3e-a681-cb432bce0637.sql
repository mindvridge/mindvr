-- Remove the overly broad admin policies that make user sessions publicly accessible
DROP POLICY IF EXISTS "Admins can view all user sessions for dashboard" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can manage all user sessions" ON public.user_sessions;

-- Create a security definer function to check if current user is an admin
-- This function will be used in RLS policies to properly identify admin users
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
DECLARE
    current_admin_id uuid;
BEGIN
    -- Get the current admin ID from the session context
    -- This should be set when admin logs in through the application
    current_admin_id := current_setting('app.current_admin_id', true)::uuid;
    
    -- Check if this admin ID exists in the admins table
    IF current_admin_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.admins 
            WHERE id = current_admin_id
        );
    END IF;
    
    RETURN false;
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs (e.g., invalid UUID), return false
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create secure admin policies that actually check for admin status
CREATE POLICY "Authenticated admins can view all user sessions for dashboard" 
ON public.user_sessions 
FOR SELECT 
USING (public.is_admin_user());

CREATE POLICY "Authenticated admins can manage all user sessions" 
ON public.user_sessions 
FOR ALL 
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());