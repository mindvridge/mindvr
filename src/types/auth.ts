export interface User {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  login_time: string;
  logout_time: string | null;
  created_at: string;
}

export interface ContentUsageLog {
  id: string;
  user_id: string;
  content_name: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface LoginFormData {
  username: string;
}

export interface RegisterFormData {
  username: string;
}

export interface ContentLogFormData {
  user_id: string;
  content_name: string;
  start_time: string;
  end_time?: string;
}

export interface ContentUsageStats {
  content_name: string;
  total_usage_minutes: number;
  usage_count: number;
  avg_usage_minutes: number;
}

export interface UserStats {
  username: string;
  total_usage_minutes: number;
  session_count: number;
  last_used: string;
}