import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Users, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DashboardOverviewProps {
  getContentUsageStats: () => Promise<any[]>;
  getUserStats: () => Promise<any[]>;
  getLoginSessionStats: () => Promise<any>;
}

export const DashboardOverview = ({ getContentUsageStats, getUserStats, getLoginSessionStats }: DashboardOverviewProps) => {
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [averageUsageTime, setAverageUsageTime] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [contentData, setContentData] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const { toast } = useToast();

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}.${Math.round((mins / 60) * 10)}시간` : `${mins}분`;
  };

  const getKoreanWeekDates = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const day = koreaTime.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day; // 월요일을 주의 시작으로
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(koreaTime);
      date.setDate(koreaTime.getDate() + mondayOffset + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const getKoreanMonthRange = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const year = koreaTime.getFullYear();
    const month = koreaTime.getMonth();
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    return { monthStart, monthEnd };
  };

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [contentStats, userStats, sessionStats] = await Promise.all([
        getContentUsageStats(),
        getUserStats(),
        getLoginSessionStats()
      ]);

      // Calculate monthly and daily usage based on Korean standards (login-based)
      const { monthStart, monthEnd } = getKoreanMonthRange();
      const daysInMonth = monthEnd.getDate();
      
      // Get monthly login sessions
      const { data: monthlyLogins } = await supabase
        .from('user_sessions')
        .select('id')
        .gte('login_time', monthStart.toISOString())
        .lte('login_time', monthEnd.toISOString());
      
      const monthlyLoginCount = monthlyLogins?.length || 0;
      
      setMonthlyUsage(monthlyLoginCount);
      setDailyUsage(Math.round(monthlyLoginCount / daysInMonth));
      setAverageUsageTime(sessionStats.avgSessionMinutes);

      // Generate weekly data based on Korean week (Monday-Sunday) with login data
      const weekDates = getKoreanWeekDates();
      const weeklyData = await Promise.all(weekDates.map(async (date) => {
        // Get login sessions for this specific date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: dayLogins } = await supabase
          .from('user_sessions')
          .select('id')
          .gte('login_time', startOfDay.toISOString())
          .lte('login_time', endOfDay.toISOString());

        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          count: dayLogins?.length || 0
        };
      }));
      setWeeklyData(weeklyData);

      // Prepare content data for bar chart (top 8)
      const contentChartData = contentStats.slice(0, 8).map((item, index) => ({
        name: (index + 1).toString(),
        count: item.usage_count
      }));
      setContentData(contentChartData);

      // Prepare top 3 content for table
      const top3Content = contentStats.slice(0, 3).map((item, index) => ({
        rank: index + 1,
        contentVersion: Math.floor(Math.random() * 10) + 1, // Mock version
        contentName: item.content_name,
        playCount: item.usage_count,
        avgTime: formatMinutes(item.avg_usage_minutes)
      }));
      setTopContent(top3Content);
      
      // 성공 시 마지막 업데이트 시간 설정 및 토스트
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      setLastUpdated(koreaTime.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
      
      if (isRefresh) {
        toast({
          title: "새로고침 완료",
          description: "대시보드 데이터가 성공적으로 업데이트되었습니다.",
        });
      }

    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
      if (isRefresh) {
        toast({
          title: "새로고침 실패",
          description: "데이터를 가져오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">대시보드 로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-muted-foreground">{today}</span>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                마지막 업데이트: {lastUpdated}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{monthlyUsage}</p>
                <p className="text-sm text-muted-foreground">월간 이용 횟수</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{dailyUsage}</p>
                <p className="text-sm text-muted-foreground">일간 이용 횟수</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatMinutes(averageUsageTime)}</p>
                <p className="text-sm text-muted-foreground">평균 사용 시간</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Usage Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>주간 누적 이용 횟수</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "이용 횟수",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Content Usage Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>콘텐츠별 재생 횟수</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "재생 횟수",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Content Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            콘텐츠 TOP3 (이용 차례)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">순위</TableHead>
                <TableHead>콘텐츠 번호</TableHead>
                <TableHead>콘텐츠 제목</TableHead>
                <TableHead>재생 횟수</TableHead>
                <TableHead>평균 사용 시간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topContent.map((content) => (
                <TableRow key={content.rank}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={content.rank === 1 ? "default" : "secondary"}>
                        {content.rank}
                      </Badge>
                      {content.rank <= 3 && (
                        <Trophy className={`h-4 w-4 ${
                          content.rank === 1 ? 'text-yellow-500' : 
                          content.rank === 2 ? 'text-gray-400' : 
                          'text-amber-600'
                        }`} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{content.contentVersion}</TableCell>
                  <TableCell className="font-medium">{content.contentName}</TableCell>
                  <TableCell>{content.playCount}</TableCell>
                  <TableCell className="text-primary">{content.avgTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};