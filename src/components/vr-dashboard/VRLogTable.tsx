import { VRUsageLog } from '@/types/vr-log';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatToKoreanTime, calculateDuration } from '@/lib/dateUtils';
import { Download, Trash2 } from 'lucide-react';

interface VRLogTableProps {
  logs: VRUsageLog[];
  loading: boolean;
  onEndSession: (logId: string) => void;
  onDeleteLog: (logId: string) => void;
  onExportExcel: () => void;
}

export const VRLogTable = ({ logs, loading, onEndSession, onDeleteLog, onExportExcel }: VRLogTableProps) => {
  const formatDateTime = (dateString: string) => {
    return formatToKoreanTime(dateString, 'yyyy-MM-dd HH:mm:ss');
  };

  const formatDurationFromMinutes = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return hours > 0 ? `${hours}시간 ${remainingMinutes}분` : `${remainingMinutes}분`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VR 사용 로그</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>VR 사용 로그</CardTitle>
            <CardDescription>
              총 {logs.length}개의 로그 기록
            </CardDescription>
          </div>
          <Button 
            onClick={onExportExcel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download size={16} />
            엑셀 다운로드
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            등록된 로그가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기기 ID</TableHead>
                  <TableHead>콘텐츠명</TableHead>
                  <TableHead>시작시간</TableHead>
                  <TableHead>종료시간</TableHead>
                  <TableHead>사용시간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.device_id}</TableCell>
                    <TableCell>{log.content_name}</TableCell>
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
                            size="sm"
                            variant="outline"
                            onClick={() => onEndSession(log.id)}
                          >
                            세션 종료
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeleteLog(log.id)}
                        >
                          <Trash2 size={14} />
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