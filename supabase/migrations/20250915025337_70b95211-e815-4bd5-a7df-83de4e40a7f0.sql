-- content_usage_logs와 vr_usage_logs 통합
-- content_usage_logs 테이블 삭제 (vr_usage_logs로 통일)

-- content_usage_logs의 기존 데이터를 vr_usage_logs로 이동 (device_id는 'CONTENT_DEVICE'로 설정)
INSERT INTO public.vr_usage_logs (user_id, device_id, content_name, start_time, end_time, duration_minutes, created_at, updated_at)
SELECT user_id, 'CONTENT_DEVICE' as device_id, content_name, start_time, end_time, duration_minutes, created_at, updated_at
FROM public.content_usage_logs;

-- content_usage_logs 테이블 삭제
DROP TABLE IF EXISTS public.content_usage_logs CASCADE;