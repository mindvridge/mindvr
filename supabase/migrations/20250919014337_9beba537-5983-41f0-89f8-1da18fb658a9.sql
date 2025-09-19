-- Add policy to allow viewing user sessions for dashboard statistics
-- This allows reading session data for aggregate dashboard views
CREATE POLICY "Allow reading user sessions for dashboard statistics" 
ON user_sessions 
FOR SELECT 
USING (true);