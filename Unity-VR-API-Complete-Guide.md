# Unity VR API 완전 가이드

## API 개요

**엔드포인트:** `https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api`

### 지원하는 액션들

1. **사용자 관리**: `register`, `login`, `logout`
2. **VR 기기 로깅**: `vr_log` (기기 기반 로깅)
3. **콘텐츠 로깅**: `content_log` (사용자 기반 로깅)
4. **데이터 조회**: GET 요청으로 로그 데이터 조회

---

## Unity C# 완전 구현 코드

### VRApiManager.cs - 통합 API 매니저

```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

/// <summary>
/// VR API 통합 매니저 - 사용자 관리 및 로깅 기능을 모두 제공
/// </summary>
public class VRApiManager : MonoBehaviour
{
    [Header("API 설정")]
    private const string API_URL = "https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api";
    
    [Header("기기 설정")]
    public string deviceId = "VR_DEVICE_001";
    
    [Header("사용자 설정")]
    public string defaultUsername = "VRUser001";
    
    [Header("디버그")]
    public bool enableDebugLogs = true;
    
    // 현재 상태
    private string currentUserId;
    private string currentUsername;
    private string currentSessionId;
    private bool isLoggedIn = false;
    
    // 콘텐츠 추적
    private Dictionary<string, DateTime> activeVRSessions = new Dictionary<string, DateTime>();
    private Dictionary<string, DateTime> activeContentSessions = new Dictionary<string, DateTime>();
    
    void Start()
    {
        // 기기 ID 자동 생성
        if (string.IsNullOrEmpty(deviceId))
        {
            deviceId = $"VR_DEVICE_{SystemInfo.deviceUniqueIdentifier.Substring(0, 8).ToUpper()}";
        }
        
        // 저장된 사용자 정보 로드
        LoadUserData();
        
        // 자동 초기화
        StartCoroutine(InitializeUser());
        
        DebugLog($"VR API Manager 초기화 완료 - Device: {deviceId}");
    }

    #region 사용자 관리

    /// <summary>
    /// 사용자 초기화 (등록 또는 로그인)
    /// </summary>
    IEnumerator InitializeUser()
    {
        if (string.IsNullOrEmpty(currentUsername))
        {
            // 신규 사용자 등록
            yield return StartCoroutine(RegisterUser(defaultUsername));
        }
        else
        {
            // 기존 사용자 로그인
            yield return StartCoroutine(LoginUser(currentUsername));
        }
    }

    /// <summary>
    /// 사용자 등록
    /// </summary>
    public IEnumerator RegisterUser(string username)
    {
        var request = new ApiRequest
        {
            action = "register",
            username = username
        };

        yield return StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success && response.data != null)
            {
                var userData = JsonUtility.FromJson<UserData>(JsonUtility.ToJson(response.data));
                currentUserId = userData.id;
                currentUsername = userData.username;
                isLoggedIn = true;
                
                SaveUserData();
                DebugLog($"사용자 등록 성공: {currentUsername}");
                
                // 등록 후 바로 로그인
                StartCoroutine(LoginUser(currentUsername));
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
                currentUserId = loginData.user.id;
                currentUsername = loginData.user.username;
                currentSessionId = loginData.session.id;
                isLoggedIn = true;
                
                SaveUserData();
                DebugLog($"로그인 성공: {currentUsername}");
            }
            else
            {
                DebugLog($"로그인 실패: {response.error}");
                // 로그인 실패 시 새로 등록 시도
                StartCoroutine(RegisterUser(username));
            }
        }));
    }

    /// <summary>
    /// 사용자 로그아웃
    /// </summary>
    public IEnumerator LogoutUser()
    {
        if (!isLoggedIn || string.IsNullOrEmpty(currentSessionId))
        {
            yield break;
        }

        var request = new ApiRequest
        {
            action = "logout",
            session_id = currentSessionId
        };

        yield return StartCoroutine(SendApiRequest(request, (response) =>
        {
            isLoggedIn = false;
            currentSessionId = null;
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
        if (activeVRSessions.ContainsKey(contentName))
        {
            DebugLog($"이미 진행 중인 VR 세션: {contentName}");
            return;
        }

        DateTime startTime = DateTime.UtcNow;
        activeVRSessions[contentName] = startTime;

        var request = new ApiRequest
        {
            action = "vr_log",
            device_id = deviceId,
            content_name = contentName,
            start_time = startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            username = currentUsername // 선택사항
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
        if (!activeVRSessions.ContainsKey(contentName))
        {
            DebugLog($"진행 중이지 않은 VR 세션: {contentName}");
            return;
        }

        DateTime startTime = activeVRSessions[contentName];
        DateTime endTime = DateTime.UtcNow;
        activeVRSessions.Remove(contentName);

        var request = new ApiRequest
        {
            action = "vr_log",
            device_id = deviceId,
            content_name = contentName,
            start_time = startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            end_time = endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            username = currentUsername // 선택사항
        };

        StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success)
            {
                DebugLog($"VR 세션 종료 기록 완료: {contentName} (사용시간: {(endTime - startTime).TotalMinutes:F1}분)");
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

        if (activeContentSessions.ContainsKey(contentName))
        {
            DebugLog($"이미 진행 중인 콘텐츠 세션: {contentName}");
            return;
        }

        DateTime startTime = DateTime.UtcNow;
        activeContentSessions[contentName] = startTime;

        var request = new ApiRequest
        {
            action = "content_log",
            username = currentUsername,
            content_name = contentName,
            start_time = startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
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

        if (!activeContentSessions.ContainsKey(contentName))
        {
            DebugLog($"진행 중이지 않은 콘텐츠 세션: {contentName}");
            return;
        }

        DateTime startTime = activeContentSessions[contentName];
        DateTime endTime = DateTime.UtcNow;
        activeContentSessions.Remove(contentName);

        var request = new ApiRequest
        {
            action = "content_log",
            username = currentUsername,
            content_name = contentName,
            start_time = startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            end_time = endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        StartCoroutine(SendApiRequest(request, (response) =>
        {
            if (response.success)
            {
                DebugLog($"콘텐츠 세션 종료 기록 완료: {contentName} (사용시간: {(endTime - startTime).TotalMinutes:F1}분)");
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
    /// 통합 세션 시작 (VR + 콘텐츠 로깅을 모두 실행)
    /// </summary>
    public void StartUnifiedSession(string contentName)
    {
        StartVRSession(contentName);
        StartContentSession(contentName);
    }

    /// <summary>
    /// 통합 세션 종료 (VR + 콘텐츠 로깅을 모두 종료)
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

    #endregion

    #region 내부 메서드

    /// <summary>
    /// API 요청 전송
    /// </summary>
    IEnumerator SendApiRequest(ApiRequest request, System.Action<ApiResponse> callback)
    {
        string jsonData = JsonUtility.ToJson(request);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);

        using (UnityWebRequest webRequest = new UnityWebRequest(API_URL, "POST"))
        {
            webRequest.uploadHandler = new UploadHandlerRaw(bodyRaw);
            webRequest.downloadHandler = new DownloadHandlerBuffer();
            webRequest.SetRequestHeader("Content-Type", "application/json");

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
                response = new ApiResponse { success = false, error = webRequest.error };
            }

            callback?.Invoke(response);
        }
    }

    /// <summary>
    /// 사용자 데이터 저장
    /// </summary>
    void SaveUserData()
    {
        if (!string.IsNullOrEmpty(currentUserId))
            PlayerPrefs.SetString("VR_USER_ID", currentUserId);
        if (!string.IsNullOrEmpty(currentUsername))
            PlayerPrefs.SetString("VR_USERNAME", currentUsername);
        if (!string.IsNullOrEmpty(currentSessionId))
            PlayerPrefs.SetString("VR_SESSION_ID", currentSessionId);
        
        PlayerPrefs.Save();
    }

    /// <summary>
    /// 사용자 데이터 로드
    /// </summary>
    void LoadUserData()
    {
        currentUserId = PlayerPrefs.GetString("VR_USER_ID", "");
        currentUsername = PlayerPrefs.GetString("VR_USERNAME", "");
        currentSessionId = PlayerPrefs.GetString("VR_SESSION_ID", "");
        isLoggedIn = !string.IsNullOrEmpty(currentUserId) && !string.IsNullOrEmpty(currentUsername);
    }

    /// <summary>
    /// 사용자 데이터 삭제
    /// </summary>
    void ClearUserData()
    {
        PlayerPrefs.DeleteKey("VR_USER_ID");
        PlayerPrefs.DeleteKey("VR_USERNAME");
        PlayerPrefs.DeleteKey("VR_SESSION_ID");
        PlayerPrefs.Save();
        
        currentUserId = "";
        currentUsername = "";
        currentSessionId = "";
        isLoggedIn = false;
    }

    void DebugLog(string message)
    {
        if (enableDebugLogs)
        {
            Debug.Log($"[VR API] {message}");
        }
    }

    #endregion

    #region Unity 생명주기 이벤트

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
        if (isLoggedIn)
        {
            StartCoroutine(LogoutUser());
        }
    }

    #endregion
}

#region 데이터 클래스들

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
}

[System.Serializable]
public class SessionData
{
    public string id;
    public string user_id;
    public string login_time;
}

[System.Serializable]
public class LoginData
{
    public UserData user;
    public SessionData session;
}

#endregion
```

