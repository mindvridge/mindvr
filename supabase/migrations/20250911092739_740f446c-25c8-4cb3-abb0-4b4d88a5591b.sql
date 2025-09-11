-- Update admin password hash to match simplified hashing (SHA-256 of "151515")
UPDATE admins 
SET password_hash = '3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1'
WHERE username = 'admin';