# Unity VR API 완전 구현 가이드 (업데이트됨)

## API 개요

**엔드포인트:** `https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api`

### 지원 기능
- **사용자 관리**: 등록, 로그인, 로그아웃
- **VR 기기 로깅**: 기기 기반 사용 기록 (`vr_usage_logs` 테이블)
- **콘텐츠 로깅**: 사용자 기반 콘텐츠 사용 기록 (`vr_usage_logs` 테이블, `device_id: 'CONTENT_DEVICE'`)
- **데이터 조회**: GET 요청으로 로그 데이터 조회
- **한국 시간대**: 모든 시간은 한국 표준시(KST)로 처리

---

## API 엔드포인트 상세

### 1. POST 요청 엔드포인트

#### 1.1 사용자 등록
```http
POST /functions/v1/vr-log-api
Content-Type: application/json

{
  "action": "register",
  "username": "사용자명"
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "사용자가 성공적으로 등록되었습니다.",
  "data": {
    "id": "uuid-user-id",
    "username": "사용자명",
    "created_at": "2025-09-15T10:00:00.000Z",
    "updated_at": "2025-09-15T10:00:00.000Z"
  }
}
```

#### 1.2 사용자 로그인
```http
POST /functions/v1/vr-log-api
Content-Type: application/json

{
  "action": "login",
  "username": "사용자명"
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "로그인되었습니다.",
  "data": {
    "user": {
      "id": "uuid-user-id",
      "username": "사용자명",
      "created_at": "2025-09-15T10:00:00.000Z",
      "updated_at": "2025-09-15T10:00:00.000Z"
    },
    "session": {
      "id": "uuid-session-id",
      "user_id": "uuid-user-id",
      "login_time": "2025-09-15T10:05:00.000Z"
    }
  }
}
```

#### 1.3 사용자 로그아웃
```http
POST /functions/v1/vr-log-api
Content-Type: application/json

{
  "action": "logout",
  "session_id": "uuid-session-id"
}
```

#### 1.4 VR 로그 기록 (기기 기반)
```http
POST /functions/v1/vr-log-api
Content-Type: application/json

{
  "action": "vr_log",
  "device_id": "VR_DEVICE_001",
  "content_name": "VR Racing Game",
  "start_time": "2025-09-15T10:00:00Z",
  "end_time": "2025-09-15T10:30:00Z",
  "username": "사용자명"  // 선택사항
}
```

#### 1.5 콘텐츠 로그 기록 (사용자 기반)
```http
POST /functions/v1/vr-log-api
Content-Type: application/json

{
  "action": "content_log",
  "username": "사용자명",
  "content_name": "Educational VR Content",
  "start_time": "2025-09-15T10:00:00Z",
  "end_time": "2025-09-15T10:45:00Z"
}
```

### 2. GET 요청 엔드포인트

#### 2.1 VR 로그 조회
```http
GET /functions/v1/vr-log-api?type=vr_logs&username=사용자명&device_id=VR_DEVICE_001&limit=100
```

#### 2.2 콘텐츠 로그 조회
```http
GET /functions/v1/vr-log-api?type=content_logs&username=사용자명&limit=100
```

#### 2.3 사용자 세션 조회
```http
GET /functions/v1/vr-log-api?type=user_sessions&username=사용자명&limit=100
```

---

## Unity C# 구현

### VRApiManager.cs - 메인 API 매니저

