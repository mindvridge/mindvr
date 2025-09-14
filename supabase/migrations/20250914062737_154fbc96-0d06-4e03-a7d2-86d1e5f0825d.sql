-- Fix admin security issue: Restrict admin table access to prevent credential exposure

-- Drop the overly permissive policy that allows any admin to view all admin credentials
DROP POLICY IF EXISTS "Authenticated admins can view admin profiles" ON public.admins;

-- Create a more secure policy that only allows admins to view their own profile
CREATE POLICY "Admins can only view their own profile" 
ON public.admins 
FOR SELECT 
USING (auth.uid() = id);

-- Also update other policies to be more restrictive
DROP POLICY IF EXISTS "Authenticated admins can create new admins" ON public.admins;
DROP POLICY IF EXISTS "Authenticated admins can update admin profiles" ON public.admins;

-- Only allow admins to update their own profile (not create new ones or update others)
CREATE POLICY "Admins can update their own profile" 
ON public.admins 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Remove INSERT policy entirely to prevent unauthorized admin creation
-- Admin creation should be done through a secure backend process or manual database operation