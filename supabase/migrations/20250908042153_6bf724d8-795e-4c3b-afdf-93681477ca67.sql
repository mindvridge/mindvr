-- VR 콘텐츠 사용 로그를 저장할 테이블 생성
CREATE TABLE public.vr_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
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

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_vr_usage_logs_device_id ON public.vr_usage_logs(device_id);
CREATE INDEX idx_vr_usage_logs_content_name ON public.vr_usage_logs(content_name);
CREATE INDEX idx_vr_usage_logs_start_time ON public.vr_usage_logs(start_time);

-- RLS 활성화 (회원가입 없이 모든 사용자가 접근 가능하도록 설정)
ALTER TABLE public.vr_usage_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 데이터를 조회할 수 있도록 정책 생성
CREATE POLICY "Anyone can view VR usage logs" 
ON public.vr_usage_logs 
FOR SELECT 
USING (true);

-- 모든 사용자가 로그를 생성할 수 있도록 정책 생성
CREATE POLICY "Anyone can create VR usage logs" 
ON public.vr_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- 로그 업데이트 정책 (종료시간 업데이트용)
CREATE POLICY "Anyone can update VR usage logs" 
ON public.vr_usage_logs 
FOR UPDATE 
USING (true);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 업데이트 트리거 생성
CREATE TRIGGER update_vr_usage_logs_updated_at
  BEFORE UPDATE ON public.vr_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();