# Unity VR API 완전 통합 가이드 v2.0

## 📋 개요

Unity VR 애플리케이션을 위한 완전한 통합 API 시스템입니다. 사용자 관리, VR 기기 로깅, 콘텐츠 추적, 데이터 분석을 통합적으로 지원합니다.

**API 엔드포인트**: `https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api`

---

## 🎯 핵심 특징

### ✅ 완전 통합된 기능
- **사용자 관리**: 자동 등록/로그인, 세션 관리
- **VR 기기 로깅**: 기기별 사용 추적
- **콘텐츠 로깅**: 사용자별 콘텐츠 사용 추적  
- **콘텐츠 데이터베이스**: 서버 기반 콘텐츠 관리
- **실시간 모니터링**: 활성 세션 추적
- **한국 시간대 지원**: KST 기반 시간 처리

### ✅ 사용 편의성
- **원클릭 통합 세션**: `StartUnifiedSession()` 하나로 모든 로깅 시작
- **자동 사용자 관리**: 존재하지 않는 사용자 자동 생성
- **스마트 재시도**: 네트워크 오류 시 자동 재시도
- **캐싱 시스템**: 콘텐츠 데이터 자동 캐싱
- **이벤트 시스템**: 상태 변화를 위한 이벤트 제공

---

## 🚀 빠른 시작

### 1단계: 파일 추가
프로젝트에 다음 C# 파일들을 추가하세요:
- `VRApiManager.cs` - 메인 API 관리자
- `VRApiTypes.cs` - 데이터 타입 정의
- `VRApiExamples.cs` - 사용 예시 (선택사항)

### 2단계: 씬 설정
1. 빈 GameObject 생성
2. `VRApiManager` 컴포넌트 추가
3. Inspector에서 설정 조정:
   - **Device ID**: VR 기기 고유 ID (예: "VR_DEVICE_001")
   - **Default Username**: 기본 사용자명 (예: "VRUser")
   - **Auto Initialize User**: 자동 사용자 초기화 활성화

### 3단계: 기본 사용
```csharp
public class MyVRGame : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    public void StartGame()
    {
        // 🎯 이것만 하면 모든 로깅이 시작됩니다!
        apiManager.StartUnifiedSession("My VR Game");
    }
    
    public void EndGame()
    {
        // 🎯 이것만 하면 모든 로깅이 종료됩니다!
        apiManager.EndUnifiedSession("My VR Game");
    }
}
```

---

## 📊 데이터베이스 구조

### 통합 로깅 시스템
모든 로그는 `vr_usage_logs` 테이블에 저장되며, `device_id`로 구분됩니다:

| 로그 타입 | device_id | 설명 |
|----------|-----------|------|
| **VR 기기 로그** | `VR_DEVICE_001` 등 | 실제 VR 기기 ID |
| **콘텐츠 로그** | `CONTENT_DEVICE` | 사용자 기반 콘텐츠 로깅 |

### 주요 테이블

#### `vr_usage_logs` - 통합 로그 테이블
```sql
- id: UUID (기본키)
- device_id: TEXT (기기 ID 또는 'CONTENT_DEVICE')  
- user_id: UUID (사용자 ID, 선택사항)
- content_name: TEXT (콘텐츠 이름)
- start_time: TIMESTAMP (시작 시간, KST)
- end_time: TIMESTAMP (종료 시간, KST, 선택사항)
- duration_minutes: INTEGER (사용 시간, 자동 계산)
- created_at: TIMESTAMP (생성 시간)
- updated_at: TIMESTAMP (수정 시간)
```

#### `content_data` - 콘텐츠 정보
```sql
- id: UUID (기본키)
- content_name: TEXT (콘텐츠 이름)
- content_filename: TEXT (파일명)
- description: TEXT (설명)
- file_size: BIGINT (파일 크기)
- file_type: TEXT (파일 타입)
- created_at: TIMESTAMP (생성 시간)
- updated_at: TIMESTAMP (수정 시간)
```

---

## 🎮 사용 시나리오별 가이드

### 시나리오 1: 간단한 VR 게임
```csharp
public class SimpleVRGame : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
        
        // 이벤트 구독 (선택사항)
        apiManager.OnSessionStarted += (session) => Debug.Log($"세션 시작: {session}");
        apiManager.OnSessionEnded += (session, duration) => 
            Debug.Log($"세션 종료: {session}, 시간: {duration:F1}분");
    }
    
    public void StartGame()
    {
        apiManager.StartUnifiedSession("VR Racing Game");
    }
    
    public void EndGame()
    {
        apiManager.EndUnifiedSession("VR Racing Game");
    }
}
```

