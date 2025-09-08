import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 관리자 계정 확인
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      // 관리자로 로그인 처리
      const adminUser = {
        id: 'admin-001',
        username: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem('current_user', JSON.stringify(adminUser));
      localStorage.setItem('current_session_id', 'admin-session');
      
      toast({
        title: '성공',
        description: '관리자로 로그인되었습니다.',
      });
      
      window.location.reload();
    } else {
      toast({
        title: '오류',
        description: '관리자 계정 정보가 올바르지 않습니다.',
        variant: 'destructive',
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">관리자 대시보드</CardTitle>
          <CardDescription className="text-center">
            관리자 계정으로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username">관리자 아이디</Label>
              <Input
                id="admin-username"
                type="text"
                placeholder="관리자 아이디를 입력하세요"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">비밀번호</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '관리자 로그인'}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
            <p className="font-medium mb-1">알림:</p>
            <p>• 일반 사용자는 API를 통해서만 가입 및 로그인할 수 있습니다.</p>
            <p>• 웹사이트는 관리자 전용입니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}