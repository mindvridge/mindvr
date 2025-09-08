import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContentLogFormData } from '@/types/auth';

interface ContentLogFormProps {
  onSubmit: (data: ContentLogFormData) => void;
  loading?: boolean;
}

export const ContentLogForm = ({ onSubmit, loading }: ContentLogFormProps) => {
  const [formData, setFormData] = useState<ContentLogFormData>({
    user_id: '',
    content_name: '',
    start_time: '',
    end_time: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      end_time: formData.end_time || undefined,
    };
    onSubmit(submitData);
    setFormData({
      user_id: '',
      content_name: '',
      start_time: '',
      end_time: '',
    });
  };

  const setCurrentDateTime = (field: 'start_time' | 'end_time') => {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setFormData(prev => ({
      ...prev,
      [field]: localDateTime
    }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>새 콘텐츠 사용 로그 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">사용자 ID</Label>
            <Input
              id="user_id"
              type="text"
              placeholder="사용자 ID를 입력하세요"
              value={formData.user_id}
              onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_name">콘텐츠명</Label>
            <Input
              id="content_name"
              type="text"
              placeholder="콘텐츠명을 입력하세요"
              value={formData.content_name}
              onChange={(e) => setFormData(prev => ({ ...prev, content_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_time">시작 시간</Label>
            <div className="flex gap-2">
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentDateTime('start_time')}
                className="whitespace-nowrap"
              >
                현재
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_time">종료 시간 (선택사항)</Label>
            <div className="flex gap-2">
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentDateTime('end_time')}
                className="whitespace-nowrap"
              >
                현재
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '추가 중...' : '로그 추가'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};