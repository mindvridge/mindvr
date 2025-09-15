import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Copy, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiEndpoint {
  name: string;
  method: string;
  action: string;
  description: string;
  parameters: Record<string, string>;
  example: any;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    name: "사용자 등록",
    method: "POST",
    action: "register",
    description: "새로운 사용자를 등록합니다",
    parameters: {
      username: "사용자명 (필수)",
      password: "비밀번호 (필수)"
    },
    example: {
      action: "register",
      username: "testuser",
      password: "testpass123"
    }
  },
  {
    name: "사용자 로그인",
    method: "POST", 
    action: "login",
    description: "사용자 로그인을 수행합니다",
    parameters: {
      username: "사용자명 (필수)",
      password: "비밀번호 (필수)"
    },
    example: {
      action: "login",
      username: "testuser", 
      password: "testpass123"
    }
  },
  {
    name: "사용자 로그아웃",
    method: "POST",
    action: "logout", 
    description: "사용자 세션을 종료합니다",
    parameters: {
      session_id: "세션 ID (필수)"
    },
    example: {
      action: "logout",
      session_id: "uuid-session-id"
    }
  },
  {
    name: "VR 로그 기록",
    method: "POST",
    action: "vr_log",
    description: "VR 사용 로그를 기록합니다",
    parameters: {
      device_id: "디바이스 ID (필수)",
      content_name: "콘텐츠 이름 (필수)",
      start_time: "시작 시간 (필수)",
      end_time: "종료 시간 (선택)",
      username: "사용자명 (선택)"
    },
    example: {
      action: "vr_log",
      device_id: "VR_DEVICE_001",
      content_name: "VR Racing Game",
      start_time: "2025-09-15T10:00:00Z",
      end_time: "2025-09-15T10:30:00Z",
      username: "testuser"
    }
  },
  {
    name: "콘텐츠 로그 기록", 
    method: "POST",
    action: "content_log",
    description: "콘텐츠 사용 로그를 기록합니다",
    parameters: {
      user_id: "사용자 ID (필수)",
      content_name: "콘텐츠 이름 (필수)", 
      start_time: "시작 시간 (필수)",
      end_time: "종료 시간 (선택)"
    },
    example: {
      action: "content_log",
      user_id: "uuid-user-id",
      content_name: "Educational VR Content",
      start_time: "2024-01-15T10:00:00Z",
      end_time: "2024-01-15T10:45:00Z"
    }
  }
];

const QUERY_ENDPOINTS = [
  {
    name: "VR 로그 조회",
    method: "GET",
    description: "VR 사용 로그를 조회합니다",
    params: "?type=vr_logs&username=사용자명&device_id=디바이스ID",
    example: "?type=vr_logs&username=testuser&device_id=VR_DEVICE_001"
  },
  {
    name: "콘텐츠 로그 조회", 
    method: "GET",
    description: "콘텐츠 사용 로그를 조회합니다",
    params: "?type=content_logs&username=사용자명",
    example: "?type=content_logs&username=testuser"
  },
  {
    name: "사용자 세션 조회",
    method: "GET", 
    description: "사용자 세션 정보를 조회합니다",
    params: "?type=user_sessions&username=사용자명",
    example: "?type=user_sessions&username=testuser"
  }
];

