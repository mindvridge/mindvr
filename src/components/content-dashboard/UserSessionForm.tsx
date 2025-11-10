import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrentKoreanTimeISO } from '@/lib/dateUtils';

interface UserSessionFormProps {
  loading?: boolean;
}

export const UserSessionForm = ({ loading }: UserSessionFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    user_id: '',
    login_time: '',
    logout_time: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setCurrentDateTime = (field: 'login_time' | 'logout_time') => {
    const now = getCurrentKoreanTimeISO();
    setFormData(prev => ({ ...prev, [field]: now }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.login_time) {
      toast({
        title: '입력 오류',
        description: '사용자 ID와 로그인 시간은 필수입니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 한국시간 타임존 정보 추가
      const addTimezone = (timeStr: string) => {
        if (!timeStr) return null;
        if (timeStr.includes('+') || timeStr.includes('Z')) return timeStr;
        return timeStr + '+09:00';
      };

      const sessionData = {
        user_id: formData.user_id,
        login_time: addTimezone(formData.login_time),
        logout_time: formData.logout_time ? addTimezone(formData.logout_time) : null,
      };

      const { error } = await supabase
        .from('user_sessions')
        .insert(sessionData);

      if (error) throw error;

      toast({
        title: '성공',
        description: '사용자 세션이 추가되었습니다.',
      });

      // 폼 초기화
      setFormData({
        user_id: '',
        login_time: '',
        logout_time: '',
      });
    } catch (error) {
      console.error('사용자 세션 추가 실패:', error);
      toast({
        title: '오류',
        description: '사용자 세션 추가 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>사용자 세션 로그 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_id">사용자 ID</Label>
            <Input
              id="user_id"
              type="text"
              value={formData.user_id}
              onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
              placeholder="사용자 ID를 입력하세요"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="login_time">로그인 시간</Label>
            <div className="flex gap-2">
              <Input
                id="login_time"
                type="datetime-local"
                value={formData.login_time}
                onChange={(e) => setFormData(prev => ({ ...prev, login_time: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentDateTime('login_time')}
                className="whitespace-nowrap"
              >
                현재
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logout_time">로그아웃 시간 (선택사항)</Label>
            <div className="flex gap-2">
              <Input
                id="logout_time"
                type="datetime-local"
                value={formData.logout_time}
                onChange={(e) => setFormData(prev => ({ ...prev, logout_time: e.target.value }))}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentDateTime('logout_time')}
                className="whitespace-nowrap"
              >
                현재
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || isSubmitting}
          >
            {isSubmitting ? '추가 중...' : '세션 로그 추가'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};