```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

/// <summary>
/// VR API 통합 관리자 (한국 시간대 지원)
/// </summary>
public class VRApiManager : MonoBehaviour
{
    #region 설정 및 상수
    
    private const string API_URL = "https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api";
    
    [Header("기기 설정")]
    [SerializeField] private string deviceId = "VR_DEVICE_001";
    
    [Header("기본 사용자 설정")]
    [SerializeField] private string defaultUsername = "VRUser";
    
    [Header("디버그 설정")]
    [SerializeField] private bool enableDebugLogs = true;
    [SerializeField] private bool autoInitializeUser = true;
    
    #endregion
    
    #region 상태 변수
    
    // 사용자 상태
    private UserData currentUser;
    private SessionData currentSession;
    private bool isLoggedIn = false;
    
    // 활성 세션 추적
    private Dictionary<string, SessionTracker> activeVRSessions = new Dictionary<string, SessionTracker>();
    private Dictionary<string, SessionTracker> activeContentSessions = new Dictionary<string, SessionTracker>();
    
    #endregion
    
    #region Unity 생명주기
    
    void Start()
    {
        InitializeDevice();
        LoadUserData();
        
        if (autoInitializeUser)
        {
            StartCoroutine(AutoInitializeUser());
        }
        
        DebugLog($"VR API Manager 초기화 완료 - Device: {deviceId}");
    }
    
    void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus)
        {
            EndAllActiveSessions();
        }
    }
    
    void OnApplicationFocus(bool hasFocus)
    {
        if (!hasFocus)
        {
            EndAllActiveSessions();
        }
    }
    
    void OnApplicationQuit()
    {
        EndAllActiveSessions();
        if (isLoggedIn && currentSession != null)
        {
            StartCoroutine(LogoutUser());
        }
    }
    
    #endregion
    
    #region 초기화
    
    private void InitializeDevice()
    {
        if (string.IsNullOrEmpty(deviceId))
        {
            deviceId = $"VR_DEVICE_{SystemInfo.deviceUniqueIdentifier.Substring(0, 8).ToUpper()}";
        }
    }
    
    private IEnumerator AutoInitializeUser()
    {
        if (currentUser == null || string.IsNullOrEmpty(currentUser.username))
        {
            // 신규 사용자 등록 (한국 시간 기준)
            DateTime koreanTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, 
                TimeZoneInfo.FindSystemTimeZoneById("Korea Standard Time"));
            string uniqueUsername = $"{defaultUsername}_{koreanTime:yyyyMMddHHmmss}";
            yield return StartCoroutine(RegisterUser(uniqueUsername));
        }
        else
        {
            // 기존 사용자 로그인
            yield return StartCoroutine(LoginUser(currentUser.username));
        }
    }
    
    #endregion
    
    #region 사용자 관리
    
    /// <summary>
    /// 사용자 등록
    /// </summary>
    public IEnumerator RegisterUser(string username)
    {
        if (string.IsNullOrEmpty(username))
        {
            DebugLog("사용자명이 비어있습니다.");
            yield break;
        }
        
        var request = new ApiRequest
        {
            action = "register",
            username = username
        };
        
        yield return StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success && response.data != null)
            {
                currentUser = JsonUtility.FromJson<UserData>(JsonUtility.ToJson(response.data));
                SaveUserData();
                DebugLog($"사용자 등록 성공: {currentUser.username}");
                
                // 등록 후 자동 로그인
                StartCoroutine(LoginUser(currentUser.username));
            }
            else
            {
                DebugLog($"사용자 등록 실패: {response.error}");
            }
        }));
    }
    
    /// <summary>
    /// 사용자 로그인
    /// </summary>
    public IEnumerator LoginUser(string username)
    {
        if (string.IsNullOrEmpty(username))
        {
            DebugLog("사용자명이 비어있습니다.");
            yield break;
        }
        
        var request = new ApiRequest
        {
            action = "login",
            username = username
        };
        
        yield return StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success && response.data != null)
            {
                var loginData = JsonUtility.FromJson<LoginData>(JsonUtility.ToJson(response.data));
                currentUser = loginData.user;
                currentSession = loginData.session;
                isLoggedIn = true;
                
                SaveUserData();
                DebugLog($"로그인 성공: {currentUser.username}");
            }
            else
            {
                DebugLog($"로그인 실패: {response.error}");
                // 로그인 실패 시 새로 등록 시도
                if (response.error.Contains("찾을 수 없습니다"))
                {
                    StartCoroutine(RegisterUser(username));
                }
            }
        }));
    }
    
    /// <summary>
    /// 사용자 로그아웃
    /// </summary>
    public IEnumerator LogoutUser()
    {
        if (!isLoggedIn || currentSession == null)
        {
            DebugLog("로그인되지 않은 상태입니다.");
            yield break;
        }
        
        // 모든 활성 세션 종료
        EndAllActiveSessions();
        
        var request = new ApiRequest
        {
            action = "logout",
            session_id = currentSession.id
        };
        
        yield return StartCoroutine(SendApiRequest(request, (response) =>
        {
            isLoggedIn = false;
            currentSession = null;
            ClearUserData();
            DebugLog("로그아웃 완료");
        }));
    }
    
    #endregion
    
    #region VR 로깅 (기기 기반)
    
    /// <summary>
    /// VR 세션 시작 (기기 기반 로깅)
    /// </summary>
    public void StartVRSession(string contentName)
    {
        if (string.IsNullOrEmpty(contentName))
        {
            DebugLog("콘텐츠명이 비어있습니다.");
            return;
        }
        
        if (activeVRSessions.ContainsKey(contentName))
        {
            DebugLog($"이미 진행 중인 VR 세션: {contentName}");
            return;
        }
        
        var tracker = new SessionTracker
        {
            contentName = contentName,
            startTime = DateTime.UtcNow
        };
        
        activeVRSessions[contentName] = tracker;
        
        var request = new ApiRequest
        {
            action = "vr_log",
            device_id = deviceId,
            content_name = contentName,
            start_time = tracker.startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            username = currentUser?.username
        };
        
        StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success)
            {
                DebugLog($"VR 세션 시작 기록 완료: {contentName}");
            }
            else
            {
                DebugLog($"VR 세션 시작 기록 실패: {response.error}");
            }
        }));
    }
    
    /// <summary>
    /// VR 세션 종료 (기기 기반 로깅)
    /// </summary>
    public void EndVRSession(string contentName)
    {
        if (!activeVRSessions.TryGetValue(contentName, out SessionTracker tracker))
        {
            DebugLog($"진행 중이지 않은 VR 세션: {contentName}");
            return;
        }
        
        activeVRSessions.Remove(contentName);
        DateTime endTime = DateTime.UtcNow;
        
        var request = new ApiRequest
        {
            action = "vr_log",
            device_id = deviceId,
            content_name = contentName,
            start_time = tracker.startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            end_time = endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            username = currentUser?.username
        };
        
        StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success)
            {
                double minutes = (endTime - tracker.startTime).TotalMinutes;
                DebugLog($"VR 세션 종료 기록 완료: {contentName} (사용시간: {minutes:F1}분)");
            }
            else
            {
                DebugLog($"VR 세션 종료 기록 실패: {response.error}");
            }
        }));
    }
    
    #endregion
    
    #region 콘텐츠 로깅 (사용자 기반)
    
    /// <summary>
    /// 콘텐츠 세션 시작 (사용자 기반 로깅, device_id: 'CONTENT_DEVICE')
    /// </summary>
    public void StartContentSession(string contentName)
    {
        if (!isLoggedIn)
        {
            DebugLog("로그인되지 않은 상태에서는 콘텐츠 로깅이 불가능합니다.");
            return;
        }
        
        if (string.IsNullOrEmpty(contentName))
        {
            DebugLog("콘텐츠명이 비어있습니다.");
            return;
        }
        
        if (activeContentSessions.ContainsKey(contentName))
        {
            DebugLog($"이미 진행 중인 콘텐츠 세션: {contentName}");
            return;
        }
        
        var tracker = new SessionTracker
        {
            contentName = contentName,
            startTime = DateTime.UtcNow
        };
        
        activeContentSessions[contentName] = tracker;
        
        var request = new ApiRequest
        {
            action = "content_log",
            username = currentUser.username,
            content_name = contentName,
            start_time = tracker.startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };
        
        StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success)
            {
                DebugLog($"콘텐츠 세션 시작 기록 완료: {contentName}");
            }
            else
            {
                DebugLog($"콘텐츠 세션 시작 기록 실패: {response.error}");
            }
        }));
    }
    
    /// <summary>
    /// 콘텐츠 세션 종료 (사용자 기반 로깅, device_id: 'CONTENT_DEVICE')
    /// </summary>
    public void EndContentSession(string contentName)
    {
        if (!isLoggedIn)
        {
            DebugLog("로그인되지 않은 상태입니다.");
            return;
        }
        
        if (!activeContentSessions.TryGetValue(contentName, out SessionTracker tracker))
        {
            DebugLog($"진행 중이지 않은 콘텐츠 세션: {contentName}");
            return;
        }
        
        activeContentSessions.Remove(contentName);
        DateTime endTime = DateTime.UtcNow;
        
        var request = new ApiRequest
        {
            action = "content_log",
            username = currentUser.username,
            content_name = contentName,
            start_time = tracker.startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            end_time = endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };
        
        StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success)
            {
                double minutes = (endTime - tracker.startTime).TotalMinutes;
                DebugLog($"콘텐츠 세션 종료 기록 완료: {contentName} (사용시간: {minutes:F1}분)");
            }
            else
            {
                DebugLog($"콘텐츠 세션 종료 기록 실패: {response.error}");
            }
        }));
    }
    
    #endregion
    
    #region 편의 메서드
    
    /// <summary>
    /// 통합 세션 시작 (VR + 콘텐츠 로깅 동시 실행)
    /// </summary>
    public void StartUnifiedSession(string contentName)
    {
        StartVRSession(contentName);
        StartContentSession(contentName);
    }
    
    /// <summary>
    /// 통합 세션 종료 (VR + 콘텐츠 로깅 동시 종료)
    /// </summary>
    public void EndUnifiedSession(string contentName)
    {
        EndVRSession(contentName);
        EndContentSession(contentName);
    }
    
    /// <summary>
    /// 모든 활성 세션 종료
    /// </summary>
    public void EndAllActiveSessions()
    {
        // VR 세션들 종료
        var vrSessions = new List<string>(activeVRSessions.Keys);
        foreach (var contentName in vrSessions)
        {
            EndVRSession(contentName);
        }
        
        // 콘텐츠 세션들 종료
        var contentSessions = new List<string>(activeContentSessions.Keys);
        foreach (var contentName in contentSessions)
        {
            EndContentSession(contentName);
        }
    }
    
    /// <summary>
    /// 사용자 변경 (현재 세션들을 모두 종료하고 새 사용자로 로그인)
    /// </summary>
    public IEnumerator SwitchUser(string newUsername)
    {
        EndAllActiveSessions();
        
        if (isLoggedIn)
        {
            yield return StartCoroutine(LogoutUser());
        }
        
        yield return StartCoroutine(LoginUser(newUsername));
    }
    
    /// <summary>
    /// 현재 상태 확인
    /// </summary>
    public bool IsLoggedIn() => isLoggedIn;
    public UserData GetCurrentUser() => currentUser;
    public SessionData GetCurrentSession() => currentSession;
    public string GetDeviceId() => deviceId;
    
    #endregion
    
    #region 내부 메서드
    
    /// <summary>
    /// API 요청 전송
    /// </summary>
    private IEnumerator SendApiRequest(ApiRequest request, System.Action<ApiResponse> callback)
    {
        string jsonData = JsonUtility.ToJson(request);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        
        using (UnityWebRequest webRequest = new UnityWebRequest(API_URL, "POST"))
        {
            webRequest.uploadHandler = new UploadHandlerRaw(bodyRaw);
            webRequest.downloadHandler = new DownloadHandlerBuffer();
            webRequest.SetRequestHeader("Content-Type", "application/json");
            webRequest.timeout = 30; // 30초 타임아웃
            
            DebugLog($"API 요청 전송: {jsonData}");
            
            yield return webRequest.SendWebRequest();
            
            if (webRequest.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    string responseText = webRequest.downloadHandler.text;
                    DebugLog($"API 응답 받음: {responseText}");
                    
                    ApiResponse response = JsonUtility.FromJson<ApiResponse>(responseText);
                    callback?.Invoke(response);
                }
                catch (System.Exception ex)
                {
                    DebugLog($"응답 파싱 오류: {ex.Message}");
                    callback?.Invoke(new ApiResponse { success = false, error = "응답 파싱 실패" });
                }
            }
            else
            {
                DebugLog($"API 요청 실패: {webRequest.error}");
                callback?.Invoke(new ApiResponse { success = false, error = webRequest.error });
            }
        }
    }
    
    /// <summary>
    /// 사용자 데이터 저장
    /// </summary>
    private void SaveUserData()
    {
        if (currentUser != null)
        {
            PlayerPrefs.SetString("VRApi_Username", currentUser.username);
            PlayerPrefs.SetString("VRApi_UserId", currentUser.id);
        }
        PlayerPrefs.Save();
    }
    
    /// <summary>
    /// 사용자 데이터 로드
    /// </summary>
    private void LoadUserData()
    {
        if (PlayerPrefs.HasKey("VRApi_Username"))
        {
            currentUser = new UserData
            {
                username = PlayerPrefs.GetString("VRApi_Username"),
                id = PlayerPrefs.GetString("VRApi_UserId")
            };
        }
    }
    
    /// <summary>
    /// 사용자 데이터 삭제
    /// </summary>
    private void ClearUserData()
    {
        PlayerPrefs.DeleteKey("VRApi_Username");
        PlayerPrefs.DeleteKey("VRApi_UserId");
        PlayerPrefs.Save();
        currentUser = null;
    }
    
    /// <summary>
    /// 디버그 로그 출력
    /// </summary>
    private void DebugLog(string message)
    {
        if (enableDebugLogs)
        {
            DateTime koreanTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, 
                TimeZoneInfo.FindSystemTimeZoneById("Korea Standard Time"));
            Debug.Log($"[VR API Manager] {koreanTime:yyyy-MM-dd HH:mm:ss KST} - {message}");
        }
    }
    
    #endregion
}

/// <summary>
/// API 요청 데이터 구조
/// </summary>
[System.Serializable]
public class ApiRequest
{
    public string action;
    public string username;
    public string password;
    public string device_id;
    public string content_name;
    public string start_time;
    public string end_time;
    public string session_id;
}

/// <summary>
/// API 응답 데이터 구조
/// </summary>
[System.Serializable]
public class ApiResponse
{
    public bool success;
    public string message;
    public object data;
    public string error;
}

/// <summary>
/// 사용자 데이터 구조
/// </summary>
[System.Serializable]
public class UserData
{
    public string id;
    public string username;
    public string created_at;
    public string updated_at;
}

/// <summary>
/// 세션 데이터 구조
/// </summary>
[System.Serializable]
public class SessionData
{
    public string id;
    public string user_id;
    public string login_time;
    public string logout_time;
    public string created_at;
}

/// <summary>
/// 로그인 응답 데이터 구조
/// </summary>
[System.Serializable]
public class LoginData
{
    public UserData user;
    public SessionData session;
}

/// <summary>
/// 세션 추적 클래스
/// </summary>
[System.Serializable]
public class SessionTracker
{
    public string contentName;
    public DateTime startTime;
}
```

