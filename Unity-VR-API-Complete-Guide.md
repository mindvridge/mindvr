# Unity VR API 완전 구현 가이드

## API 개요

**엔드포인트:** `https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api`

### 지원 기능
- **사용자 관리**: 등록, 로그인, 로그아웃
- **VR 기기 로깅**: 기기 기반 사용 기록
- **콘텐츠 로깅**: 사용자 기반 콘텐츠 사용 기록
- **데이터 조회**: GET 요청으로 로그 데이터 조회

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
/// VR API 통합 관리자
/// 사용자 관리, VR 기기 로깅, 콘텐츠 로깅을 통합 제공
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
            // 신규 사용자 등록
            string uniqueUsername = $"{defaultUsername}_{DateTime.Now:yyyyMMddHHmmss}";
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
    /// VR 세션 시작
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
    /// VR 세션 종료
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
    /// 콘텐츠 세션 시작
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
    /// 콘텐츠 세션 종료
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
            
            yield return webRequest.SendWebRequest();
            
            ApiResponse response;
            
            if (webRequest.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    response = JsonUtility.FromJson<ApiResponse>(webRequest.downloadHandler.text);
                }
                catch (Exception e)
                {
                    DebugLog($"응답 파싱 오류: {e.Message}");
                    response = new ApiResponse { success = false, error = "응답 파싱 실패" };
                }
            }
            else
            {
                DebugLog($"네트워크 오류: {webRequest.error} (코드: {webRequest.responseCode})");
                response = new ApiResponse { success = false, error = $"네트워크 오류: {webRequest.error}" };
            }
            
            callback?.Invoke(response);
        }
    }
    
    /// <summary>
    /// 사용자 데이터 저장
    /// </summary>
    private void SaveUserData()
    {
        if (currentUser != null)
        {
            PlayerPrefs.SetString("VR_USER_DATA", JsonUtility.ToJson(currentUser));
        }
        if (currentSession != null)
        {
            PlayerPrefs.SetString("VR_SESSION_DATA", JsonUtility.ToJson(currentSession));
        }
        PlayerPrefs.Save();
    }
    
    /// <summary>
    /// 사용자 데이터 로드
    /// </summary>
    private void LoadUserData()
    {
        string userData = PlayerPrefs.GetString("VR_USER_DATA", "");
        if (!string.IsNullOrEmpty(userData))
        {
            try
            {
                currentUser = JsonUtility.FromJson<UserData>(userData);
            }
            catch (Exception e)
            {
                DebugLog($"사용자 데이터 로드 실패: {e.Message}");
            }
        }
        
        string sessionData = PlayerPrefs.GetString("VR_SESSION_DATA", "");
        if (!string.IsNullOrEmpty(sessionData))
        {
            try
            {
                currentSession = JsonUtility.FromJson<SessionData>(sessionData);
                isLoggedIn = currentUser != null && currentSession != null;
            }
            catch (Exception e)
            {
                DebugLog($"세션 데이터 로드 실패: {e.Message}");
            }
        }
    }
    
    /// <summary>
    /// 사용자 데이터 삭제
    /// </summary>
    private void ClearUserData()
    {
        PlayerPrefs.DeleteKey("VR_USER_DATA");
        PlayerPrefs.DeleteKey("VR_SESSION_DATA");
        PlayerPrefs.Save();
        
        currentUser = null;
        currentSession = null;
        isLoggedIn = false;
    }
    
    private void DebugLog(string message)
    {
        if (enableDebugLogs)
        {
            Debug.Log($"[VR API] {message}");
        }
    }
    
    #endregion
    
    #region 퍼블릭 속성
    
    public bool IsLoggedIn => isLoggedIn;
    public string CurrentUsername => currentUser?.username;
    public string DeviceId => deviceId;
    public int ActiveVRSessionCount => activeVRSessions.Count;
    public int ActiveContentSessionCount => activeContentSessions.Count;
    
    #endregion
}

