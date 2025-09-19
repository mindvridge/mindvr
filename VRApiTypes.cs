using System;
using UnityEngine;

/// <summary>
/// Unity VR API에서 사용하는 모든 데이터 타입 정의
/// </summary>

#region API 요청/응답 타입

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
    public object data; // 실제 사용시에는 적절한 타입으로 변환 필요
    public string error;
}

#endregion

#region 사용자 관련 타입

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
}

[System.Serializable]
public class LoginData
{
    public UserData user;
    public SessionData session;
}

[System.Serializable]
public class UserExistsData
{
    public bool exists;
    public string message;
}

#endregion

#region VR 로그 관련 타입

[System.Serializable]
public class VRUsageLog
{
    public string id;
    public string user_id;
    public string device_id;
    public string content_name;
    public string start_time;
    public string end_time;
    public int duration_minutes;
    public string created_at;
    public string updated_at;
    public UserData users; // 조인된 사용자 데이터
}

[System.Serializable]
public class VRLogResponse
{
    public bool success;
    public string message;
    public VRUsageLog[] data;
    public string error;
}

#endregion

#region 콘텐츠 데이터 관련 타입

[System.Serializable]
public class ContentData
{
    public string id;
    public string content_name;
    public string content_filename;
    public string description;
    public long file_size;
    public string file_type;
    public string created_at;
    public string updated_at;
    
    /// <summary>
    /// 파일 크기를 읽기 쉬운 형태로 변환
    /// </summary>
    /// <returns>포맷된 파일 크기</returns>
    public string GetFormattedFileSize()
    {
        if (file_size < 1024) return $"{file_size} B";
        if (file_size < 1024 * 1024) return $"{file_size / 1024f:F1} KB";
        if (file_size < 1024 * 1024 * 1024) return $"{file_size / (1024f * 1024f):F1} MB";
        return $"{file_size / (1024f * 1024f * 1024f):F1} GB";
    }
}

[System.Serializable]
public class ContentDataResponse
{
    public bool success;
    public string message;
    public ContentData[] data;
    public string error;
}

#endregion

#region 세션 추적 관련 타입

public enum SessionType
{
    VR,      // VR 기기 기반 세션
    Content  // 사용자 기반 콘텐츠 세션
}

[System.Serializable]
public class SessionTracker
{
    public string contentName;
    public DateTime startTime;
    public SessionType sessionType;
    
    /// <summary>
    /// 현재까지의 세션 지속 시간 (분)
    /// </summary>
    public double GetCurrentDurationMinutes()
    {
        return (DateTime.UtcNow - startTime).TotalMinutes;
    }
    
    /// <summary>
    /// 세션이 활성화된 지 경과된 시간을 문자열로 반환
    /// </summary>
    public string GetElapsedTimeString()
    {
        TimeSpan elapsed = DateTime.UtcNow - startTime;
        
        if (elapsed.TotalMinutes < 1)
            return $"{elapsed.Seconds}초";
        else if (elapsed.TotalHours < 1)
            return $"{elapsed.Minutes}분 {elapsed.Seconds}초";
        else
            return $"{elapsed.Hours}시간 {elapsed.Minutes}분";
    }
}

#endregion

#region 통계 데이터 타입

[System.Serializable]
public class ContentUsageStats
{
    public string content_name;
    public int total_usage_minutes;
    public int usage_count;
    public float avg_usage_minutes;
}

[System.Serializable]
public class DeviceUsageStats
{
    public string device_id;
    public int total_usage_minutes;
    public int session_count;
    public string last_used;
}

[System.Serializable]
public class UserUsageStats
{
    public string username;
    public int total_content_sessions;
    public int total_learning_minutes;
    public string last_login;
    public string favorite_content; // 가장 많이 사용한 콘텐츠
}

#endregion

#region 이벤트 데이터 타입

[System.Serializable]
public class SessionEventData
{
    public string contentName;
    public SessionType sessionType;
    public DateTime timestamp;
    public double durationMinutes;
    public string deviceId;
    public string username;
}

[System.Serializable]
public class ApiErrorEventData
{
    public string errorMessage;
    public string action;
    public DateTime timestamp;
    public string details;
}

#endregion

#region 설정 관련 타입

[System.Serializable]
public class VRApiSettings
{
    [Header("=== 기본 설정 ===")]
    public string deviceId = "VR_DEVICE_001";
    public string defaultUsername = "VRUser";
    public bool autoInitializeUser = true;
    
    [Header("=== 네트워크 설정 ===")]
    public int timeoutSeconds = 30;
    public int maxRetryAttempts = 3;
    
    [Header("=== 캐시 설정 ===")]
    public int contentDataCacheHours = 1;
    public bool enableDataCache = true;
    
    [Header("=== 디버그 설정 ===")]
    public bool enableDebugLogs = true;
    public bool enableDetailedLogs = false;
    public bool logSessionEvents = true;
}

#endregion

#region 확장 타입 (미래 기능용)

[System.Serializable]
public class VRPerformanceData
{
    public string contentName;
    public float averageFPS;
    public float maxFPS;
    public float minFPS;
    public int frameDropCount;
    public float renderTime;
    public DateTime timestamp;
}

[System.Serializable]
public class ContentRecommendation
{
    public ContentData content;
    public float relevanceScore;
    public string reason; // 추천 이유
    public string[] tags;
}

[System.Serializable]
public class VRHealthData
{
    public string username;
    public DateTime sessionStart;
    public int blinkCount;
    public float headMovementIntensity;
    public int breaksSuggested;
    public bool comfortWarningTriggered;
}

#endregion