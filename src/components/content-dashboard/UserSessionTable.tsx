import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserSession } from '@/types/auth';
import { formatToKoreanTime, calculateDuration } from '@/lib/dateUtils';

export const UserSessionTable = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // Ensure admin session is set before querying
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.isAdmin) {
          await supabase.rpc('set_admin_session', {
            admin_id_value: userData.id
          });
        }
      }
      const { data, error } = await supabase
        .rpc('get_user_sessions_with_usernames');

      if (error) throw error;

      // Transform data to match expected format
      const transformedData = data?.map((session: any) => ({
        id: session.session_id,
        user_id: session.user_id,
        login_time: session.login_time,
        logout_time: session.logout_time,
        created_at: session.created_at,
        users: { username: session.username }
      })) || [];

      setSessions(transformedData);
    } catch (error) {
      console.error('세션 조회 실패:', error);
    } finally {
      setLoading(false);
    }
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
        <CardTitle>사용자 세션 기록</CardTitle>
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