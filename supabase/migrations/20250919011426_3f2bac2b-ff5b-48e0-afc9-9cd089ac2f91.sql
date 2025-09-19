-- Create a function to set the admin session context
CREATE OR REPLACE FUNCTION public.set_admin_session(admin_id_value uuid)
RETURNS void AS $$
BEGIN
    -- Set the admin ID in the session context
    PERFORM set_config('app.current_admin_id', admin_id_value::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;