-- CRITICAL SECURITY FIX: Block all client access to admin credentials
-- The custom authentication system cannot properly integrate with Supabase RLS
-- Admin credentials should never be accessible from client-side code

DROP POLICY IF EXISTS "Authenticated users can view admins" ON public.admins;

-- Block all client-side access to admin table
-- Admin operations should only happen through secure server-side Edge Functions
CREATE POLICY "Block client access to admin credentials" 
ON public.admins 
FOR ALL
USING (false)
WITH CHECK (false);

-- Add comprehensive security comment
COMMENT ON POLICY "Block client access to admin credentials" ON public.admins IS 
'SECURITY: All client access blocked. Admin authentication and operations must be handled through Edge Functions with proper server-side validation. This prevents credential theft and ensures admin operations are properly secured.';