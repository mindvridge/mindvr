-- CRITICAL SECURITY FIX: Add user-specific access controls to VR usage logs
-- Currently any authenticated user can view all VR usage data including device IDs

-- Step 1: Add user_id column to link VR usage logs to specific users
ALTER TABLE public.vr_usage_logs 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Step 2: Set existing records to have a default user_id (you may want to update this based on your data)
-- For now, we'll leave existing records with NULL user_id, but new records must have user_id
-- UPDATE public.vr_usage_logs SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

-- Step 3: Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can create VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can update VR usage logs" ON public.vr_usage_logs;

-- Step 4: Create secure policies that restrict access to user's own VR usage data
CREATE POLICY "Users can view their own VR usage logs" 
ON public.vr_usage_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own VR usage logs" 
ON public.vr_usage_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own VR usage logs" 
ON public.vr_usage_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own VR usage logs" 
ON public.vr_usage_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add security comments
COMMENT ON POLICY "Users can view their own VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Restricts VR usage log visibility to user''s own records, protecting device IDs and usage patterns.';

COMMENT ON POLICY "Users can create their own VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Ensures users can only create VR usage logs for themselves.';

COMMENT ON POLICY "Users can update their own VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Prevents unauthorized modification of other users'' VR usage data.';

COMMENT ON POLICY "Users can delete their own VR usage logs" ON public.vr_usage_logs IS 
'SECURITY: Allows users to delete only their own VR usage records.';

-- Step 5: Add index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_vr_usage_logs_user_id ON public.vr_usage_logs(user_id);

-- Step 6: Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_vr_usage_logs_updated_at
    BEFORE UPDATE ON public.vr_usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();