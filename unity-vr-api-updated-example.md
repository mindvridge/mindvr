# Unity VR API 사용 예제 (업데이트됨)

## API 엔드포인트
`https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api`

## 새로운 기능들

### 1. 사용자 등록
```csharp
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class RegisterRequest
{
    public string action = "register";
    public string username;
}

[System.Serializable]
public class ApiResponse
{
    public bool success;
    public string message;
    public UserData user;
}

[System.Serializable]
public class UserData
{
    public string id;
    public string username;
    public string created_at;
}

public class VRUserManager : MonoBehaviour
{
    private const string API_URL = "https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api";
    
    public IEnumerator RegisterUser(string username)
    {
        var request = new RegisterRequest
        {
            username = username
        };
        
        string jsonData = JsonUtility.ToJson(request);
        
        using (UnityWebRequest webRequest = new UnityWebRequest(API_URL, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            webRequest.uploadHandler = new UploadHandlerRaw(bodyRaw);
            webRequest.downloadHandler = new DownloadHandlerBuffer();
            webRequest.SetRequestHeader("Content-Type", "application/json");
            
            yield return webRequest.SendWebRequest();
            
            if (webRequest.result == UnityWebRequest.Result.Success)
            {
                var response = JsonUtility.FromJson<ApiResponse>(webRequest.downloadHandler.text);
                if (response.success)
                {
                    Debug.Log($"사용자 등록 성공: {response.user.username} (ID: {response.user.id})");
                    PlayerPrefs.SetString("UserID", response.user.id);
                    PlayerPrefs.SetString("Username", response.user.username);
                }
                else
                {
                    Debug.LogError($"사용자 등록 실패: {response.message}");
                }
            }
            else
            {
                Debug.LogError($"네트워크 오류: {webRequest.error}");
            }
        }
    }
}
```

### 2. 사용자 로그인
```csharp
[System.Serializable]
public class LoginRequest
{
    public string action = "login";
    public string username;
}

[System.Serializable]
public class LoginResponse
{
    public bool success;
    public string message;
    public UserData user;
    public SessionData session;
}

[System.Serializable]
public class SessionData
{
    public string id;
    public string user_id;
    public string login_time;
}

public IEnumerator LoginUser(string username)
{
    var request = new LoginRequest
    {
        username = username
    };
    
    string jsonData = JsonUtility.ToJson(request);
    
    using (UnityWebRequest webRequest = new UnityWebRequest(API_URL, "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
        webRequest.uploadHandler = new UploadHandlerRaw(bodyRaw);
        webRequest.downloadHandler = new DownloadHandlerBuffer();
        webRequest.SetRequestHeader("Content-Type", "application/json");
        
        yield return webRequest.SendWebRequest();
        
        if (webRequest.result == UnityWebRequest.Result.Success)
        {
            var response = JsonUtility.FromJson<LoginResponse>(webRequest.downloadHandler.text);
            if (response.success)
            {
                Debug.Log($"로그인 성공: {response.user.username}");
                PlayerPrefs.SetString("UserID", response.user.id);
                PlayerPrefs.SetString("Username", response.user.username);
                PlayerPrefs.SetString("SessionID", response.session.id);
            }
            else
            {
                Debug.LogError($"로그인 실패: {response.message}");
            }
        }
        else
        {
            Debug.LogError($"네트워크 오류: {webRequest.error}");
        }
    }
}
```

### 3. 콘텐츠 사용 로그 기록
```csharp
[System.Serializable]
public class ContentLogRequest
{
    public string action = "content_log";
    public string username;
    public string content_name;
    public string start_time;
    public string end_time;
}

public IEnumerator LogContentUsage(string contentName, string startTime, string endTime = null)
{
    string username = PlayerPrefs.GetString("Username");
    
    if (string.IsNullOrEmpty(username))
    {
        Debug.LogError("사용자가 로그인되지 않았습니다.");
        yield break;
    }
    
    var request = new ContentLogRequest
    {
        username = username,
        content_name = contentName,
        start_time = startTime,
        end_time = endTime
    };
    
    string jsonData = JsonUtility.ToJson(request);
    
    using (UnityWebRequest webRequest = new UnityWebRequest(API_URL, "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
        webRequest.uploadHandler = new UploadHandlerRaw(bodyRaw);
        webRequest.downloadHandler = new DownloadHandlerBuffer();
        webRequest.SetRequestHeader("Content-Type", "application/json");
        
        yield return webRequest.SendWebRequest();
        
        if (webRequest.result == UnityWebRequest.Result.Success)
        {
            var response = JsonUtility.FromJson<ApiResponse>(webRequest.downloadHandler.text);
            if (response.success)
            {
                Debug.Log($"콘텐츠 로그 성공: {contentName}");
            }
            else
            {
                Debug.LogError($"콘텐츠 로그 실패: {response.message}");
            }
        }
        else
        {
            Debug.LogError($"네트워크 오류: {webRequest.error}");
        }
    }
}
```

