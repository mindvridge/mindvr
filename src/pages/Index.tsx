import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Trash2, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { useContentLogs } from '@/hooks/useContentLogs';
import { ApiTestPanel } from '@/components/api-test/ApiTestPanel';

const Index = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
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
    getLoginSessionStats,
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
    updateLogEndTime(logId);
  };

  const handleAddLog = (logData: any) => {
    addLog(logData);
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
          <div className="flex gap-2">
            <Link to="/content-management">
              <Button variant="outline" className="flex items-center gap-2">
                <Database size={16} />
                콘텐츠 관리
              </Button>
            </Link>
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

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="logs">콘텐츠 로그</TabsTrigger>
            <TabsTrigger value="sessions">사용자 세션</TabsTrigger>
            <TabsTrigger value="analytics">분석 대시보드</TabsTrigger>
            <TabsTrigger value="add-log">새 로그 추가</TabsTrigger>
            <TabsTrigger value="api-test">API 테스트</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview 
              getContentUsageStats={getContentUsageStats}
              getUserStats={getUserStats}
              getLoginSessionStats={getLoginSessionStats}
            />
          </TabsContent>

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

          <TabsContent value="api-test">
            <ApiTestPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
