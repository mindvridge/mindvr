# Unity VR API 문서 (한국어)

## 개요

Unity VR 애플리케이션을 위한 완전한 로깅 및 사용자 관리 API입니다. 
모든 시간은 **한국 표준시(KST)**로 처리되며, VR 기기 로깅과 사용자 기반 콘텐츠 로깅을 통합적으로 지원합니다.

**API 엔드포인트**: `https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api`

---

## 🔥 주요 특징

- ✅ **사용자 관리**: 등록, 로그인, 로그아웃
- ✅ **VR 기기 로깅**: 기기 기반 사용 기록
- ✅ **콘텐츠 로깅**: 사용자 기반 콘텐츠 사용 기록  
- ✅ **통합 데이터베이스**: 모든 로그를 `vr_usage_logs` 테이블에 저장
- ✅ **한국 시간대 지원**: 모든 시간 데이터를 KST로 처리
- ✅ **실시간 조회**: GET 요청으로 로그 데이터 조회
- ✅ **자동 사용자 생성**: 존재하지 않는 사용자 자동 생성

---

## 📊 데이터베이스 구조

### 통합 로깅 시스템

모든 로그는 `vr_usage_logs` 테이블에 저장되며, `device_id` 필드로 구분됩니다:

| 로그 타입 | device_id | 설명 |
|----------|-----------|------|
| VR 기기 로그 | `VR_DEVICE_001` 등 | 실제 VR 기기 ID |
| 콘텐츠 로그 | `CONTENT_DEVICE` | 고정값, 사용자 기반 콘텐츠 로깅 |

### 테이블 스키마

#### `vr_usage_logs`
```sql
- id: UUID (Primary Key)
- device_id: TEXT (기기 ID 또는 'CONTENT_DEVICE')  
- user_id: UUID (사용자 ID, 선택사항)
- content_name: TEXT (콘텐츠 이름)
- start_time: TIMESTAMP (시작 시간, KST)
- end_time: TIMESTAMP (종료 시간, KST, 선택사항)
- duration_minutes: INTEGER (사용 시간, 자동 계산)
- created_at: TIMESTAMP (생성 시간)
- updated_at: TIMESTAMP (수정 시간)
```

#### `users`
```sql
- id: UUID (Primary Key)
- username: TEXT (사용자명, Unique)
- password_hash: TEXT (비밀번호 해시)
- created_at: TIMESTAMP (생성 시간)
- updated_at: TIMESTAMP (수정 시간)
```

#### `user_sessions`
```sql
- id: UUID (Primary Key)
- user_id: UUID (사용자 ID)
- login_time: TIMESTAMP (로그인 시간, KST)
- logout_time: TIMESTAMP (로그아웃 시간, KST, 선택사항)
- created_at: TIMESTAMP (생성 시간)
```

---

## 📡 API 엔드포인트

### 1. POST 요청 (데이터 생성/수정)

모든 POST 요청은 다음 형식을 사용합니다:

```http
POST /functions/v1/vr-log-api
Content-Type: application/json
```

#### 1.1 사용자 등록

**요청:**
```json
{
  "action": "register",
  "username": "사용자명"
}
```

**응답 성공:**
```json
{
  "success": true,
  "message": "사용자가 성공적으로 등록되었습니다.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "사용자명",
    "created_at": "2025-09-15T19:00:00+09:00",
    "updated_at": "2025-09-15T19:00:00+09:00"
  }
}
```

**응답 실패:**
```json
{
  "success": false,
  "error": "이미 존재하는 사용자입니다."
}
```

#### 1.2 사용자 로그인

**요청:**
```json
{
  "action": "login", 
  "username": "사용자명"
}
```

**응답 성공:**
```json
{
  "success": true,
  "message": "로그인되었습니다.",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "사용자명",
      "created_at": "2025-09-15T19:00:00+09:00",
      "updated_at": "2025-09-15T19:00:00+09:00"
    },
    "session": {
      "id": "660e8400-e29b-41d4-a716-446655440000", 
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "login_time": "2025-09-15T19:05:00+09:00"
    }
  }
}
```

#### 1.3 사용자 로그아웃

**요청:**
```json
{
  "action": "logout",
  "session_id": "660e8400-e29b-41d4-a716-446655440000"
}
```

**응답:**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

#### 1.4 VR 로그 기록 (기기 기반)

**요청:**
```json
{
  "action": "vr_log",
  "device_id": "VR_DEVICE_001",
  "content_name": "VR Racing Game",
  "start_time": "2025-09-15T19:00:00Z",
  "end_time": "2025-09-15T19:30:00Z",
  "username": "사용자명"  // 선택사항
}
```

**특징:**
- `device_id`: 실제 VR 기기의 고유 ID
- `username`: 선택사항 - 제공하면 해당 사용자와 연결, 없으면 자동 생성
- `end_time`: 선택사항 - 세션 시작시에는 생략, 종료시에는 포함

