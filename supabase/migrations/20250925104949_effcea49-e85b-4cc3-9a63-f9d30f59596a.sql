-- Add current user to admins table for dashboard access
INSERT INTO public.admins (id, username, password_hash, created_at, updated_at)
VALUES (
  '21440c7a-4c96-4f8d-8109-47c9794b8fb6'::uuid,
  'dashboard_admin', 
  md5('dashboard_admin' || 'password'),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;