### 시나리오 2: 교육용 VR 애플리케이션
```csharp
public class EducationalVR : MonoBehaviour
{
    private VRApiManager apiManager;
    private string[] lessons = {
        "Biology - Cell Structure",
        "Biology - DNA Analysis", 
        "Biology - Photosynthesis"
    };
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    // 학생 로그인
    public void LoginStudent(string studentName)
    {
        StartCoroutine(apiManager.LoginUser(studentName));
    }
    
    // 수업 시작
    public void StartLesson(int lessonIndex)
    {
        if (lessonIndex >= 0 && lessonIndex < lessons.Length)
        {
            apiManager.StartContentSession(lessons[lessonIndex]);
        }
    }
    
    // 수업 종료
    public void EndLesson(int lessonIndex)
    {
        if (lessonIndex >= 0 && lessonIndex < lessons.Length)
        {
            apiManager.EndContentSession(lessons[lessonIndex]);
        }
    }
}
```

### 시나리오 3: VR 체험관 운영
```csharp
public class ExperienceCenter : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    // 고객 체크인
    public void CheckInCustomer(string customerName)
    {
        StartCoroutine(apiManager.LoginUser(customerName));
    }
    
    // VR 체험 시작
    public void StartExperience(string experienceName)
    {
        apiManager.StartUnifiedSession(experienceName);
    }
    
    // VR 체험 종료
    public void EndExperience(string experienceName)
    {
        apiManager.EndUnifiedSession(experienceName);
    }
    
    // 고객 체크아웃
    public void CheckOutCustomer()
    {
        apiManager.EndAllActiveSessions();
        StartCoroutine(apiManager.LogoutUser());
    }
}
```

---

## 🛠 고급 기능

### 콘텐츠 데이터 관리
```csharp
public class ContentManager : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
        apiManager.OnContentDataLoaded += OnContentLoaded;
        
        // 콘텐츠 목록 로드
        apiManager.GetContentDataList(50);
    }
    
    private void OnContentLoaded(ContentData[] contents)
    {
        Debug.Log($"콘텐츠 {contents.Length}개 로드됨");
        
        foreach (var content in contents)
        {
            Debug.Log($"- {content.content_name}: {content.GetFormattedFileSize()}");
        }
    }
    
    // 콘텐츠 검색
    public void FindContent(string contentName)
    {
        ContentData content = apiManager.FindContentByName(contentName);
        
        if (content != null)
        {
            Debug.Log($"콘텐츠 발견: {content.content_name}");
            // 해당 콘텐츠로 세션 시작
            apiManager.StartUnifiedSession(content.content_name);
        }
    }
}
```

### 사용자 전환
```csharp
public class UserManager : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    public void SwitchToNewUser(string newUsername)
    {
        StartCoroutine(apiManager.SwitchUser(newUsername));
    }
    
    public void LogoutCurrentUser()
    {
        StartCoroutine(apiManager.LogoutUser());
    }
}
```

### 실시간 모니터링
```csharp
public class SessionMonitor : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    void Update()
    {
        // 활성 세션 개수 표시
        int sessionCount = apiManager.GetActiveSessionCount();
        
        // 특정 콘텐츠의 활성 상태 확인
        bool isGameActive = apiManager.IsSessionActive("VR Racing Game");
        
        // VR 세션 정보 확인
        var vrSessions = apiManager.ActiveVRSessions;
        foreach (var session in vrSessions)
        {
            string contentName = session.Key;
            double elapsedMinutes = session.Value.GetCurrentDurationMinutes();
            // UI 업데이트 등...
        }
    }
}
```

---

## 📈 데이터 분석 쿼리 예시

### 인기 콘텐츠 분석
```sql
-- 가장 많이 사용된 콘텐츠 TOP 10
SELECT 
    content_name,
    COUNT(*) as usage_count,
    AVG(duration_minutes) as avg_duration_minutes,
    SUM(duration_minutes) as total_minutes
FROM vr_usage_logs 
WHERE duration_minutes IS NOT NULL
    AND start_time >= NOW() - INTERVAL '30 days'
GROUP BY content_name
ORDER BY usage_count DESC
LIMIT 10;
```

