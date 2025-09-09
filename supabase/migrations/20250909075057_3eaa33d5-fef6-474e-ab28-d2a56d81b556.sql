-- Fix the overly permissive RLS policy on users table
-- Currently "Users can view their own profile" policy uses "true" which allows anyone to see all user data
-- This exposes usernames and password hashes to unauthorized users

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Create a properly restricted policy that only allows users to view their own data
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);