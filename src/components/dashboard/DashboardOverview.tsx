import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentKoreanTime, formatToKoreanTime } from '@/lib/dateUtils';

interface DashboardOverviewProps {
  getContentUsageStats: () => Promise<any[]>;
  getUserStats: () => Promise<any[]>;
  getLoginSessionStats: () => Promise<any>;
}

export const DashboardOverview = ({ getContentUsageStats, getUserStats, getLoginSessionStats }: DashboardOverviewProps) => {
  const [weeklyUsage, setWeeklyUsage] = useState(0);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [totalUsage, setTotalUsage] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [contentData, setContentData] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isDataLoading, setIsDataLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  
  const { toast } = useToast();

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}.${Math.round((mins / 60) * 10)}시간` : `${mins}분`;
  };

  const getKoreanWeekRange = (selectedDate?: Date) => {
    const baseDate = selectedDate || selectedWeek;
    const day = baseDate.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

  const handlePreviousWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(newWeek);
  };

  const formatWeek = (date: Date) => {
    const { weekStart, weekEnd } = getKoreanWeekRange(date);
    const startStr = weekStart.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    return `${startStr} ~ ${endStr}`;
  };

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    // 이미 로딩 중이면 중단
    if (isLoadingRef.current && !isRefresh) {
      return;
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    console.log('Loading dashboard data...', { isRefresh, selectedWeek });
    isLoadingRef.current = true;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 요청이 취소되었으면 중단
      if (signal.aborted) return;

      // Set admin session
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.isAdmin || userData.id) {
          await supabase.rpc('set_admin_session', {
            admin_id_value: userData.id
          });
        }
      }

      // 요청이 취소되었으면 중단
      if (signal.aborted) return;

      const now = getCurrentKoreanTime();
      
      // Get selected week range
      const { weekStart, weekEnd } = getKoreanWeekRange(selectedWeek);
      const weekStartUTC = new Date(weekStart.getTime() - (9 * 60 * 60 * 1000));
      const weekEndUTC = new Date(weekEnd.getTime() - (9 * 60 * 60 * 1000));
      
      console.log('Week range:', weekStartUTC.toISOString(), 'to', weekEndUTC.toISOString());

      // Get weekly usage count
      const { data: weeklyLogins } = await supabase
        .from('user_sessions')
        .select('id')
        .gte('login_time', weekStartUTC.toISOString())
        .lte('login_time', weekEndUTC.toISOString())
        .abortSignal(signal);
      
      const weeklyLoginCount = weeklyLogins?.length || 0;
      setWeeklyUsage(weeklyLoginCount);
      
      // Get daily usage count (current day or selected week's first day)
      const today = new Date(now);
      let targetDate = today;
      if (today < weekStart || today > weekEnd) {
        targetDate = weekStart;
      }
      
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayStartUTC = new Date(dayStart.getTime() - (9 * 60 * 60 * 1000));
      const dayEndUTC = new Date(dayEnd.getTime() - (9 * 60 * 60 * 1000));
      
      const { data: todayLogins } = await supabase
        .from('user_sessions')
        .select('id')
        .gte('login_time', dayStartUTC.toISOString())
        .lte('login_time', dayEndUTC.toISOString())
        .abortSignal(signal);
      
      const dailyLoginCount = todayLogins?.length || 0;
      setDailyUsage(dailyLoginCount);

      // Get total usage count
      const { data: totalLogins } = await supabase
        .from('user_sessions')
        .select('id')
        .abortSignal(signal);
      
      const totalLoginCount = totalLogins?.length || 0;
      setTotalUsage(totalLoginCount);

      // Generate weekly chart data
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        weekDates.push(date);
      }

      const weeklyChartData = await Promise.all(weekDates.map(async (date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const startUTC = new Date(startOfDay.getTime() - (9 * 60 * 60 * 1000));
        const endUTC = new Date(endOfDay.getTime() - (9 * 60 * 60 * 1000));

        const { data: dayLogins } = await supabase
          .from('user_sessions')
          .select('id')
          .gte('login_time', startUTC.toISOString())
          .lte('login_time', endUTC.toISOString())
          .abortSignal(signal);

        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          count: dayLogins?.length || 0
        };
      }));
      
      setWeeklyData(weeklyChartData);

      // Get content usage data for selected week
      const { data: contentLogs } = await supabase
        .from('vr_usage_logs')
        .select('content_name')
        .not('content_name', 'is', null)
        .gte('start_time', weekStartUTC.toISOString())
        .lte('start_time', weekEndUTC.toISOString())
        .abortSignal(signal);

      const contentCounts = (contentLogs || []).reduce((acc: any, log: any) => {
        const contentName = log.content_name?.toString();
        if (contentName) {
          acc[contentName] = (acc[contentName] || 0) + 1;
        }
        return acc;
      }, {});

      const contentChartData = Array.from({ length: 8 }, (_, index) => {
        const contentName = (index + 1).toString();
        const count = contentCounts[contentName] || 0;
        return {
          name: contentName,
          count: count
        };
      });
      
      setContentData(contentChartData);

      // Get TOP3 content for selected week
      const { data: weeklyContentLogs } = await supabase
        .from('vr_usage_logs')
        .select('content_name, duration_minutes, start_time')
        .not('content_name', 'is', null)
        .gte('start_time', weekStartUTC.toISOString())
        .lte('start_time', weekEndUTC.toISOString())
        .abortSignal(signal);

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

      const weeklyTopContent = Object.entries(weeklyContentStats)
        .map(([contentName, stats]: [string, any]) => ({
          contentName,
          playCount: stats.playCount,
          avgDuration: stats.durationsCount > 0 ? stats.totalDuration / stats.durationsCount : 0
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 3);

      const top3Content = weeklyTopContent.map((item, index) => ({
        rank: index + 1,
        contentVersion: parseInt(item.contentName) || 1,
        contentName: `콘텐츠 ${item.contentName}`,
        playCount: item.playCount,
        avgTime: formatMinutes(item.avgDuration)
      }));
      
      setTopContent(top3Content);
      
      // Update timestamp
      setLastUpdated(now.toLocaleTimeString('ko-KR', { 
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

    } catch (error: any) {
      // AbortError는 정상적인 취소이므로 무시
      if (error.name === 'AbortError' || signal.aborted) {
        return;
      }
      
      console.error('Dashboard data loading failed:', error);
      
      setWeeklyUsage(0);
      setDailyUsage(0);
      setTotalUsage(0);
      setWeeklyData([]);
      setContentData([]);
      setTopContent([]);
      
      toast({
        title: "데이터 로딩 실패",
        description: "데이터를 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [selectedWeek, toast]);

  const handleRefresh = useCallback(() => {
    console.log('Manual refresh triggered');
    loadDashboardData(true);
  }, [loadDashboardData]);

  useEffect(() => {
    console.log('Dashboard data load triggered', { selectedWeek });
    loadDashboardData();
    
    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadDashboardData]);

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
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousWeek}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {formatWeek(selectedWeek)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
                <p className="text-2xl font-bold">{weeklyUsage}</p>
                <p className="text-sm text-muted-foreground">
                  주간 이용 횟수 ({formatWeek(selectedWeek)})
                </p>
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
                <p className="text-2xl font-bold">{totalUsage}</p>
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
            <CardTitle>일별 이용 횟수 (선택된 주)</CardTitle>
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
            <CardTitle>콘텐츠별 재생 횟수 (선택된 주)</CardTitle>
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
            콘텐츠 TOP3 (선택된 주)
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