-- Create users table for username-based authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user sessions table to track login/logout times
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  logout_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content usage logs table
CREATE TABLE public.content_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
      ELSE NULL 
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create users" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Create policies for user_sessions table
CREATE POLICY "Users can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete sessions" 
ON public.user_sessions 
FOR DELETE 
USING (true);

-- Create policies for content_usage_logs table
CREATE POLICY "Users can view all content logs" 
ON public.content_usage_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create content logs" 
ON public.content_usage_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update content logs" 
ON public.content_usage_logs 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete content logs" 
ON public.content_usage_logs 
FOR DELETE 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_usage_logs_updated_at
BEFORE UPDATE ON public.content_usage_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_login_time ON public.user_sessions(login_time);
CREATE INDEX idx_content_usage_logs_user_id ON public.content_usage_logs(user_id);
CREATE INDEX idx_content_usage_logs_start_time ON public.content_usage_logs(start_time);