---

## 사용 가이드

### 1. 기본 설정

1. Unity 프로젝트에 `VRApiManager.cs` 스크립트 추가
2. 새로운 GameObject 생성 후 `VRApiManager` 컴포넌트 추가
3. Inspector에서 다음 설정:
   - **Device Id**: VR 기기 고유 ID (예: "VR_DEVICE_001")
   - **Default Username**: 기본 사용자명 (예: "VRUser")
   - **Enable Debug Logs**: 디버그 로그 출력 여부
   - **Auto Initialize User**: 자동 사용자 초기화 여부

### 2. 기본 사용법

```csharp
public class VRGameManager : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    // VR 체험 시작
    public void StartVRExperience(string contentName)
    {
        apiManager.StartUnifiedSession(contentName);
    }
    
    // VR 체험 종료
    public void EndVRExperience(string contentName)
    {
        apiManager.EndUnifiedSession(contentName);
    }
}
```

### 3. 고급 사용법

#### 3.1 VR 로깅과 콘텐츠 로깅 분리

```csharp
// VR 기기 로깅만 (사용자 로그인 불필요)
apiManager.StartVRSession("VR Racing Game");
apiManager.EndVRSession("VR Racing Game");

// 콘텐츠 로깅만 (사용자 로그인 필요)
apiManager.StartContentSession("Educational Content");
apiManager.EndContentSession("Educational Content");
```