### 4. 로그아웃
```csharp
[System.Serializable]
public class LogoutRequest
{
    public string action = "logout";
    public string session_id;
}

public IEnumerator LogoutUser()
{
    string sessionId = PlayerPrefs.GetString("SessionID");
    
    if (string.IsNullOrEmpty(sessionId))
    {
        Debug.LogWarning("세션 ID가 없습니다.");
        yield break;
    }
    
    var request = new LogoutRequest
    {
        session_id = sessionId
    };
    
    string jsonData = JsonUtility.ToJson(request);
    
    using (UnityWebRequest webRequest = new UnityWebRequest(API_URL, "POST"))
    {
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
        webRequest.uploadHandler = new UploadHandlerRaw(bodyRaw);
        webRequest.downloadHandler = new DownloadHandlerBuffer();
        webRequest.SetRequestHeader("Content-Type", "application/json");
        
        yield return webRequest.SendWebRequest();
        
        if (webRequest.result == UnityWebRequest.Result.Success)
        {
            var response = JsonUtility.FromJson<ApiResponse>(webRequest.downloadHandler.text);
            if (response.success)
            {
                Debug.Log("로그아웃 성공");
                PlayerPrefs.DeleteKey("UserID");
                PlayerPrefs.DeleteKey("Username");
                PlayerPrefs.DeleteKey("SessionID");
            }
        }
        else
        {
            Debug.LogError($"로그아웃 오류: {webRequest.error}");
        }
    }
}
```

### 5. 완전한 VR 콘텐츠 매니저 예제
```csharp
using System.Collections;
using UnityEngine;

public class VRContentManager : MonoBehaviour
{
    [Header("사용자 설정")]
    public string defaultUsername = "VRUser001";
    
    [Header("콘텐츠 설정")]
    public string currentContentName = "VR Experience Demo";
    
    private VRUserManager userManager;
    private string contentStartTime;
    private bool isContentRunning = false;
    
    void Start()
    {
        userManager = GetComponent<VRUserManager>();
        if (userManager == null)
        {
            userManager = gameObject.AddComponent<VRUserManager>();
        }
        
        // 자동 로그인 또는 등록
        StartCoroutine(InitializeUser());
    }
    
    IEnumerator InitializeUser()
    {
        string savedUsername = PlayerPrefs.GetString("Username");
        
        if (string.IsNullOrEmpty(savedUsername))
        {
            // 새 사용자 등록
            yield return StartCoroutine(userManager.RegisterUser(defaultUsername));
        }
        else
        {
            // 기존 사용자 로그인
            yield return StartCoroutine(userManager.LoginUser(savedUsername));
        }
        
        // 콘텐츠 시작
        StartContent();
    }
    
    public void StartContent()
    {
        if (!isContentRunning)
        {
            contentStartTime = System.DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
            isContentRunning = true;
            
            StartCoroutine(userManager.LogContentUsage(currentContentName, contentStartTime));
            Debug.Log($"콘텐츠 시작: {currentContentName}");
        }
    }
    
    public void EndContent()
    {
        if (isContentRunning)
        {
            string endTime = System.DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
            isContentRunning = false;
            
            StartCoroutine(userManager.LogContentUsage(currentContentName, contentStartTime, endTime));
            Debug.Log($"콘텐츠 종료: {currentContentName}");
        }
    }
    
    void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus && isContentRunning)
        {
            EndContent();
        }
    }
    
    void OnApplicationQuit()
    {
        if (isContentRunning)
        {
            // 동기적으로 처리하기 위해 코루틴 대신 직접 호출
            StartCoroutine(userManager.LogoutUser());
            EndContent();
        }
    }
}
```

## 사용 방법

1. **VRContentManager** 스크립트를 빈 게임오브젝트에 추가
2. **defaultUsername**을 고유한 값으로 설정
3. **currentContentName**을 현재 VR 콘텐츠 이름으로 설정
4. 플레이 시 자동으로 사용자 등록/로그인 및 콘텐츠 로깅 시작

## 주요 기능

- ✅ 사용자 자동 등록 및 로그인
- ✅ 세션 시작/종료 시간 자동 추적
- ✅ 콘텐츠 사용 시작/종료 시간 기록
- ✅ 앱 종료 시 자동 로그아웃
- ✅ PlayerPrefs를 통한 사용자 정보 저장
- ✅ 오류 처리 및 로깅

이제 Unity VR 앱에서 사용자별 콘텐츠 사용 기록을 자동으로 추적할 수 있습니다!