---

## 사용법

### 1. 기본 설정

1. 빈 GameObject 생성 → "VRApiManager" 이름 변경
2. `VRApiManager` 스크립트 추가
3. Inspector에서 설정:
   - **Device Id**: VR 기기 고유 ID
   - **Default Username**: 기본 사용자명
   - **Enable Debug Logs**: 디버그 로그 활성화 여부

### 2. 간단한 사용 예시

```csharp
public class VRContentController : MonoBehaviour
{
    private VRApiManager apiManager;

    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }

    public void OnContentStart()
    {
        // 통합 세션 시작 (VR + 콘텐츠 로깅)
        apiManager.StartUnifiedSession("VR_Racing_Game");
    }

    public void OnContentEnd()
    {
        // 통합 세션 종료
        apiManager.EndUnifiedSession("VR_Racing_Game");
    }

    public void OnGameModeChange()
    {
        // VR 기기 로깅만 (사용자 정보 없이)
        apiManager.StartVRSession("VR_Training_Mode");
    }

    public void OnUserContentStart()
    {
        // 사용자별 콘텐츠 로깅만
        apiManager.StartContentSession("Educational_Content");
    }
}
```

### 3. 고급 사용 예시

```csharp
public class AdvancedVRController : MonoBehaviour
{
    private VRApiManager apiManager;
    private string currentContent;

    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
    }

    public void SwitchContent(string newContentName)
    {
        // 이전 콘텐츠 종료
        if (!string.IsNullOrEmpty(currentContent))
        {
            apiManager.EndUnifiedSession(currentContent);
        }

        // 새 콘텐츠 시작
        currentContent = newContentName;
        apiManager.StartUnifiedSession(currentContent);
    }

    public void OnUserLogout()
    {
        // 모든 세션 종료 후 로그아웃
        apiManager.EndAllActiveSessions();
        StartCoroutine(apiManager.LogoutUser());
    }
}
```

