-- Remove the dangerous public read policy that exposes password hashes
DROP POLICY "Allow reading users for dashboard statistics" ON public.users;

-- Create secure admin-only policy for dashboard access
CREATE POLICY "Authenticated admins can read users for dashboard" 
ON public.users 
FOR SELECT 
USING (is_admin_user());

-- Create a secure function that returns user data without password hashes for dashboard
CREATE OR REPLACE FUNCTION public.get_user_sessions_with_usernames()
RETURNS TABLE(
  session_id uuid,
  user_id uuid,
  username text,
  login_time timestamp with time zone,
  logout_time timestamp with time zone,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access for authenticated admins
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied. Admin authentication required.';
  END IF;

  RETURN QUERY
  SELECT 
    us.id as session_id,
    us.user_id,
    u.username,
    us.login_time,
    us.logout_time,
    us.created_at
  FROM user_sessions us
  LEFT JOIN users u ON us.user_id = u.id
  ORDER BY us.login_time DESC;
END;
$$;