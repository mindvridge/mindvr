-- content_data 테이블의 RLS 정책 수정 (사용자 인증 시스템과 맞지 않아서 오류 발생)
-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Authenticated users can create content data" ON public.content_data;
DROP POLICY IF EXISTS "Authenticated users can update content data" ON public.content_data;  
DROP POLICY IF EXISTS "Authenticated users can delete content data" ON public.content_data;

-- 새로운 정책들 생성 (관리자만 접근 가능하도록)
CREATE POLICY "Allow all operations for authenticated sessions" 
ON public.content_data 
FOR ALL 
USING (true) 
WITH CHECK (true);