-- Fix admin account with correct password hash
-- First, delete existing admin if exists
DELETE FROM public.admins WHERE username = 'admin';

-- Insert admin account with a specific created_at timestamp for consistent hashing
INSERT INTO public.admins (username, password_hash, created_at, updated_at) 
VALUES (
  'admin', 
  '', -- We'll update this in the next step
  '2024-01-01 00:00:00+00'::timestamp with time zone,
  '2024-01-01 00:00:00+00'::timestamp with time zone
);

-- Update with the correct password hash using the known created_at timestamp
-- Hash = SHA256('151515' + 'admin' + '1704067200') where 1704067200 is the Unix timestamp for 2024-01-01 00:00:00 UTC
UPDATE public.admins 
SET password_hash = encode(digest('151515admin1704067200', 'sha256'), 'hex')
WHERE username = 'admin';