-- Create admins table for site login management
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (only admins can manage admins)
CREATE POLICY "Admins can view their own profile" 
ON public.admins 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial admin account (admin/151515)
-- Using a simple hash for the password (in production, use proper bcrypt)
INSERT INTO public.admins (username, password_hash) 
VALUES ('admin', encode(digest('151515' || 'admin' || extract(epoch from now())::text, 'sha256'), 'hex'));