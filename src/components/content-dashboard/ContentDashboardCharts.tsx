import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ContentUsageStats, UserStats } from '@/types/auth';

interface ContentDashboardChartsProps {
  getContentUsageStats: () => Promise<ContentUsageStats[]>;
  getUserStats: () => Promise<UserStats[]>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const ContentDashboardCharts = ({ getContentUsageStats, getUserStats }: ContentDashboardChartsProps) => {
  const [contentStats, setContentStats] = useState<ContentUsageStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [contentData, userData] = await Promise.all([
        getContentUsageStats(),
        getUserStats(),
      ]);
      setContentStats(contentData);
      setUserStats(userData);
    } catch (error) {
      console.error('통계 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">통계 로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">콘텐츠 통계</TabsTrigger>
          <TabsTrigger value="users">사용자 통계</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>콘텐츠별 총 사용시간</CardTitle>
                <CardDescription>각 콘텐츠의 총 사용시간을 보여줍니다</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contentStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="content_name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${Math.round(value)}분`, '총 사용시간']}
                    />
                    <Bar dataKey="total_usage_minutes" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>콘텐츠별 사용 빈도</CardTitle>
                <CardDescription>각 콘텐츠의 사용 횟수를 보여줍니다</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={contentStats.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ content_name, usage_count }) => `${content_name}: ${usage_count}회`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="usage_count"
                    >
                      {contentStats.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>콘텐츠 상세 통계</CardTitle>
              <CardDescription>각 콘텐츠의 상세한 사용 통계입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-300 px-4 py-2 text-left">콘텐츠명</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">총 사용시간</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">사용 횟수</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">평균 사용시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentStats.map((stat, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{stat.content_name}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{Math.round(stat.total_usage_minutes)}분</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{stat.usage_count}회</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{Math.round(stat.avg_usage_minutes)}분</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>사용자별 총 사용시간</CardTitle>
                <CardDescription>각 사용자의 총 사용시간을 보여줍니다</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="username" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${Math.round(value)}분`, '총 사용시간']}
                    />
                    <Bar dataKey="total_usage_minutes" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>사용자별 세션 수</CardTitle>
                <CardDescription>각 사용자의 세션 개수를 보여줍니다</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userStats.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ username, session_count }) => `${username}: ${session_count}회`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="session_count"
                    >
                      {userStats.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>사용자 상세 통계</CardTitle>
              <CardDescription>각 사용자의 상세한 사용 통계입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-300 px-4 py-2 text-left">사용자명</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">총 사용시간</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">세션 수</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">마지막 사용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((stat, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{stat.username}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{Math.round(stat.total_usage_minutes)}분</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{stat.session_count}회</td>
                        <td className="border border-gray-300 px-4 py-2">{new Date(stat.last_used).toLocaleString('ko-KR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};