---

## API 응답 형태

### 성공 응답
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "id": "uuid",
    "device_id": "VR_DEVICE_001",
    "content_name": "VR_Experience",
    "start_time": "2024-01-15T10:30:00.000Z",
    "end_time": "2024-01-15T10:45:00.000Z",
    "duration_minutes": 15
  }
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "필수 파라미터가 누락되었습니다."
}
```

---

## 데이터 조회 API

### GET 요청 파라미터

- `type`: `vr_logs`, `content_logs`, `user_sessions`
- `username`: 특정 사용자 필터링 (선택사항)
- `device_id`: 특정 기기 필터링 (VR 로그만, 선택사항)
- `limit`: 조회할 레코드 수 (기본값: 100)

### 조회 예시
```
GET https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api?type=vr_logs&device_id=VR_DEVICE_001&limit=50
```

---

## 주요 특징

✅ **이중 로깅 시스템**: VR 기기 로깅 + 사용자별 콘텐츠 로깅  
✅ **자동 사용자 관리**: 등록/로그인/로그아웃 자동화  
✅ **세션 추적**: 시작/종료 시간 및 사용 시간 자동 계산  
✅ **오프라인 대응**: PlayerPrefs를 통한 로컬 데이터 저장  
✅ **생명주기 관리**: 앱 종료/백그라운드 진입 시 자동 정리  
✅ **에러 처리**: 네트워크 오류 및 API 오류 핸들링  
✅ **유연한 사용법**: 개별 로깅 또는 통합 로깅 선택 가능  

이제 Unity VR 애플리케이션에서 완전한 사용자 및 기기 활동 추적이 가능합니다!