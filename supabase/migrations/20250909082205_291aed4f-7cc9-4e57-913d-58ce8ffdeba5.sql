-- CRITICAL SECURITY FIX: Restrict VR usage logs to authenticated users only
-- VR device IDs and usage patterns are sensitive data that should not be public

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Anyone can create VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Anyone can update VR usage logs" ON public.vr_usage_logs;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can view VR usage logs" 
ON public.vr_usage_logs 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create VR usage logs" 
ON public.vr_usage_logs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update VR usage logs" 
ON public.vr_usage_logs 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Add security comments
COMMENT ON POLICY "Authenticated users can view VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Requires authentication to view VR device usage data, preventing anonymous tracking of device patterns.';

COMMENT ON POLICY "Authenticated users can create VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Requires authentication to create VR usage logs, ensuring proper access control.';

COMMENT ON POLICY "Authenticated users can update VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Requires authentication to update VR usage logs, maintaining data integrity.';

-- Keep DELETE blocked as it was before (no policy = no access)