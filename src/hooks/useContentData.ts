import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentData, ContentDataFormData } from '@/types/content-data';
import { useToast } from '@/hooks/use-toast';

export const useContentData = () => {
  const [contentData, setContentData] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchContentData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContentData(data || []);
    } catch (error) {
      console.error('콘텐츠 데이터 조회 실패:', error);
      toast({
        title: '오류',
        description: '콘텐츠 데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addContentData = async (formData: ContentDataFormData) => {
    try {
      const { error } = await supabase
        .from('content_data')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: '성공',
        description: '콘텐츠 데이터가 추가되었습니다.',
      });

      fetchContentData();
    } catch (error) {
      console.error('콘텐츠 데이터 추가 실패:', error);
      toast({
        title: '오류',
        description: '콘텐츠 데이터 추가에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const updateContentData = async (id: string, formData: Partial<ContentDataFormData>) => {
    try {
      const { error } = await supabase
        .from('content_data')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '성공',
        description: '콘텐츠 데이터가 수정되었습니다.',
      });

      fetchContentData();
    } catch (error) {
      console.error('콘텐츠 데이터 수정 실패:', error);
      toast({
        title: '오류',
        description: '콘텐츠 데이터 수정에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const deleteContentData = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_data')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '성공',
        description: '콘텐츠 데이터가 삭제되었습니다.',
      });

      fetchContentData();
    } catch (error) {
      console.error('콘텐츠 데이터 삭제 실패:', error);
      toast({
        title: '오류',
        description: '콘텐츠 데이터 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchContentData();
  }, []);

  return {
    contentData,
    loading,
    fetchContentData,
    addContentData,
    updateContentData,
    deleteContentData,
  };
};