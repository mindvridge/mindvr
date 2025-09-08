import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ContentUsageStats, UserStats } from '@/types/auth';

interface ContentDashboardChartsProps {
  getContentUsageStats: (sortBy?: 'usage_count' | 'total_usage_minutes') => Promise<ContentUsageStats[]>;
  getUserStats: () => Promise<UserStats[]>;
  getTotalLoginStats: () => Promise<Array<{ username: string; login_count: number }>>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const ContentDashboardCharts = ({ getContentUsageStats, getUserStats, getTotalLoginStats }: ContentDashboardChartsProps) => {
  const [contentStats, setContentStats] = useState<ContentUsageStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loginStats, setLoginStats] = useState<Array<{ username: string; login_count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'usage_count' | 'total_usage_minutes'>('total_usage_minutes');

  useEffect(() => {
    loadStats();
  }, [sortBy]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [contentData, userData, loginData] = await Promise.all([
        getContentUsageStats(sortBy),
        getUserStats(),
        getTotalLoginStats(),
      ]);
      setContentStats(contentData);
      setUserStats(userData);
      setLoginStats(loginData);
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">콘텐츠 사용 분석</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">정렬:</span>
          <Select value={sortBy} onValueChange={(value: 'usage_count' | 'total_usage_minutes') => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total_usage_minutes">이용시간순</SelectItem>
              <SelectItem value="usage_count">접속횟수순</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadStats} variant="outline" size="sm">새로고침</Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">콘텐츠 통계</TabsTrigger>
          <TabsTrigger value="users">사용자 통계</TabsTrigger>
          <TabsTrigger value="logins">접속 통계</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>콘텐츠별 {sortBy === 'usage_count' ? '접속 횟수' : '총 사용시간'}</CardTitle>
                <CardDescription>{sortBy === 'usage_count' ? '접속 횟수가 높은 순으로 정렬' : '이용시간이 높은 순으로 정렬'}</CardDescription>
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
                      formatter={(value: number) => [
                        sortBy === 'usage_count' ? `${value}회` : `${Math.round(value)}분`, 
                        sortBy === 'usage_count' ? '접속 횟수' : '총 사용시간'
                      ]}
                    />
                    <Bar 
                      dataKey={sortBy === 'usage_count' ? 'usage_count' : 'total_usage_minutes'} 
                      fill="hsl(var(--primary))" 
                    />
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
                      <th className="border border-gray-300 px-4 py-2 text-left">순위</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">콘텐츠명</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">총 사용시간</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">사용 횟수</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">평균 사용시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentStats.map((stat, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="border border-gray-300 px-4 py-2 font-bold">#{index + 1}</td>
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
                    <Bar dataKey="total_usage_minutes" fill="hsl(var(--secondary))" />
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
                      <th className="border border-gray-300 px-4 py-2 text-left">순위</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">사용자명</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">총 사용시간</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">세션 수</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">마지막 사용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((stat, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="border border-gray-300 px-4 py-2 font-bold">#{index + 1}</td>
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

        <TabsContent value="logins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>누적 접속 횟수</CardTitle>
              <CardDescription>사용자별 총 로그인 횟수를 보여줍니다</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={loginStats.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="username" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value}회`, '로그인 횟수']}
                  />
                  <Bar dataKey="login_count" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>접속 통계 상세</CardTitle>
              <CardDescription>각 사용자의 접속 횟수 상세 정보</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-300 px-4 py-2 text-left">순위</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">사용자명</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">로그인 횟수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginStats.map((stat, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        <td className="border border-gray-300 px-4 py-2 font-bold">#{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{stat.username}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">{stat.login_count}회</td>
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