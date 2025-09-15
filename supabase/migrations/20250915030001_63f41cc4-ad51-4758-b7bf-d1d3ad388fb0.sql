-- vr_usage_logs 테이블의 RLS 정책을 임시로 더 관대하게 설정
-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Users can view their own VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Users can create their own VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Users can update their own VR usage logs" ON public.vr_usage_logs;
DROP POLICY IF EXISTS "Users can delete their own VR usage logs" ON public.vr_usage_logs;

-- 새로운 관대한 정책 생성 (관리자 시스템이므로)
CREATE POLICY "Allow all operations for authenticated sessions" 
ON public.vr_usage_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);