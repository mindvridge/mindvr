import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VRUsageLog, VRLogFormData, ContentUsageStats, DeviceUsageStats } from '@/types/vr-log';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fromZonedTime, KOREA_TIMEZONE } from '@/lib/dateUtils';

export const useVRLogs = () => {
  const [logs, setLogs] = useState<VRUsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchLogs = async (deviceFilter?: string, monthFilter?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('vr_usage_logs')
        .select('*')
        .order('start_time', { ascending: false });

      if (deviceFilter && deviceFilter.trim() !== '') {
        query = query.ilike('device_id', `%${deviceFilter}%`);
      }

      if (monthFilter) {
        const year = monthFilter.split('-')[0];
        const month = monthFilter.split('-')[1];
        
        // 한국 시간대 기준으로 월의 시작과 끝 날짜 생성
        const koreanStartDate = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0);
        const koreanEndDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
        
        // 한국 시간을 UTC로 변환하여 DB 쿼리에 사용
        const startDateUTC = fromZonedTime(koreanStartDate, KOREA_TIMEZONE);
        const endDateUTC = fromZonedTime(koreanEndDate, KOREA_TIMEZONE);
        
        query = query
          .gte('start_time', startDateUTC.toISOString())
          .lte('start_time', endDateUTC.toISOString());
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

  const addLog = async (logData: Omit<VRLogFormData, 'user_id'>) => {
    if (!user) {
      toast({
        title: '오류',
        description: '로그인이 필요합니다.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vr_usage_logs')
        .insert([{ ...logData, user_id: user.id }]);

      if (error) throw error;

      toast({
        title: '성공',
        description: 'VR 사용 로그가 추가되었습니다.',
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
        .from('vr_usage_logs')
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

  const getContentUsageStats = async (): Promise<ContentUsageStats[]> => {
    try {
      const { data, error } = await supabase
        .from('vr_usage_logs')
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

  const getDeviceUsageStats = async (): Promise<DeviceUsageStats[]> => {
    try {
      const { data, error } = await supabase
        .from('vr_usage_logs')
        .select('device_id, duration_minutes, start_time')
        .not('duration_minutes', 'is', null);

      if (error) throw error;

      const statsMap = new Map<string, DeviceUsageStats>();

      data?.forEach((log) => {
        const deviceId = log.device_id;
        const duration = log.duration_minutes || 0;
        const startTime = log.start_time;

        if (statsMap.has(deviceId)) {
          const existing = statsMap.get(deviceId)!;
          existing.total_usage_minutes += duration;
          existing.session_count += 1;
          if (new Date(startTime) > new Date(existing.last_used)) {
            existing.last_used = startTime;
          }
        } else {
          statsMap.set(deviceId, {
            device_id: deviceId,
            total_usage_minutes: duration,
            session_count: 1,
            last_used: startTime,
          });
        }
      });

      return Array.from(statsMap.values())
        .sort((a, b) => b.total_usage_minutes - a.total_usage_minutes);
    } catch (error) {
      console.error('기기 통계 조회 실패:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const deleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('vr_usage_logs')
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

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      const exportData = logs.map(log => ({
        '기기 ID': log.device_id,
        '콘텐츠명': log.content_name,
        '시작시간': new Date(log.start_time).toLocaleString('ko-KR'),
        '종료시간': log.end_time ? new Date(log.end_time).toLocaleString('ko-KR') : '진행중',
        '사용시간(분)': log.duration_minutes || '-',
        '생성일': new Date(log.created_at).toLocaleString('ko-KR'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'VR사용로그');

      const fileName = `VR_사용로그_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    exportToExcel,
    getContentUsageStats,
    getDeviceUsageStats,
  };
};