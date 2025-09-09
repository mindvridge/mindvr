-- Fix the overly permissive RLS policy on admins table
-- Currently allows anyone to read admin usernames and password hashes
-- This is a critical security vulnerability

DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admins;

-- Create a more restrictive policy
-- Since this uses custom auth, we'll make it require authentication at minimum
-- and restrict to only authenticated users (though ideally this should be integrated with proper Supabase Auth)
CREATE POLICY "Authenticated users can view admins" 
ON public.admins 
FOR SELECT 
TO authenticated
USING (true);

-- Add a comment explaining this needs further security improvements
COMMENT ON POLICY "Authenticated users can view admins" ON public.admins IS 
'SECURITY NOTE: This policy still allows any authenticated user to view admin data. Consider integrating with Supabase Auth and implementing proper admin role-based access control.';