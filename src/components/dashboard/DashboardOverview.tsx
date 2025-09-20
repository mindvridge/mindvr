import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
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
  const [weeklyUsage, setWeeklyUsage] = useState(0);
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
      // First, check if user is authenticated and set admin session if needed
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.isAdmin || userData.id) {
          try {
            await supabase.rpc('set_admin_session', {
              admin_id_value: userData.id
            });
            console.log('Admin session set for dashboard data loading');
          } catch (error) {
            console.error('Failed to set admin session:', error);
            // 관리자 세션 설정 실패 시 사용자에게 알림
            if (isRefresh) {
              toast({
                title: "권한 오류",
                description: "관리자 권한을 확인할 수 없습니다. 다시 로그인해주세요.",
                variant: "destructive",
              });
            }
            return;
          }
        }
      }

      const [contentStats, userStats, sessionStats] = await Promise.all([
        getContentUsageStats(),
        getUserStats(),
        getLoginSessionStats()
      ]);

      // Calculate Korean timezone dates
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      
      // Get monthly usage count (this month)
      const { monthStart, monthEnd } = getKoreanMonthRange();
      const { data: monthlyLogins } = await supabase
        .from('user_sessions')
        .select('id')
        .gte('login_time', monthStart.toISOString())
        .lte('login_time', monthEnd.toISOString());
      
      const monthlyLoginCount = monthlyLogins?.length || 0;
      
      // Get daily usage count (today only) - Convert Korea time to UTC for DB query
      const today = new Date(koreaTime);
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();
      
      // Create start and end of day in Korea timezone
      const todayStartKST = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);
      const todayEndKST = new Date(todayYear, todayMonth, todayDate, 23, 59, 59, 999);
      
      // Convert to UTC for database query (subtract 9 hours)
      const todayStartUTC = new Date(todayStartKST.getTime() - (9 * 60 * 60 * 1000));
      const todayEndUTC = new Date(todayEndKST.getTime() - (9 * 60 * 60 * 1000));
      
      console.log('Daily usage calculation:');
      console.log('Korea Time:', koreaTime);
      console.log('Today Start KST:', todayStartKST.toISOString());
      console.log('Today End KST:', todayEndKST.toISOString());
      console.log('Today Start UTC:', todayStartUTC.toISOString());
      console.log('Today End UTC:', todayEndUTC.toISOString());
      
      const { data: todayLogins, error: dailyError } = await supabase
        .from('user_sessions')
        .select('id, login_time')
        .gte('login_time', todayStartUTC.toISOString())
        .lte('login_time', todayEndUTC.toISOString());
      
      console.log('Today logins query result:', todayLogins);
      console.log('Daily query error:', dailyError);
      
      const dailyLoginCount = todayLogins?.length || 0;
      console.log('Daily login count:', dailyLoginCount);
      
      setMonthlyUsage(monthlyLoginCount);
      setDailyUsage(dailyLoginCount);

      // Get total usage count (all time)
      const { data: totalLogins } = await supabase
        .from('user_sessions')
        .select('id');
      
      const totalLoginCount = totalLogins?.length || 0;
      setWeeklyUsage(totalLoginCount);

      // Generate weekly data for chart (daily breakdown) - Use Korea timezone
      const weekDates = getKoreanWeekDates();
      const weeklyData = await Promise.all(weekDates.map(async (date) => {
        // Get login sessions for this specific date in Korea timezone
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

      // Get content play counts from vr_usage_logs - 전체 기간
      const { data: allContentLogs, error: contentError } = await supabase
        .from('vr_usage_logs')
        .select('content_name')
        .not('content_name', 'is', null);

      if (contentError) {
        console.error('Content logs fetch error:', contentError);
      }

      console.log('All content logs:', allContentLogs);

      // Count plays by content_name for all time
      const allContentCounts = (allContentLogs || []).reduce((acc: any, log: any) => {
        const contentName = log.content_name?.toString();
        if (contentName) {
          acc[contentName] = (acc[contentName] || 0) + 1;
        }
        return acc;
      }, {});

      console.log('All content counts:', allContentCounts);

      // Prepare content data for bar chart (always 8 items: 1-8)
      const contentChartData = Array.from({ length: 8 }, (_, index) => {
        const contentName = (index + 1).toString();
        const count = allContentCounts[contentName] || 0;
        console.log(`Content ${contentName}: ${count}`);
        return {
          name: contentName,
          count: count
        };
      });
      
      console.log('Content chart data:', contentChartData);
      setContentData(contentChartData);

      // Get weekly TOP3 content (Korean time zone)
      const weekDatesForTop3 = getKoreanWeekDates();
      const weekStartForTop3 = weekDatesForTop3[0];
      const weekEndForTop3 = weekDatesForTop3[weekDatesForTop3.length - 1];
      weekEndForTop3.setHours(23, 59, 59, 999);
      
      console.log('Week range for TOP3:', weekStartForTop3.toISOString(), 'to', weekEndForTop3.toISOString());
      
      const { data: weeklyContentLogs } = await supabase
        .from('vr_usage_logs')
        .select('content_name, duration_minutes, start_time')
        .not('content_name', 'is', null)
        .gte('start_time', weekStartForTop3.toISOString())
        .lte('start_time', weekEndForTop3.toISOString());

      console.log('Weekly content logs:', weeklyContentLogs);

      // Count weekly plays and calculate averages
      const weeklyContentStats = (weeklyContentLogs || []).reduce((acc: any, log: any) => {
        const contentName = log.content_name.toString();
        if (!acc[contentName]) {
          acc[contentName] = { playCount: 0, totalDuration: 0, durationsCount: 0 };
        }
        acc[contentName].playCount += 1;
        if (log.duration_minutes) {
          acc[contentName].totalDuration += log.duration_minutes;
          acc[contentName].durationsCount += 1;
        }
        return acc;
      }, {});

      console.log('Weekly content stats:', weeklyContentStats);

      // Convert to array and sort by play count
      const weeklyTopContent = Object.entries(weeklyContentStats)
        .map(([contentName, stats]: [string, any]) => ({
          contentName,
          playCount: stats.playCount,
          avgDuration: stats.durationsCount > 0 ? stats.totalDuration / stats.durationsCount : 0
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 3);

      console.log('Weekly top content:', weeklyTopContent);

      // Prepare top 3 content for table
      const top3Content = weeklyTopContent.map((item, index) => ({
        rank: index + 1,
        contentVersion: parseInt(item.contentName) || 1,
        contentName: `콘텐츠 ${item.contentName}`,
        playCount: item.playCount,
        avgTime: formatMinutes(item.avgDuration)
      }));
      
      console.log('Top 3 content for display:', top3Content);
      setTopContent(top3Content);
      
      // 성공 시 마지막 업데이트 시간 설정 및 토스트
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
                <p className="text-2xl font-bold">{weeklyUsage}</p>
                <p className="text-sm text-muted-foreground">총 누적 이용 횟수</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Usage Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>일별 이용 횟수 (최근 7일)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "이용 횟수",
                  color: "hsl(260 80% 60%)",
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
                    stroke="hsl(260 80% 60%)" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(260 80% 60%)", strokeWidth: 2 }}
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
                  color: "hsl(260 80% 60%)",
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
                  <Bar dataKey="count" fill="hsl(260 80% 60%)" radius={[4, 4, 0, 0]}>
                    <LabelList 
                      dataKey="count" 
                      position="top" 
                      style={{ 
                        fill: "hsl(var(--foreground))", 
                        fontSize: "12px", 
                        fontWeight: "500" 
                      }}
                      formatter={(value: number) => value > 0 ? value : ""}
                    />
                  </Bar>
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