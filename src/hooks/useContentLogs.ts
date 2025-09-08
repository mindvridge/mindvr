import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContentUsageLog, ContentLogFormData, ContentUsageStats, UserStats } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useContentLogs = () => {
  const [logs, setLogs] = useState<ContentUsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchLogs = async (userFilter?: string, monthFilter?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('content_usage_logs')
        .select(`
          *,
          users!inner(username)
        `)
        .order('start_time', { ascending: false });

      if (userFilter && userFilter.trim() !== '') {
        query = query.ilike('users.username', `%${userFilter}%`);
      }

      if (monthFilter) {
        const year = monthFilter.split('-')[0];
        const month = monthFilter.split('-')[1];
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        
        query = query
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('로그 조회 실패:', error);
      toast({
        title: '오류',
        description: '로그 데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addLog = async (logData: ContentLogFormData) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('content_usage_logs')
        .insert([{
          user_id: user.id,
          ...logData
        }]);

      if (error) throw error;

      toast({
        title: '성공',
        description: '콘텐츠 사용 로그가 추가되었습니다.',
      });

      fetchLogs(searchQuery, selectedMonth);
    } catch (error) {
      console.error('로그 추가 실패:', error);
      toast({
        title: '오류',
        description: '로그 추가에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const updateLogEndTime = async (logId: string, endTime: string) => {
    try {
      const { error } = await supabase
        .from('content_usage_logs')
        .update({ end_time: endTime })
        .eq('id', logId);

      if (error) throw error;

      toast({
        title: '성공',
        description: '세션이 종료되었습니다.',
      });

      fetchLogs(searchQuery, selectedMonth);
    } catch (error) {
      console.error('로그 업데이트 실패:', error);
      toast({
        title: '오류',
        description: '세션 종료에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const deleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('content_usage_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      toast({
        title: '성공',
        description: '로그가 삭제되었습니다.',
      });

      fetchLogs(searchQuery, selectedMonth);
    } catch (error) {
      console.error('로그 삭제 실패:', error);
      toast({
        title: '오류',
        description: '로그 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const deleteAllLogs = async () => {
    try {
      const { error } = await supabase
        .from('content_usage_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast({
        title: '성공',
        description: '모든 로그가 삭제되었습니다.',
      });

      fetchLogs(searchQuery, selectedMonth);
    } catch (error) {
      console.error('전체 로그 삭제 실패:', error);
      toast({
        title: '오류',
        description: '전체 로그 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const getContentUsageStats = async (): Promise<ContentUsageStats[]> => {
    try {
      const { data, error } = await supabase
        .from('content_usage_logs')
        .select('content_name, duration_minutes')
        .not('duration_minutes', 'is', null);

      if (error) throw error;

      const statsMap = new Map<string, ContentUsageStats>();

      data?.forEach((log) => {
        const contentName = log.content_name;
        const duration = log.duration_minutes || 0;

        if (statsMap.has(contentName)) {
          const existing = statsMap.get(contentName)!;
          existing.total_usage_minutes += duration;
          existing.usage_count += 1;
          existing.avg_usage_minutes = existing.total_usage_minutes / existing.usage_count;
        } else {
          statsMap.set(contentName, {
            content_name: contentName,
            total_usage_minutes: duration,
            usage_count: 1,
            avg_usage_minutes: duration,
          });
        }
      });

      return Array.from(statsMap.values())
        .sort((a, b) => b.total_usage_minutes - a.total_usage_minutes);
    } catch (error) {
      console.error('콘텐츠 통계 조회 실패:', error);
      return [];
    }
  };

  const getUserStats = async (): Promise<UserStats[]> => {
    try {
      const { data, error } = await supabase
        .from('content_usage_logs')
        .select(`
          duration_minutes, 
          start_time,
          users!inner(username)
        `)
        .not('duration_minutes', 'is', null);

      if (error) throw error;

      const statsMap = new Map<string, UserStats>();

      data?.forEach((log: any) => {
        const username = log.users.username;
        const duration = log.duration_minutes || 0;
        const startTime = log.start_time;

        if (statsMap.has(username)) {
          const existing = statsMap.get(username)!;
          existing.total_usage_minutes += duration;
          existing.session_count += 1;
          if (new Date(startTime) > new Date(existing.last_used)) {
            existing.last_used = startTime;
          }
        } else {
          statsMap.set(username, {
            username: username,
            total_usage_minutes: duration,
            session_count: 1,
            last_used: startTime,
          });
        }
      });

      return Array.from(statsMap.values())
        .sort((a, b) => b.total_usage_minutes - a.total_usage_minutes);
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      return [];
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const exportData = logs.map(log => ({
        '사용자': (log as any).users?.username || 'Unknown',
        '콘텐츠명': log.content_name,
        '시작시간': new Date(log.start_time).toLocaleString('ko-KR'),
        '종료시간': log.end_time ? new Date(log.end_time).toLocaleString('ko-KR') : '진행중',
        '사용시간(분)': log.duration_minutes || '-',
        '생성일': new Date(log.created_at).toLocaleString('ko-KR'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '콘텐츠사용로그');

      const fileName = `콘텐츠_사용로그_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: '성공',
        description: '엑셀 파일이 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error);
      toast({
        title: '오류',
        description: '엑셀 내보내기에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    fetchLogs,
    addLog,
    updateLogEndTime,
    deleteLog,
    deleteAllLogs,
    exportToExcel,
    getContentUsageStats,
    getUserStats,
  };
};