export const ApiTestPanel = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [requestData, setRequestData] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryParams, setQueryParams] = useState('');
  const { toast } = useToast();

  const handleEndpointChange = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestData(JSON.stringify(endpoint.example, null, 2));
    setResponse('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사 완료",
      description: "클립보드에 복사되었습니다."
    });
  };

  const testPostEndpoint = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const data = JSON.parse(requestData);
      
      const { data: result, error } = await supabase.functions.invoke('vr-log-api', {
        body: data
      });

      if (error) {
        setResponse(JSON.stringify({ error: error.message }, null, 2));
      } else {
        setResponse(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      setResponse(JSON.stringify({ 
        error: "요청 실패", 
        details: error instanceof Error ? error.message : "알 수 없는 오류" 
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const testGetEndpoint = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const url = `vr-log-api${queryParams}`;
      
      const { data: result, error } = await supabase.functions.invoke(url.split('?')[0], {
        method: 'GET'
      });

      if (error) {
        setResponse(JSON.stringify({ error: error.message }, null, 2));
      } else {
        setResponse(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      setResponse(JSON.stringify({ 
        error: "요청 실패", 
        details: error instanceof Error ? error.message : "알 수 없는 오류" 
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Unity VR API 테스트
          </CardTitle>
          <CardDescription>
            Unity VR 애플리케이션에서 사용하는 API 엔드포인트를 테스트할 수 있습니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="post" className="space-y-4">
        <TabsList>
          <TabsTrigger value="post">POST 요청 테스트</TabsTrigger>
          <TabsTrigger value="get">GET 요청 테스트</TabsTrigger>
          <TabsTrigger value="docs">API 문서</TabsTrigger>
        </TabsList>

        <TabsContent value="post" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">POST 엔드포인트 테스트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="endpoint-select">테스트할 엔드포인트 선택</Label>
                <Select onValueChange={(value) => {
                  const endpoint = API_ENDPOINTS.find(e => e.action === value);
                  if (endpoint) handleEndpointChange(endpoint);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="엔드포인트를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {API_ENDPOINTS.map((endpoint) => (
                      <SelectItem key={endpoint.action} value={endpoint.action}>
                        {endpoint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>요청 데이터 (JSON)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(requestData)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    복사
                  </Button>
                </div>
                <Textarea
                  value={requestData}
                  onChange={(e) => setRequestData(e.target.value)}
                  placeholder="JSON 요청 데이터를 입력하세요"
                  className="min-h-[200px] font-mono"
                />
              </div>

              <Button 
                onClick={testPostEndpoint} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "요청 중..." : "API 테스트 실행"}
              </Button>

              {response && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>응답 결과</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(response)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      복사
                    </Button>
                  </div>
                  <Textarea
                    value={response}
                    readOnly
                    className="min-h-[200px] font-mono bg-muted"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="get" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GET 엔드포인트 테스트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="query-params">쿼리 파라미터</Label>
                <Input
                  id="query-params"
                  value={queryParams}
                  onChange={(e) => setQueryParams(e.target.value)}
                  placeholder="?type=vr_logs&username=testuser"
                />
              </div>

              <div className="space-y-2">
                <Label>사용 가능한 쿼리 예시:</Label>
                {QUERY_ENDPOINTS.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <Badge variant="outline">{endpoint.method}</Badge>
                      <span className="ml-2 text-sm">{endpoint.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQueryParams(endpoint.example)}
                    >
                      사용
                    </Button>
                  </div>
                ))}
              </div>

              <Button 
                onClick={testGetEndpoint} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "요청 중..." : "GET 요청 테스트"}
              </Button>

              {response && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>응답 결과</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(response)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      복사
                    </Button>
                  </div>
                  <Textarea
                    value={response}
                    readOnly
                    className="min-h-[200px] font-mono bg-muted"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unity VR API 문서</CardTitle>
              <CardDescription>
                Unity에서 VR 로그 API를 사용하는 방법에 대한 상세 가이드
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>API 베이스 URL:</strong> /functions/v1/vr-log-api</p>
                  <p><strong>Content-Type:</strong> application/json</p>
                  <p><strong>인증:</strong> 필요 없음 (공개 API)</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">POST 엔드포인트</h3>
                <div className="space-y-4">
                  {API_ENDPOINTS.map((endpoint, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{endpoint.name}</CardTitle>
                          <Badge>{endpoint.method}</Badge>
                        </div>
                        <CardDescription>{endpoint.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">파라미터:</Label>
                          <div className="mt-1 space-y-1">
                            {Object.entries(endpoint.parameters).map(([key, desc]) => (
                              <div key={key} className="text-sm">
                                <code className="bg-muted px-1 rounded">{key}</code>: {desc}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">예시 요청:</Label>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(endpoint.example, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">GET 엔드포인트</h3>
                <div className="space-y-4">
                  {QUERY_ENDPOINTS.map((endpoint, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{endpoint.name}</CardTitle>
                          <Badge variant="secondary">{endpoint.method}</Badge>
                        </div>
                        <CardDescription>{endpoint.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label className="text-sm font-medium">사용법:</Label>
                          <code className="block mt-1 text-xs bg-muted p-2 rounded">
                            /functions/v1/vr-log-api{endpoint.example}
                          </code>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Unity 연동 가이드</h3>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-2">Unity에서 API 사용하기:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>VRApiManager.cs 스크립트를 Unity 프로젝트에 추가</li>
                        <li>GameObject에 VRApiManager 컴포넌트 연결</li>
                        <li>Inspector에서 API URL 설정</li>
                        <li>StartUnifiedSession() 및 EndUnifiedSession() 메소드 사용</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};