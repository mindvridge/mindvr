-- Remove the dangerous public read policy that exposes VR usage logs to anyone
DROP POLICY IF EXISTS "Allow reading vr usage logs for dashboard statistics" ON public.vr_usage_logs;

-- Verify that admin access for dashboard functionality is preserved
-- (The "Authenticated admins can view all vr usage logs for dashboard" policy remains intact)