#### 3.2 사용자 관리

```csharp
// 특정 사용자로 로그인
StartCoroutine(apiManager.LoginUser("student001"));

// 사용자 변경
StartCoroutine(apiManager.SwitchUser("student002"));

// 로그아웃
StartCoroutine(apiManager.LogoutUser());

// 현재 상태 확인
if (apiManager.IsLoggedIn())
{
    UserData user = apiManager.GetCurrentUser();
    Debug.Log($"현재 사용자: {user.username}");
}
```

### 4. 이벤트 처리

```csharp
public class VRSessionHandler : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    // 게임 시작 시
    public void OnGameStart(string gameName)
    {
        apiManager.StartUnifiedSession(gameName);
    }
    
    // 게임 종료 시
    public void OnGameEnd(string gameName)
    {
        apiManager.EndUnifiedSession(gameName);
    }
    
    // 일시정지 시
    public void OnGamePause()
    {
        apiManager.EndAllActiveSessions();
    }
    
    // 사용자 변경 시
    public void OnUserSwitch(string newUsername)
    {
        StartCoroutine(apiManager.SwitchUser(newUsername));
    }
}
```

---

## 데이터베이스 구조

### 1. 통합된 로깅 시스템

- **VR 로그**: `vr_usage_logs` 테이블, `device_id`가 실제 기기 ID
- **콘텐츠 로그**: `vr_usage_logs` 테이블, `device_id`가 `'CONTENT_DEVICE'`

