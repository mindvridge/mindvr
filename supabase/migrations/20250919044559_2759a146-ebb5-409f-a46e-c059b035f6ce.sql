-- Remove the dangerous public read policy that exposes user login/logout activity
DROP POLICY "Allow reading user sessions for dashboard statistics" ON public.user_sessions;