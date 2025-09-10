import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VRLogFormProps {
  onSubmit: (data: { device_id: string; content_name: string; start_time: string; end_time?: string; }) => void;
  loading?: boolean;
}

export const VRLogForm = ({ onSubmit, loading }: VRLogFormProps) => {
  const [formData, setFormData] = useState({
    device_id: '',
    content_name: '',
    start_time: '',
    end_time: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      end_time: formData.end_time || undefined,
    };
    onSubmit(dataToSubmit);
    setFormData({
      device_id: '',
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
    setFormData(prev => ({ ...prev, [field]: localDateTime }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>VR 사용 로그 추가</CardTitle>
        <CardDescription>
          새로운 VR 콘텐츠 사용 기록을 추가합니다. 종료시간은 선택사항입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device_id">기기 ID</Label>
              <Input
                id="device_id"
                type="text"
                placeholder="예: VR-001"
                value={formData.device_id}
                onChange={(e) => setFormData(prev => ({ ...prev, device_id: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content_name">콘텐츠명</Label>
              <Input
                id="content_name"
                type="text"
                placeholder="예: 가상 여행 - 파리"
                value={formData.content_name}
                onChange={(e) => setFormData(prev => ({ ...prev, content_name: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">시작시간</Label>
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
                  size="sm"
                  onClick={() => setCurrentDateTime('start_time')}
                >
                  현재
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">종료시간 (선택사항)</Label>
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
                  size="sm"
                  onClick={() => setCurrentDateTime('end_time')}
                >
                  현재
                </Button>
              </div>
            </div>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '추가 중...' : '로그 추가'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};