-- vr_usage_logs 테이블의 user_id foreign key constraint를 제거하고 public.users를 참조하도록 변경
ALTER TABLE public.vr_usage_logs DROP CONSTRAINT IF EXISTS vr_usage_logs_user_id_fkey;

-- public.users 테이블을 참조하는 새로운 foreign key constraint 추가
ALTER TABLE public.vr_usage_logs 
ADD CONSTRAINT vr_usage_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;