import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VRDeviceSearchProps {
  onSearch: (query: string) => void;
  currentQuery: string;
  loading: boolean;
}

export const VRDeviceSearch = ({ onSearch, currentQuery, loading }: VRDeviceSearchProps) => {
  const [searchInput, setSearchInput] = useState(currentQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleClear = () => {
    setSearchInput('');
    onSearch('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>기기 검색</CardTitle>
        <CardDescription>
          기기 ID로 로그를 검색하여 특정 기기의 사용 기록을 조회할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="기기 ID를 입력하세요 (예: VR-001)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? '검색 중...' : '검색'}
          </Button>
          {currentQuery && (
            <Button type="button" variant="outline" size="icon" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
        {currentQuery && (
          <div className="mt-3 text-sm text-muted-foreground">
            현재 검색: <span className="font-medium text-foreground">"{currentQuery}"</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};