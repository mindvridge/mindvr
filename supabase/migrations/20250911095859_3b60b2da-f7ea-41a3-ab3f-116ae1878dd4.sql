-- Update admin password hash for "151515"
-- Calculate SHA-256 hash of "151515": a8698d96861f332be3627b5461c3d4ac120295ae33c8e26b9c0db82afa657084
UPDATE admins 
SET password_hash = 'a8698d96861f332be3627b5461c3d4ac120295ae33c8e26b9c0db82afa657084', 
    updated_at = now() 
WHERE username = 'admin';