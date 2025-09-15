import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentData, ContentDataFormData } from '@/types/content-data';

interface ContentDataFormProps {
  onSubmit: (data: ContentDataFormData) => void;
  initialData?: ContentData;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ContentDataForm = ({ onSubmit, initialData, onCancel, isLoading }: ContentDataFormProps) => {
  const [formData, setFormData] = useState<ContentDataFormData>({
    content_name: initialData?.content_name || '',
    content_filename: initialData?.content_filename || '',
    description: initialData?.description || '',
    file_size: initialData?.file_size || 0,
    file_type: initialData?.file_type || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof ContentDataFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? '콘텐츠 수정' : '새 콘텐츠 추가'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="content_name">콘텐츠 이름 *</Label>
            <Input
              id="content_name"
              value={formData.content_name}
              onChange={(e) => handleChange('content_name', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="content_filename">콘텐츠 파일명</Label>
            <Input
              id="content_filename"
              value={formData.content_filename}
              onChange={(e) => handleChange('content_filename', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="file_size">파일 크기 (bytes)</Label>
            <Input
              id="file_size"
              type="number"
              value={formData.file_size}
              onChange={(e) => handleChange('file_size', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <Label htmlFor="file_type">파일 타입</Label>
            <Input
              id="file_type"
              value={formData.file_type}
              onChange={(e) => handleChange('file_type', e.target.value)}
              placeholder="예: video/mp4, image/jpeg"
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !formData.content_name}>
              {isLoading ? '처리중...' : (initialData ? '수정' : '추가')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};