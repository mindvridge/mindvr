-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert admin account with username 'admin' and password '151515'
-- The password hash is generated using sha256 of concatenated username + password
INSERT INTO public.admins (username, password_hash) 
VALUES (
  'admin', 
  encode(digest('admin' || '151515', 'sha256'), 'hex')
) 
ON CONFLICT (username) DO UPDATE 
SET password_hash = encode(digest('admin' || '151515', 'sha256'), 'hex');