### 2. 테이블 구조

#### vr_usage_logs
- `id`: UUID (Primary Key)
- `device_id`: 기기 ID 또는 'CONTENT_DEVICE'
- `user_id`: 사용자 ID (선택사항)
- `content_name`: 콘텐츠 이름
- `start_time`: 시작 시간 (한국시간으로 표시)
- `end_time`: 종료 시간 (한국시간으로 표시)
- `duration_minutes`: 사용 시간 (분, 자동 계산)
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

#### users
- `id`: UUID (Primary Key)
- `username`: 사용자명 (Unique)
- `password_hash`: 비밀번호 해시
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

#### user_sessions
- `id`: UUID (Primary Key)
- `user_id`: 사용자 ID
- `login_time`: 로그인 시간
- `logout_time`: 로그아웃 시간 (선택사항)
- `created_at`: 생성 시간

---

## 오류 처리 및 디버깅

### 1. 일반적인 오류

- **네트워크 연결 실패**: 인터넷 연결 확인
- **사용자 등록 실패**: 중복된 사용자명 확인
- **로그인 실패**: 사용자명 확인 또는 자동 등록 활용
- **로깅 실패**: API URL 및 요청 데이터 형식 확인

### 2. 디버그 로그 활용

```csharp
// 디버그 로그 활성화
apiManager.enableDebugLogs = true;

// 상태 확인
Debug.Log($"현재 기기 ID: {apiManager.GetDeviceId()}");
Debug.Log($"로그인 상태: {apiManager.IsLoggedIn()}");
```

### 3. 한국 시간대 처리

모든 시간은 자동으로 한국 표준시(KST)로 처리되며, 웹 인터페이스에서도 한국 시간으로 표시됩니다.

---

## 추가 기능

### 1. 배치 로깅 (옵션)

대량의 로그를 한번에 처리해야 하는 경우, 별도의 배치 API를 구현할 수 있습니다.

### 2. 실시간 모니터링

웹 대시보드에서 실시간으로 VR 사용 현황을 모니터링할 수 있습니다.

### 3. 분석 리포트

사용 패턴, 인기 콘텐츠, 사용자 행동 등에 대한 분석 리포트를 제공합니다.

---

이 가이드를 통해 Unity VR 애플리케이션에서 완전한 로깅 시스템을 구현하고 관리할 수 있습니다.