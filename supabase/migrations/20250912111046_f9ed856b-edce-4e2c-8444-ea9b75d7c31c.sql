-- Remove the dangerous public read policy
DROP POLICY "Allow public read access to admin credentials" ON public.admins;

-- Create a secure authentication function that doesn't expose password hashes
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  input_username text,
  input_password text
)
RETURNS TABLE(
  success boolean,
  admin_data json
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record record;
  input_hash text;
BEGIN
  -- Hash the input password using the same method as registration
  input_hash := encode(digest(input_username || input_password, 'sha256'), 'hex');
  
  -- Try to find admin with matching username and password hash
  SELECT * INTO admin_record 
  FROM public.admins 
  WHERE username = input_username AND password_hash = input_hash;
  
  -- Return result without exposing sensitive data
  IF admin_record.id IS NOT NULL THEN
    RETURN QUERY SELECT 
      true as success,
      json_build_object(
        'id', admin_record.id,
        'username', admin_record.username,
        'created_at', admin_record.created_at,
        'updated_at', admin_record.updated_at
      ) as admin_data;
  ELSE
    RETURN QUERY SELECT false as success, null::json as admin_data;
  END IF;
END;
$$;

-- Grant execute permission to anonymous users for login
GRANT EXECUTE ON FUNCTION public.authenticate_admin(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.authenticate_admin(text, text) TO authenticated;