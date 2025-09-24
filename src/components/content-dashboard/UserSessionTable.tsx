import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserSession } from '@/types/auth';
import { formatToKoreanTime, calculateDuration } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw } from 'lucide-react';

export const UserSessionTable = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Set admin session first and wait for it to complete
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.isAdmin || userData.id) {
          console.log('Setting admin session for user sessions:', userData.id);
          try {
            await supabase.rpc('set_admin_session', {
              admin_id_value: userData.id
            });
            console.log('Admin session set successfully for user sessions');
            // Wait a moment to ensure session is properly set
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error('Failed to set admin session:', error);
            throw error;
          }
        }
      }

      const { data, error } = await supabase
        .rpc('get_user_sessions_with_usernames');

      if (error) {
        console.error('RPC 호출 에러:', error);
        throw error;
      }

      // Transform data to match expected format
      const transformedData = data?.map((session: any) => ({
        id: session.session_id,
        user_id: session.user_id,
        login_time: session.login_time,
        logout_time: session.logout_time,
        created_at: session.created_at,
        users: { username: session.username }
      })) || [];

      console.log('User sessions loaded:', transformedData.length, 'sessions');
      setSessions(transformedData);
      
      toast({
        title: '성공',
        description: `${transformedData.length}개의 세션을 불러왔습니다.`,
      });
    } catch (error) {
      console.error('세션 조회 실패:', error);
      toast({
        title: '오류',
        description: '세션 데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchSessions();
  };

  const formatDateTime = (dateString: string) => {
    return formatToKoreanTime(dateString, 'yyyy-MM-dd HH:mm:ss');
  };

  const formatDuration = (loginTime: string, logoutTime: string | null) => {
    if (!logoutTime) return '진행중';
    
    const durationMinutes = calculateDuration(loginTime, logoutTime);
    if (durationMinutes === null) return '진행중';
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const seconds = Math.floor((durationMinutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분`;
    } else {
      return `${seconds}초`;
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Ensure admin session is set before export
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.isAdmin || userData.id) {
          try {
            await supabase.rpc('set_admin_session', {
              admin_id_value: userData.id
            });
            // Wait a moment to ensure session is properly set
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error('Failed to set admin session for export:', error);
            throw error;
          }
        }
      }

      // Fetch all session data for export
      const { data, error } = await supabase
        .rpc('get_user_sessions_with_usernames');

      if (error) throw error;

      const exportData = (data || []).map((session: any) => ({
        '사용자': session.username,
        '로그인시간': formatDateTime(session.login_time),
        '로그아웃시간': session.logout_time ? formatDateTime(session.logout_time) : '진행중',
        '세션시간': formatDuration(session.login_time, session.logout_time),
        '상태': session.logout_time ? '종료됨' : '활성',
        '생성일': formatDateTime(session.created_at),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 15 }, // 사용자
        { wch: 20 }, // 로그인시간
        { wch: 20 }, // 로그아웃시간
        { wch: 15 }, // 세션시간
        { wch: 10 }, // 상태
        { wch: 20 }, // 생성일
      ];
      worksheet['!cols'] = colWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '사용자세션기록');

      const fileName = `사용자세션기록_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: '성공',
        description: `엑셀 파일이 다운로드되었습니다. (총 ${exportData.length}개 항목)`,
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>사용자 세션 기록</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              className="flex items-center gap-2"
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button
              onClick={exportToExcel}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              엑셀 다운로드
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">세션 기록이 없습니다.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>로그인 시간</TableHead>
                  <TableHead>로그아웃 시간</TableHead>
                  <TableHead>세션 시간</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.users.username}
                    </TableCell>
                    <TableCell>{formatDateTime(session.login_time)}</TableCell>
                    <TableCell>
                      {session.logout_time ? formatDateTime(session.logout_time) : '-'}
                    </TableCell>
                    <TableCell>
                      {formatDuration(session.login_time, session.logout_time)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.logout_time ? 'secondary' : 'default'}>
                        {session.logout_time ? '종료됨' : '활성'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};