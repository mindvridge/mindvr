import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ContentUsageStats, DeviceUsageStats } from '@/types/vr-log';

interface VRDashboardChartsProps {
  getContentStats: () => Promise<ContentUsageStats[]>;
  getDeviceStats: () => Promise<DeviceUsageStats[]>;
}

export const VRDashboardCharts = ({ getContentStats, getDeviceStats }: VRDashboardChartsProps) => {
  const [contentStats, setContentStats] = useState<ContentUsageStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceUsageStats[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [contentData, deviceData] = await Promise.all([
          getContentStats(),
          getDeviceStats()
        ]);
        setContentStats(contentData);
        setDeviceStats(deviceData);
      } catch (error) {
        console.error('통계 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [getContentStats, getDeviceStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">로딩 중...</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">로딩 중...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* 콘텐츠별 사용시간 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>콘텐츠별 사용시간</CardTitle>
          <CardDescription>각 콘텐츠의 총 사용시간 통계</CardDescription>
        </CardHeader>
        <CardContent>
          {contentStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              통계 데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="content_name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tickFormatter={formatMinutes}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatMinutes(value), '사용시간']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="total_usage_minutes" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 콘텐츠별 사용 빈도 */}
        <Card>
          <CardHeader>
            <CardTitle>콘텐츠별 사용 빈도</CardTitle>
            <CardDescription>각 콘텐츠의 사용 횟수</CardDescription>
          </CardHeader>
          <CardContent>
            {contentStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                통계 데이터가 없습니다.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={contentStats.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage_count"
                    label={({ content_name, usage_count }) => `${content_name}: ${usage_count}`}
                  >
                    {contentStats.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 기기별 사용시간 */}
        <Card>
          <CardHeader>
            <CardTitle>기기별 사용시간</CardTitle>
            <CardDescription>각 기기의 총 사용시간</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                통계 데이터가 없습니다.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={deviceStats.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="device_id"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatMinutes}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatMinutes(value), '사용시간']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="total_usage_minutes" 
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};