### 기기 사용률 분석
```sql
-- VR 기기별 사용 통계
SELECT 
    device_id,
    COUNT(*) as session_count,
    SUM(duration_minutes) as total_minutes,
    AVG(duration_minutes) as avg_session_minutes,
    MAX(start_time) as last_used
FROM vr_usage_logs  
WHERE device_id != 'CONTENT_DEVICE'
    AND start_time >= NOW() - INTERVAL '7 days'
GROUP BY device_id
ORDER BY total_minutes DESC;
```

### 사용자 학습 분석
```sql
-- 사용자별 콘텐츠 학습 시간 (교육용)
SELECT 
    u.username,
    COUNT(*) as content_sessions,
    SUM(v.duration_minutes) as total_learning_minutes,
    COUNT(DISTINCT v.content_name) as unique_contents,
    MAX(v.start_time) as last_session
FROM vr_usage_logs v
JOIN users u ON v.user_id = u.id  
WHERE v.device_id = 'CONTENT_DEVICE'
    AND v.duration_minutes IS NOT NULL
    AND v.start_time >= NOW() - INTERVAL '30 days'
GROUP BY u.username, u.id
ORDER BY total_learning_minutes DESC;
```

---

## ⚙️ 설정 및 커스터마이징

### VRApiManager Inspector 설정

#### 기기 설정
- **Device Id**: VR 기기 고유 식별자 (예: "VR_DEVICE_HEAD01")
- **Auto Generate Device Id**: 시스템 고유 ID로 자동 생성

#### 사용자 설정  
- **Default Username**: 기본 사용자명 접두사
- **Auto Initialize User**: 시작시 자동 사용자 초기화

#### 네트워크 설정
- **Timeout Seconds**: API 요청 타임아웃 (기본: 30초)
- **Max Retry Attempts**: 실패시 재시도 횟수 (기본: 3회)

#### 디버그 설정
- **Enable Debug Logs**: 기본 디버그 로그 활성화
- **Enable Detailed Logs**: API 요청/응답 상세 로그

### 고급 설정 스크립트
```csharp
public class VRApiConfiguration : MonoBehaviour
{
    [Header("=== 고급 설정 ===")]
    public VRApiSettings settings;
    
    void Start()
    {
        var apiManager = FindObjectOfType<VRApiManager>();
        if (apiManager != null)
        {
            // 설정 적용 예시
            apiManager.timeoutSeconds = settings.timeoutSeconds;
            apiManager.enableDebugLogs = settings.enableDebugLogs;
            // ... 기타 설정
        }
    }
}
```

---

## 🔧 문제 해결

### 일반적인 오류와 해결책

#### 1. "VRApiManager를 찾을 수 없습니다"
```csharp
// 해결 방법 1: 자동 생성
VRApiManager apiManager = FindObjectOfType<VRApiManager>();
if (apiManager == null)
{
    GameObject apiManagerObject = new GameObject("VRApiManager");
    apiManager = apiManagerObject.AddComponent<VRApiManager>();
}

// 해결 방법 2: 싱글톤 패턴 사용
public class VRApiManager : MonoBehaviour
{
    public static VRApiManager Instance { get; private set; }
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }
}
```

#### 2. "로그인되지 않은 상태에서는 콘텐츠 로깅이 불가능합니다"
```csharp
public void StartContentWithAutoLogin(string contentName)
{
    if (!apiManager.IsLoggedIn)
    {
        // 자동 로그인 후 콘텐츠 시작
        StartCoroutine(LoginAndStartContent(contentName));
    }
    else
    {
        apiManager.StartContentSession(contentName);
    }
}

private IEnumerator LoginAndStartContent(string contentName)
{
    yield return apiManager.LoginUser("AutoUser_" + System.DateTime.Now.Ticks);
    apiManager.StartContentSession(contentName);
}
```

#### 3. 네트워크 연결 문제
```csharp
public class NetworkChecker : MonoBehaviour
{
    void Start()
    {
        StartCoroutine(CheckNetworkPeriodically());
    }
    
    private IEnumerator CheckNetworkPeriodically()
    {
        while (true)
        {
            if (Application.internetReachability == NetworkReachability.NotReachable)
            {
                Debug.LogWarning("네트워크 연결이 없습니다. 오프라인 모드로 전환합니다.");
                // 오프라인 모드 처리
            }
            
            yield return new WaitForSeconds(10f);
        }
    }
}
```