#### 1.5 콘텐츠 로그 기록 (사용자 기반)

**요청:**
```json
{
  "action": "content_log",
  "username": "사용자명",
  "content_name": "Educational VR Content", 
  "start_time": "2025-09-15T19:00:00Z",
  "end_time": "2025-09-15T19:45:00Z"
}
```

**특징:**
- 자동으로 `device_id`가 `'CONTENT_DEVICE'`로 설정됨
- `username`은 필수 - 존재하지 않으면 자동으로 새 사용자 생성
- 사용자 기반 콘텐츠 사용 추적에 사용

### 2. GET 요청 (데이터 조회)

#### 2.1 VR 로그 조회

```http
GET /functions/v1/vr-log-api?type=vr_logs&username=사용자명&device_id=VR_DEVICE_001&limit=100
```

**파라미터:**
- `type=vr_logs` (필수)
- `username` (선택사항): 특정 사용자의 로그만 조회
- `device_id` (선택사항): 특정 기기의 로그만 조회  
- `limit` (선택사항): 조회할 최대 레코드 수 (기본값: 100, 최대: 1000)

#### 2.2 콘텐츠 로그 조회

```http
GET /functions/v1/vr-log-api?type=content_logs&username=사용자명&limit=100
```

**파라미터:**
- `type=content_logs` (필수)
- `username` (선택사항): 특정 사용자의 콘텐츠 로그만 조회
- `limit` (선택사항): 조회할 최대 레코드 수

**참고:** `content_logs` 타입으로 조회하면 `device_id='CONTENT_DEVICE'`인 로그만 반환됩니다.

#### 2.3 사용자 세션 조회

```http
GET /functions/v1/vr-log-api?type=user_sessions&username=사용자명&limit=100
```

**파라미터:**
- `type=user_sessions` (필수)
- `username` (선택사항): 특정 사용자의 세션만 조회
- `limit` (선택사항): 조회할 최대 레코드 수

#### GET 응답 예시

```json
{
  "success": true,
  "message": "VR 로그를 성공적으로 조회했습니다.",
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "device_id": "VR_DEVICE_001", 
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "content_name": "VR Racing Game",
      "start_time": "2025-09-15T19:00:00+09:00",
      "end_time": "2025-09-15T19:30:00+09:00", 
      "duration_minutes": 30,
      "created_at": "2025-09-15T19:00:00+09:00",
      "updated_at": "2025-09-15T19:30:00+09:00",
      "users": {
        "username": "사용자명"
      }
    }
  ]
}
```

---

## 🛠 Unity 구현 가이드

### VRApiManager.cs 핵심 메서드

```csharp
public class VRApiManager : MonoBehaviour 
{
    // 통합 세션 관리
    public void StartUnifiedSession(string contentName)
    {
        StartVRSession(contentName);      // 기기 기반 로깅
        StartContentSession(contentName); // 사용자 기반 로깅  
    }
    
    public void EndUnifiedSession(string contentName)
    {
        EndVRSession(contentName);        // 기기 세션 종료
        EndContentSession(contentName);   // 콘텐츠 세션 종료
    }
    
    // VR 기기 로깅 (device_id = 실제 기기 ID)
    public void StartVRSession(string contentName) { /* ... */ }
    public void EndVRSession(string contentName) { /* ... */ }
    
    // 콘텐츠 로깅 (device_id = 'CONTENT_DEVICE')  
    public void StartContentSession(string contentName) { /* ... */ }
    public void EndContentSession(string contentName) { /* ... */ }
    
    // 사용자 관리
    public IEnumerator RegisterUser(string username) { /* ... */ }
    public IEnumerator LoginUser(string username) { /* ... */ }
    public IEnumerator LogoutUser() { /* ... */ }
}
```

### 기본 사용법

```csharp
public class GameController : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    public void StartGame(string gameName)
    {
        // VR 기기 로깅 + 콘텐츠 로깅 동시 시작
        apiManager.StartUnifiedSession(gameName);
    }
    
    public void EndGame(string gameName) 
    {
        // 모든 로깅 동시 종료
        apiManager.EndUnifiedSession(gameName);
    }
}
```

---

## 🔍 실제 사용 시나리오

### 시나리오 1: VR 체험관 운영

```csharp
// 사용자가 VR 기기에 접근
apiManager.StartVRSession("Space Exploration");

// 사용자 로그인 후 개인화된 콘텐츠 시작
StartCoroutine(apiManager.LoginUser("user123"));
apiManager.StartContentSession("Space Exploration");

// 체험 종료
apiManager.EndUnifiedSession("Space Exploration");
StartCoroutine(apiManager.LogoutUser());
```

### 시나리오 2: 교육 콘텐츠