#region 데이터 클래스

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

[System.Serializable]
public class ApiResponse
{
    public bool success;
    public string message;
    public object data;
    public string error;
}

[System.Serializable]
public class UserData
{
    public string id;
    public string username;
    public string created_at;
    public string updated_at;
}

[System.Serializable]
public class SessionData
{
    public string id;
    public string user_id;
    public string login_time;
    public string logout_time;
    public string created_at;
}

[System.Serializable]
public class LoginData
{
    public UserData user;
    public SessionData session;
}

[System.Serializable]
public class SessionTracker
{
    public string contentName;
    public DateTime startTime;
}

#endregion
```

---

## 사용 방법

### 1. 기본 설정

1. Unity 프로젝트에 GameObject 생성
2. `VRApiManager` 스크립트 연결
3. Inspector에서 설정값 조정:
   - **Device ID**: VR 기기 고유 식별자
   - **Default Username**: 기본 사용자명
   - **Enable Debug Logs**: 디버그 로그 활성화
   - **Auto Initialize User**: 자동 사용자 초기화

### 2. 간단한 사용 예시

```csharp
public class VRContentManager : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    // 통합 세션 시작 (추천)
    public void StartExperience(string contentName)
    {
        apiManager.StartUnifiedSession(contentName);
    }
    
    // 통합 세션 종료
    public void EndExperience(string contentName)
    {
        apiManager.EndUnifiedSession(contentName);
    }
    
    // VR 기기 로깅만
    public void StartVROnly(string contentName)
    {
        apiManager.StartVRSession(contentName);
    }
    
    // 콘텐츠 로깅만 (로그인 필요)
    public void StartContentOnly(string contentName)
    {
        apiManager.StartContentSession(contentName);
    }
}
```

### 3. 고급 사용 예시

```csharp
public class AdvancedVRManager : MonoBehaviour
{
    private VRApiManager apiManager;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }
    
    // 사용자 변경
    public void ChangeUser(string newUsername)
    {
        StartCoroutine(apiManager.SwitchUser(newUsername));
    }
    
    // 상태 확인
    public void CheckStatus()
    {
        Debug.Log($"로그인 상태: {apiManager.IsLoggedIn}");
        Debug.Log($"현재 사용자: {apiManager.CurrentUsername}");
        Debug.Log($"활성 VR 세션: {apiManager.ActiveVRSessionCount}");
        Debug.Log($"활성 콘텐츠 세션: {apiManager.ActiveContentSessionCount}");
    }
    
    // 모든 세션 종료
    public void EmergencyStop()
    {
        apiManager.EndAllActiveSessions();
    }
}
```

---

## API 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "작업이 성공적으로 완료되었습니다.",
  "data": {
    // 응답 데이터
  }
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지"
}
```

---

## 데이터 조회

GET 요청으로 저장된 데이터를 조회할 수 있습니다:

- **VR 로그**: `GET /vr-log-api?type=vr_logs&device_id=DEVICE_001&limit=50`
- **콘텐츠 로그**: `GET /vr-log-api?type=content_logs&username=user1&limit=50`
- **사용자 세션**: `GET /vr-log-api?type=user_sessions&username=user1&limit=50`

---

## 주요 특징

✅ **이중 로깅 시스템**: VR 기기 로깅 + 사용자별 콘텐츠 로깅  
✅ **자동 사용자 관리**: 등록, 로그인, 로그아웃 자동화  
✅ **세션 추적**: 여러 콘텐츠 동시 사용 추적  
✅ **오프라인 지원**: 네트워크 오류 시 안전한 처리  
✅ **생명주기 관리**: 앱 일시정지/종료 시 자동 세션 정리  
✅ **오류 처리**: 포괄적인 오류 처리 및 로깅  
✅ **유연한 사용법**: 간단한 통합 메서드부터 세밀한 제어까지