### 디버그 로그 활용
```csharp
// Inspector에서 디버그 로그 활성화
apiManager.enableDebugLogs = true;
apiManager.enableDetailedLogs = true; // API 상세 로그

// 로그 예시:
// [VR API Manager] 2025-09-17 14:30:00 - VR API Manager 초기화 완료 - Device: VR_DEVICE_001
// [VR API Manager] 2025-09-17 14:30:15 - 통합 세션 시작: VR Racing Game
// [VR API Manager] 2025-09-17 14:35:22 - 통합 세션 종료: VR Racing Game
```

---

## 🎯 성능 최적화

### 1. 배치 처리
```csharp
public class BatchLogger : MonoBehaviour
{
    private List<SessionTracker> pendingSessions = new List<SessionTracker>();
    
    public void QueueSession(string contentName)
    {
        pendingSessions.Add(new SessionTracker 
        { 
            contentName = contentName,
            startTime = DateTime.UtcNow 
        });
    }
    
    public void ProcessBatch()
    {
        foreach (var session in pendingSessions)
        {
            apiManager.StartUnifiedSession(session.contentName);
        }
        pendingSessions.Clear();
    }
}
```

### 2. 캐싱 전략
```csharp
public class SmartContentManager : MonoBehaviour
{
    private Dictionary<string, ContentData> contentCache = 
        new Dictionary<string, ContentData>();
    
    public void LoadContentSmart(string contentName)
    {
        if (contentCache.ContainsKey(contentName))
        {
            // 캐시에서 즉시 사용
            UseContent(contentCache[contentName]);
        }
        else
        {
            // 서버에서 로드
            apiManager.GetContentDataList(100, false);
        }
    }
}
```

### 3. 메모리 관리
```csharp
public class MemoryManager : MonoBehaviour
{
    void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus)
        {
            // 메모리 정리
            System.GC.Collect();
            Resources.UnloadUnusedAssets();
        }
    }
}
```

---

## 📋 체크리스트

### 프로젝트 설정 체크리스트
- [ ] VRApiManager.cs 파일 추가됨
- [ ] VRApiTypes.cs 파일 추가됨  
- [ ] 씬에 VRApiManager 컴포넌트 추가됨
- [ ] Device ID 설정됨
- [ ] 네트워크 연결 확인됨
- [ ] 디버그 로그 활성화됨

### 기능 테스트 체크리스트
- [ ] 사용자 자동 등록/로그인 작동
- [ ] VR 세션 시작/종료 작동
- [ ] 콘텐츠 세션 시작/종료 작동
- [ ] 통합 세션 관리 작동
- [ ] 콘텐츠 데이터 로드 작동
- [ ] 에러 처리 작동

### 운영 준비 체크리스트
- [ ] 사용자 시나리오별 테스트 완료
- [ ] 네트워크 오류 상황 테스트 완료
- [ ] 앱 종료시 세션 정리 확인
- [ ] 메모리 사용량 최적화 확인
- [ ] 로그 모니터링 설정 완료

---

## 📞 지원 및 업데이트

### 버전 정보
- **현재 버전**: 2.0.0
- **최종 업데이트**: 2025-09-17
- **Unity 호환성**: 2021.3 LTS 이상
- **플랫폼 지원**: PC, Android, iOS

### 향후 업데이트 계획
- **v2.1**: 오프라인 모드 지원
- **v2.2**: 실시간 알림 시스템
- **v2.3**: 고급 분석 대시보드
- **v2.4**: 머신러닝 기반 추천 시스템

### 기술 지원
- **개발 문서**: 이 가이드 문서
- **샘플 프로젝트**: VRApiExamples.cs 참조
- **API 문서**: Supabase 대시보드에서 확인
- **이슈 리포팅**: 문제 발생시 로그와 함께 제보

---

**🎉 축하합니다! 이제 Unity VR API를 완전히 활용할 준비가 되었습니다!**

이 가이드를 통해 VR 애플리케이션에서 사용자 관리, 로깅, 데이터 분석까지 모든 백엔드 기능을 쉽게 구현할 수 있습니다. 추가 질문이나 도움이 필요하시면 언제든지 문의해주세요!