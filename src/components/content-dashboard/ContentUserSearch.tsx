import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw } from 'lucide-react';

interface ContentUserSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export const ContentUserSearch = ({
  searchQuery,
  onSearchChange,
  selectedMonth,
  onMonthChange,
  onSearch,
  onReset,
}: ContentUserSearchProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>검색 및 필터</CardTitle>
        <CardDescription>
          사용자명으로 검색하거나 월별로 필터링할 수 있습니다. (한국시간 기준)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search">사용자 검색</Label>
            <Input
              id="search"
              type="text"
              placeholder="사용자명을 입력하세요 (빈칸시 전체 조회)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <Label htmlFor="month">월별 필터</Label>
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
            />
          </div>
          
          <div className="flex items-end gap-2">
            <Button onClick={onSearch} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              검색
            </Button>
            <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              초기화
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};