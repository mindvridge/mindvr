-- 콘텐츠 데이터 테이블 생성
CREATE TABLE public.content_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_name TEXT NOT NULL,
  content_filename TEXT,
  description TEXT,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.content_data ENABLE ROW LEVEL SECURITY;

-- 관리자만 읽기 가능
CREATE POLICY "Anyone can view content data" 
ON public.content_data 
FOR SELECT 
USING (true);

-- 인증된 사용자만 콘텐츠 데이터 생성 가능
CREATE POLICY "Authenticated users can create content data" 
ON public.content_data 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 인증된 사용자만 콘텐츠 데이터 업데이트 가능
CREATE POLICY "Authenticated users can update content data" 
ON public.content_data 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- 인증된 사용자만 콘텐츠 데이터 삭제 가능
CREATE POLICY "Authenticated users can delete content data" 
ON public.content_data 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 업데이트 시간 자동 갱신을 위한 트리거
CREATE TRIGGER update_content_data_updated_at
BEFORE UPDATE ON public.content_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();