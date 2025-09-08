import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VRLogForm } from '@/components/vr-dashboard/VRLogForm';
import { VRLogTable } from '@/components/vr-dashboard/VRLogTable';
import { VRDeviceSearch } from '@/components/vr-dashboard/VRDeviceSearch';
import { VRDashboardCharts } from '@/components/vr-dashboard/VRDashboardCharts';
import { useVRLogs } from '@/hooks/useVRLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const {
    logs,
    loading,
    searchQuery,
    selectedMonth,
    setSelectedMonth,
    addLog,
    updateLogEndTime,
    fetchLogs,
    deleteLog,
    exportToExcel,
    getContentUsageStats,
    getDeviceUsageStats,
  } = useVRLogs();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  const handleSearch = (query: string, month?: string) => {
    setSelectedMonth(month || '');
    fetchLogs(query || undefined, month || undefined);
  };

  const handleEndSession = (logId: string) => {
    const now = new Date().toISOString();
    updateLogEndTime(logId, now);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VR 콘텐츠 사용 로깅 대시보드
                </CardTitle>
                <CardDescription className="text-lg">
                  VR 기기의 콘텐츠 사용 현황을 실시간으로 모니터링하고 분석합니다
                </CardDescription>
              </div>
              <Button 
                onClick={logout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                로그아웃
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics">분석 대시보드</TabsTrigger>
            <TabsTrigger value="logs">로그 관리</TabsTrigger>
            <TabsTrigger value="add">새 로그 추가</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <VRDashboardCharts
              getContentStats={getContentUsageStats}
              getDeviceStats={getDeviceUsageStats}
            />
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-6">
            <VRDeviceSearch
              onSearch={handleSearch}
              currentQuery={searchQuery}
              currentMonth={selectedMonth}
              loading={loading}
            />
            <VRLogTable 
              logs={logs} 
              loading={loading} 
              onEndSession={handleEndSession}
              onDeleteLog={deleteLog}
              onExportExcel={exportToExcel}
            />
          </TabsContent>

        

          <TabsContent value="add" className="space-y-6">
            <VRLogForm onSubmit={addLog} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