```csharp  
// 학생 로그인
StartCoroutine(apiManager.LoginUser("student_kim"));

// 수업별 콘텐츠 추적
apiManager.StartContentSession("Biology - Cell Structure");
// ... 학습 진행 ...
apiManager.EndContentSession("Biology - Cell Structure");

apiManager.StartContentSession("Biology - DNA Analysis"); 
// ... 학습 진행 ...
apiManager.EndContentSession("Biology - DNA Analysis");
```

### 시나리오 3: 기기별 사용량 추적

```csharp
// 여러 기기에서 동일 콘텐츠 사용량 추적
// 기기 A
apiManager.deviceId = "VR_DEVICE_A";
apiManager.StartVRSession("Popular Game");

// 기기 B  
apiManager.deviceId = "VR_DEVICE_B";
apiManager.StartVRSession("Popular Game");

// 나중에 데이터 분석에서 기기별 사용량 비교 가능
```

---

## 📈 데이터 분석 및 활용

### 1. 인기 콘텐츠 분석

```sql
-- 가장 많이 사용된 콘텐츠 TOP 10
SELECT 
    content_name,
    COUNT(*) as usage_count,
    AVG(duration_minutes) as avg_duration
FROM vr_usage_logs 
WHERE duration_minutes IS NOT NULL
GROUP BY content_name
ORDER BY usage_count DESC
LIMIT 10;
```

### 2. 기기 사용률 분석

```sql
-- VR 기기별 사용 현황
SELECT 
    device_id,
    COUNT(*) as session_count,
    SUM(duration_minutes) as total_minutes
FROM vr_usage_logs  
WHERE device_id != 'CONTENT_DEVICE'
GROUP BY device_id
ORDER BY total_minutes DESC;
```

### 3. 사용자별 학습 시간

```sql
-- 사용자별 콘텐츠 학습 시간 (콘텐츠 로그만)
SELECT 
    u.username,
    COUNT(*) as content_sessions,
    SUM(v.duration_minutes) as total_learning_minutes
FROM vr_usage_logs v
JOIN users u ON v.user_id = u.id  
WHERE v.device_id = 'CONTENT_DEVICE'
AND v.duration_minutes IS NOT NULL
GROUP BY u.username, u.id
ORDER BY total_learning_minutes DESC;
```

---

## ⚠️ 오류 처리 및 디버깅

### 일반적인 오류 코드

| 오류 | HTTP 상태 | 설명 | 해결책 |
|------|-----------|------|--------|
| `유효하지 않은 action입니다` | 400 | 잘못된 action 값 | action 필드 확인 |
| `username은 필수입니다` | 400 | 필수 필드 누락 | 요청 데이터 구조 확인 |
| `사용자를 찾을 수 없습니다` | 404 | 존재하지 않는 사용자 | 자동 등록 또는 올바른 사용자명 입력 |
| `이미 존재하는 사용자입니다` | 500 | 중복 사용자명 | 다른 사용자명 사용 |
| `서버 내부 오류가 발생했습니다` | 500 | 서버 오류 | 요청 재시도 또는 관리자 문의 |

### Unity 디버그 로그 활용

```csharp
// 디버그 모드 활성화
apiManager.enableDebugLogs = true;

// 로그 예시:
// [VR API Manager] 2025-09-15 19:00:00 KST - VR API Manager 초기화 완료 - Device: VR_DEVICE_001
// [VR API Manager] 2025-09-15 19:01:00 KST - API 요청 전송: {"action":"vr_log","device_id":"VR_DEVICE_001",...}
// [VR API Manager] 2025-09-15 19:01:01 KST - API 응답 받음: {"success":true,"message":"VR 로그가 성공적으로 저장되었습니다.",...}
```

---

## 🔐 보안 및 권한

### API 접근 권한

- **공개 API**: 인증 없이 사용 가능
- **CORS 지원**: 웹 브라우저에서 직접 호출 가능
- **Rate Limiting**: 과도한 요청 방지를 위한 제한 (구현 예정)

### 데이터 보안

- **비밀번호**: SHA-256 해시로 저장
- **세션 관리**: UUID 기반 세션 토큰
- **RLS (Row Level Security)**: 사용자별 데이터 접근 제어

---

## 🚀 확장 기능 (향후 계획)

### 1. 실시간 알림
- WebSocket을 통한 실시간 사용 현황 알림
- 기기 상태 모니터링

### 2. 고급 분석
- 머신러닝 기반 사용 패턴 분석  
- 개인화된 콘텐츠 추천

### 3. 배치 처리
- 대량 로그 데이터 일괄 업로드
- 오프라인 모드 지원

---

## 📞 지원 및 문의

- **개발자 문서**: 이 문서의 최신 버전
- **샘플 코드**: Unity 프로젝트에 포함된 예제
- **이슈 리포팅**: API 관련 문제 및 개선 사항 제안

---

**버전**: 2.0.0  
**최종 업데이트**: 2025-09-15  
**한국 시간대 지원**: ✅  
**통합 데이터베이스**: ✅