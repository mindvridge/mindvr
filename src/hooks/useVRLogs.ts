import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VRUsageLog, VRLogFormData, ContentUsageStats, DeviceUsageStats } from '@/types/vr-log';
import { useToast } from '@/hooks/use-toast';

export const useVRLogs = () => {
  const [logs, setLogs] = useState<VRUsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchLogs = async (deviceFilter?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('vr_usage_logs')
        .select('*')
        .order('start_time', { ascending: false });

      if (deviceFilter) {
        query = query.ilike('device_id', `%${deviceFilter}%`);
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

  const addLog = async (logData: VRLogFormData) => {
    try {
      const { error } = await supabase
        .from('vr_usage_logs')
        .insert([logData]);

      if (error) throw error;

      toast({
        title: '성공',
        description: 'VR 사용 로그가 추가되었습니다.',
      });

      fetchLogs(searchQuery);
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

      fetchLogs(searchQuery);
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

  return {
    logs,
    loading,
    searchQuery,
    setSearchQuery,
    fetchLogs,
    addLog,
    updateLogEndTime,
    getContentUsageStats,
    getDeviceUsageStats,
  };
};