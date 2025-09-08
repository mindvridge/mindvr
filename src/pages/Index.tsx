import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { Navigate } from 'react-router-dom';
import { ContentLogTable } from '@/components/content-dashboard/ContentLogTable';
import { ContentLogForm } from '@/components/content-dashboard/ContentLogForm';
import { ContentDashboardCharts } from '@/components/content-dashboard/ContentDashboardCharts';
import { ContentUserSearch } from '@/components/content-dashboard/ContentUserSearch';
import { UserSessionTable } from '@/components/content-dashboard/UserSessionTable';
import { UserSessionForm } from '@/components/content-dashboard/UserSessionForm';
import { useContentLogs } from '@/hooks/useContentLogs';

const Index = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const {
    logs,
    loading,
    searchQuery,
    setSearchQuery,
    selectedMonth,
    setSelectedMonth,
    fetchLogs,
    addLog,
    updateLogEndTime,
    deleteLog,
    deleteAllLogs,
    exportToExcel,
    getContentUsageStats,
    getUserStats,
    getTotalLoginStats,
  } = useContentLogs();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSearch = () => {
    fetchLogs(searchQuery, selectedMonth);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedMonth('');
    fetchLogs('', '');
  };

  const handleEndSession = (logId: string) => {
    const endTime = new Date().toISOString();
    updateLogEndTime(logId, endTime);
  };

  const handleAddLog = (logData: any) => {
    addLog(logData);
  };

  const handleDeleteAllData = async () => {
    if (user?.username !== 'admin') {
      toast({
        title: '권한 없음',
        description: '관리자만 전체 데이터를 삭제할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingAll(true);
    try {
      // 순서대로 데이터 삭제
      await supabase.from('content_usage_logs').delete().neq('id', '');
      await supabase.from('user_sessions').delete().neq('id', '');
      await supabase.from('vr_usage_logs').delete().neq('id', '');
      await supabase.from('users').delete().neq('id', '');
      
      toast({
        title: '성공',
        description: '모든 데이터베이스 데이터가 삭제되었습니다.',
      });
      
      // 데이터 새로고침
      fetchLogs('', '');
    } catch (error) {
      console.error('전체 데이터 삭제 실패:', error);
      toast({
        title: '오류',
        description: '데이터 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              VR 콘텐츠 관리 대시보드
            </h1>
            <p className="text-muted-foreground mt-2">
              사용자: {user.username} | 콘텐츠 사용 로그 및 분석 관리
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.username === 'admin' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 size={16} />
                    전체 DB 삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>전체 데이터베이스 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말로 모든 데이터베이스 데이터를 삭제하시겠습니까? 
                      이 작업은 되돌릴 수 없으며, 모든 사용자 데이터, 세션, 로그가 영구적으로 삭제됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAllData}
                      disabled={isDeletingAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingAll ? '삭제 중...' : '삭제 확인'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button 
              onClick={logout} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              로그아웃
            </Button>
          </div>
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs">콘텐츠 로그</TabsTrigger>
            <TabsTrigger value="sessions">사용자 세션</TabsTrigger>
            <TabsTrigger value="analytics">분석 대시보드</TabsTrigger>
            <TabsTrigger value="add-log">새 로그 추가</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            <ContentUserSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onSearch={handleSearch}
              onReset={handleReset}
            />
            <ContentLogTable
              logs={logs}
              loading={loading}
              onEndSession={handleEndSession}
              onDeleteLog={deleteLog}
              onDeleteAll={deleteAllLogs}
              onExportExcel={exportToExcel}
            />
          </TabsContent>

          <TabsContent value="sessions">
            <UserSessionTable />
          </TabsContent>

          <TabsContent value="analytics">
            <ContentDashboardCharts
              getContentUsageStats={getContentUsageStats}
              getUserStats={getUserStats}
              getTotalLoginStats={getTotalLoginStats}
            />
          </TabsContent>

          <TabsContent value="add-log" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <ContentLogForm onSubmit={handleAddLog} />
              <UserSessionForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
