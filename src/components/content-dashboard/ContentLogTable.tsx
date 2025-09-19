import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Trash2, StopCircle } from 'lucide-react';
import { ContentUsageLog } from '@/types/auth';
import { formatToKoreanTime, calculateDuration } from '@/lib/dateUtils';

interface ContentLogTableProps {
  logs: ContentUsageLog[];
  loading: boolean;
  onEndSession: (logId: string) => void;
  onDeleteLog: (logId: string) => void;
  onExportExcel: () => void;
}

export const ContentLogTable = ({ 
  logs, 
  loading, 
  onEndSession, 
  onDeleteLog, 
  onExportExcel 
}: ContentLogTableProps) => {
  const formatDateTime = (dateString: string) => {
    return formatToKoreanTime(dateString, 'yyyy-MM-dd HH:mm:ss');
  };

  const formatDurationFromMinutes = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
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
        <div className="flex justify-between items-center">
          <CardTitle>콘텐츠 사용 로그</CardTitle>
          <div className="flex gap-2">
            <Button onClick={onExportExcel} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              엑셀 다운로드
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">로그가 없습니다.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>콘텐츠명</TableHead>
                  <TableHead>시작시간</TableHead>
                  <TableHead>종료시간</TableHead>
                  <TableHead>사용시간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {(log as any).users?.username || 'Unknown User'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">콘텐츠 {log.content_name}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(log.start_time)}</TableCell>
                    <TableCell>
                      {log.end_time ? formatDateTime(log.end_time) : '-'}
                    </TableCell>
                    <TableCell>{formatDurationFromMinutes(log.duration_minutes)}</TableCell>
                    <TableCell>
                      <Badge variant={log.end_time ? 'secondary' : 'default'}>
                        {log.end_time ? '완료' : '진행중'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!log.end_time && (
                          <Button
                            onClick={() => onEndSession(log.id)}
                            size="sm"
                            variant="outline"
                          >
                            <StopCircle className="w-4 h-4 mr-1" />
                            세션 종료
                          </Button>
                        )}
                        <Button
                          onClick={() => onDeleteLog(log.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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