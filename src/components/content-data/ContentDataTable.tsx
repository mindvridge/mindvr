import { useState } from 'react';
import { ContentData } from '@/types/content-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ContentDataTableProps {
  data: ContentData[];
  onEdit: (content: ContentData) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export const ContentDataTable = ({ data, onEdit, onDelete, loading }: ContentDataTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)}KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)}MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)}GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>콘텐츠 데이터 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            데이터를 불러오는 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>콘텐츠 데이터 목록 ({data.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            등록된 콘텐츠 데이터가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>콘텐츠 이름</TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead>파일 크기</TableHead>
                  <TableHead>파일 타입</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium">
                      {content.content_name}
                    </TableCell>
                    <TableCell>{content.content_filename || '-'}</TableCell>
                    <TableCell>{formatFileSize(content.file_size)}</TableCell>
                    <TableCell>{content.file_type || '-'}</TableCell>
                    <TableCell>{formatDate(content.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(content)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>콘텐츠 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                '{content.content_name}' 콘텐츠를 정말 삭제하시겠습니까?
                                이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(content.id)}
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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