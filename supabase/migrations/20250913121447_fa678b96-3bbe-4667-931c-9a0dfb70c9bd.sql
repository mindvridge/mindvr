-- Use PostgreSQL built-in md5 function instead of pgcrypto digest
DROP FUNCTION IF EXISTS public.authenticate_admin(text, text);

CREATE OR REPLACE FUNCTION public.authenticate_admin(input_username text, input_password text)
 RETURNS TABLE(success boolean, admin_data json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  admin_record record;
  input_hash text;
BEGIN
  -- Use built-in md5 function which is always available
  input_hash := md5(input_username || input_password);
  
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

-- Update admin password to use md5 hash
UPDATE public.admins 
SET password_hash = md5('admin151515')
WHERE username = 'admin';