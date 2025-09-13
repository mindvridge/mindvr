-- Use a simpler approach with explicit type casting
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
  -- Use explicit text casting for algorithm parameter
  input_hash := encode(digest(convert_to(input_username || input_password, 'UTF8'), 'sha256'::text), 'hex');
  
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

-- Update admin password with explicit text casting
UPDATE public.admins 
SET password_hash = encode(digest(convert_to('admin151515', 'UTF8'), 'sha256'::text), 'hex')
WHERE username = 'admin';