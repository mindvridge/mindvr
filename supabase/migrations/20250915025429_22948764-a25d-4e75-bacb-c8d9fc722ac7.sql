-- content_usage_logs 테이블 삭제하고 vr_usage_logs로 통일
-- duration_minutes는 generated column이므로 데이터 이동 시 제외

-- content_usage_logs 테이블 삭제
DROP TABLE IF EXISTS public.content_usage_logs CASCADE;