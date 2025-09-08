import { VRLogForm } from '@/components/vr-dashboard/VRLogForm';
import { VRLogTable } from '@/components/vr-dashboard/VRLogTable';
import { VRDeviceSearch } from '@/components/vr-dashboard/VRDeviceSearch';
import { VRDashboardCharts } from '@/components/vr-dashboard/VRDashboardCharts';
import { useVRLogs } from '@/hooks/useVRLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const {
    logs,
    loading,
    searchQuery,
    addLog,
    updateLogEndTime,
    fetchLogs,
    getContentUsageStats,
    getDeviceUsageStats,
  } = useVRLogs();

  const handleSearch = (query: string) => {
    fetchLogs(query || undefined);
  };

  const handleEndSession = (logId: string) => {
    const now = new Date().toISOString();
    updateLogEndTime(logId, now);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">VR 콘텐츠 사용 대시보드</h1>
          <p className="text-xl text-muted-foreground">
            VR 기기의 콘텐츠 사용 현황을 모니터링하고 분석합니다
          </p>
        </div>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">로그 관리</TabsTrigger>
            <TabsTrigger value="analytics">분석 대시보드</TabsTrigger>
            <TabsTrigger value="add">새 로그 추가</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            <VRDeviceSearch
              onSearch={handleSearch}
              currentQuery={searchQuery}
              loading={loading}
            />
            <VRLogTable
              logs={logs}
              loading={loading}
              onEndSession={handleEndSession}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <VRDashboardCharts
              getContentStats={getContentUsageStats}
              getDeviceStats={getDeviceUsageStats}
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
