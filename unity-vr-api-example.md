# Unity VR에서 로그 API 사용 예시

## API 엔드포인트
```
POST https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api
GET https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api
```

## Unity C# 코드 예시

### 1. 로그 전송 스크립트 (VRLogManager.cs)

```csharp
using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

[System.Serializable]
public class VRLogData
{
    public string device_id;
    public string content_name;
    public string start_time;
    public string end_time;
}

[System.Serializable]
public class VRLogResponse
{
    public bool success;
    public string message;
    public VRLogData data;
}

public class VRLogManager : MonoBehaviour
{
    private const string API_URL = "https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api";
    
    [Header("VR 설정")]
    public string deviceId = "VR_DEVICE_001";
    public string currentContentName = "VR_Experience_Demo";
    
    private DateTime sessionStartTime;
    private bool sessionActive = false;

    void Start()
    {
        // 기기 ID가 설정되지 않았다면 자동 생성
        if (string.IsNullOrEmpty(deviceId))
        {
            deviceId = $"VR_DEVICE_{SystemInfo.deviceUniqueIdentifier.Substring(0, 8).ToUpper()}";
        }
        
        Debug.Log($"VR 로그 매니저 초기화 완료. 기기 ID: {deviceId}");
    }

    /// <summary>
    /// VR 세션 시작
    /// </summary>
    public void StartVRSession(string contentName = null)
    {
        if (sessionActive)
        {
            Debug.LogWarning("이미 활성화된 세션이 있습니다. 먼저 종료해주세요.");
            return;
        }

        sessionStartTime = DateTime.Now;
        sessionActive = true;
        
        if (!string.IsNullOrEmpty(contentName))
        {
            currentContentName = contentName;
        }

        VRLogData logData = new VRLogData
        {
            device_id = deviceId,
            content_name = currentContentName,
            start_time = sessionStartTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        StartCoroutine(SendLogToAPI(logData));
        Debug.Log($"VR 세션 시작: {currentContentName}");
    }

    /// <summary>
    /// VR 세션 종료
    /// </summary>
    public void EndVRSession()
    {
        if (!sessionActive)
        {
            Debug.LogWarning("활성화된 세션이 없습니다.");
            return;
        }

        DateTime endTime = DateTime.Now;
        sessionActive = false;

        VRLogData logData = new VRLogData
        {
            device_id = deviceId,
            content_name = currentContentName,
            start_time = sessionStartTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            end_time = endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        StartCoroutine(SendLogToAPI(logData));
        Debug.Log($"VR 세션 종료: {currentContentName}");
    }

    /// <summary>
    /// 완료된 세션 로그 전송 (시작/종료 시간이 모두 있는 경우)
    /// </summary>
    public void SendCompletedSession(string contentName, DateTime startTime, DateTime endTime)
    {
        VRLogData logData = new VRLogData
        {
            device_id = deviceId,
            content_name = contentName,
            start_time = startTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            end_time = endTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        StartCoroutine(SendLogToAPI(logData));
    }

    /// <summary>
    /// API로 로그 데이터 전송
    /// </summary>
    private IEnumerator SendLogToAPI(VRLogData logData)
    {
        string jsonData = JsonUtility.ToJson(logData);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);

        using (UnityWebRequest request = new UnityWebRequest(API_URL, "POST"))
        {
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    VRLogResponse response = JsonUtility.FromJson<VRLogResponse>(request.downloadHandler.text);
                    if (response.success)
                    {
                        Debug.Log($"로그 전송 성공: {response.message}");
                    }
                    else
                    {
                        Debug.LogError($"로그 전송 실패: {response.message}");
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"응답 파싱 오류: {e.Message}");
                }
            }
            else
            {
                Debug.LogError($"로그 전송 오류: {request.error}");
                Debug.LogError($"응답 코드: {request.responseCode}");
                Debug.LogError($"응답 내용: {request.downloadHandler.text}");
            }
        }
    }

    /// <summary>
    /// 애플리케이션 종료 시 세션 정리
    /// </summary>
    void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus && sessionActive)
        {
            EndVRSession();
        }
    }

    void OnApplicationFocus(bool hasFocus)
    {
        if (!hasFocus && sessionActive)
        {
            EndVRSession();
        }
    }

    void OnDestroy()
    {
        if (sessionActive)
        {
            EndVRSession();
        }
    }
}
```

### 2. 사용 예시 스크립트 (VRContentController.cs)

```csharp
using UnityEngine;

public class VRContentController : MonoBehaviour
{
    private VRLogManager logManager;

    void Start()
    {
        logManager = FindObjectOfType<VRLogManager>();
        
        if (logManager == null)
        {
            Debug.LogError("VRLogManager를 찾을 수 없습니다!");
        }
    }

    /// <summary>
    /// VR 콘텐츠 시작 시 호출
    /// </summary>
    public void OnVRContentStart()
    {
        if (logManager != null)
        {
            logManager.StartVRSession("VR_Gaming_Experience");
        }
    }

    /// <summary>
    /// VR 콘텐츠 종료 시 호출
    /// </summary>
    public void OnVRContentEnd()
    {
        if (logManager != null)
        {
            logManager.EndVRSession();
        }
    }

    /// <summary>
    /// 특정 콘텐츠로 전환 시 호출
    /// </summary>
    public void SwitchToContent(string newContentName)
    {
        if (logManager != null)
        {
            // 현재 세션 종료
            logManager.EndVRSession();
            
            // 잠시 대기 후 새 세션 시작
            Invoke(nameof(StartNewContent), 0.5f);
            
            void StartNewContent()
            {
                logManager.StartVRSession(newContentName);
            }
        }
    }
}
```

### 3. Unity Inspector 설정

1. 빈 GameObject를 생성하고 이름을 "VRLogManager"로 변경
2. VRLogManager 스크립트를 추가
3. Inspector에서 다음 설정:
   - Device Id: 기기별 고유 ID (예: "VR_DEVICE_001")
   - Current Content Name: 기본 콘텐츠명 (예: "VR_Experience_Demo")

### 4. 테스트 방법

Unity 에디터에서 테스트:
```csharp
// 테스트용 버튼 이벤트
public void TestStartSession()
{
    VRLogManager logManager = FindObjectOfType<VRLogManager>();
    logManager.StartVRSession("Test_Content");
}

public void TestEndSession()
{
    VRLogManager logManager = FindObjectOfType<VRLogManager>();
    logManager.EndVRSession();
}
```

### 5. 실제 배포 시 고려사항

1. **기기 ID 설정**: 각 VR 기기마다 고유한 ID를 설정
2. **네트워크 연결 확인**: 인터넷 연결 상태 체크 후 로그 전송
3. **오프라인 지원**: 네트워크가 없을 때는 로컬에 저장 후 연결 시 전송
4. **배치 전송**: 여러 로그를 모아서 한 번에 전송하여 성능 최적화

### 6. API 응답 형태

**성공 응답:**
```json
{
  "success": true,
  "message": "로그가 성공적으로 저장되었습니다.",
  "data": {
    "id": "uuid",
    "device_id": "VR_DEVICE_001",
    "content_name": "VR_Experience_Demo",
    "start_time": "2024-01-15T10:30:00.000Z",
    "end_time": "2024-01-15T10:45:00.000Z"
  }
}
```

**오류 응답:**
```json
{
  "error": "device_id, content_name, start_time은 필수입니다."
}
```

이제 Unity VR 앱에서 위 코드를 사용하여 사용자의 VR 콘텐츠 이용 현황을 자동으로 로깅할 수 있습니다.