import { useState } from 'react';
import { Search, X, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VRDeviceSearchProps {
  onSearch: (query: string, month?: string) => void;
  currentQuery: string;
  currentMonth: string;
  loading: boolean;
}

export const VRDeviceSearch = ({ onSearch, currentQuery, currentMonth, loading }: VRDeviceSearchProps) => {
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [monthInput, setMonthInput] = useState(currentMonth);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput, monthInput);
  };

  const handleClear = () => {
    setSearchInput('');
    setMonthInput('');
    onSearch('', '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>검색 및 필터</CardTitle>
        <CardDescription>
          기기 ID로 검색하거나 월별로 필터링하여 VR 사용 로그를 조회할 수 있습니다. 빈칸으로 검색시 전체 로그를 조회합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="기기 ID를 입력하세요 (예: VR-001) - 빈칸시 전체 조회"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="month"
                placeholder="월 선택"
                value={monthInput}
                onChange={(e) => setMonthInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? '검색 중...' : '검색'}
            </Button>
            {(currentQuery || currentMonth) && (
              <Button type="button" variant="outline" size="icon" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
        {(currentQuery || currentMonth) && (
          <div className="mt-3 text-sm text-muted-foreground space-y-1">
            {currentQuery && (
              <div>기기 검색: <span className="font-medium text-foreground">"{currentQuery}"</span></div>
            )}
            {currentMonth && (
              <div>월별 필터: <span className="font-medium text-foreground">{currentMonth}</span></div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};