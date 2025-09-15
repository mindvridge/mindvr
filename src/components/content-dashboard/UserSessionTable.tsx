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
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          users!inner(username)
        `)
        .order('login_time', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSessions(data || []);
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