export interface VRUsageLog {
  id: string;
  device_id: string;
  content_name: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface VRLogFormData {
  device_id: string;
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

export interface DeviceUsageStats {
  device_id: string;
  total_usage_minutes: number;
  session_count: number;
  last_used: string;
}