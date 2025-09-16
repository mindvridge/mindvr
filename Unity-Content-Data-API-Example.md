# Unity 콘텐츠 데이터 API 가이드

## API 개요

콘텐츠 데이터 목록을 Unity에서 가져올 수 있는 API 기능이 추가되었습니다.

## API 엔드포인트

**GET 요청**: `https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api?type=content_data&limit=100`

### 파라미터
- `type`: `content_data` (필수)
- `limit`: 가져올 데이터 개수 (선택, 기본값: 100, 최대: 1000)

## Unity C# 구현

### 1. 콘텐츠 데이터 클래스 정의

```csharp
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
}

[System.Serializable]
public class ContentDataResponse
{
    public bool success;
    public string message;
    public ContentData[] data;
    public string error;
}
```

### 2. VRApiManager에 콘텐츠 데이터 조회 기능 추가

```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

public class VRApiManager : MonoBehaviour
{
    private const string API_BASE_URL = "https://ewyqozozuluyfnemgsuw.supabase.co/functions/v1/vr-log-api";
    
    [Header("Content Data Settings")]
    public int contentDataLimit = 100;
    
    // 이벤트
    public event Action<ContentData[]> OnContentDataLoaded;
    public event Action<string> OnContentDataError;
    
    /// <summary>
    /// 콘텐츠 데이터 목록을 가져옵니다
    /// </summary>
    /// <param name="limit">가져올 데이터 개수 (기본값: 100, 최대: 1000)</param>
    public void GetContentDataList(int limit = 100)
    {
        StartCoroutine(GetContentDataCoroutine(limit));
    }
    
    private IEnumerator GetContentDataCoroutine(int limit)
    {
        // URL 파라미터 설정
        string url = $"{API_BASE_URL}?type=content_data&limit={Mathf.Min(limit, 1000)}";
        
        Debug.Log($"[VRApiManager] 콘텐츠 데이터 요청: {url}");
        
        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            // 헤더 설정
            request.SetRequestHeader("Content-Type", "application/json");
            
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    string responseText = request.downloadHandler.text;
                    Debug.Log($"[VRApiManager] 콘텐츠 데이터 응답: {responseText}");
                    
                    ContentDataResponse response = JsonUtility.FromJson<ContentDataResponse>(responseText);
                    
                    if (response.success)
                    {
                        Debug.Log($"[VRApiManager] 콘텐츠 데이터 {response.data.Length}개 로드 성공");
                        OnContentDataLoaded?.Invoke(response.data);
                    }
                    else
                    {
                        string errorMsg = response.error ?? "알 수 없는 오류";
                        Debug.LogError($"[VRApiManager] 콘텐츠 데이터 로드 실패: {errorMsg}");
                        OnContentDataError?.Invoke(errorMsg);
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[VRApiManager] 응답 파싱 오류: {e.Message}");
                    OnContentDataError?.Invoke($"응답 파싱 오류: {e.Message}");
                }
            }
            else
            {
                string errorMsg = $"HTTP 오류: {request.error} (Code: {request.responseCode})";
                Debug.LogError($"[VRApiManager] {errorMsg}");
                OnContentDataError?.Invoke(errorMsg);
            }
        }
    }
    
    /// <summary>
    /// 콘텐츠 데이터를 이름으로 검색합니다
    /// </summary>
    /// <param name="contentName">검색할 콘텐츠 이름</param>
    /// <param name="contentDataList">검색할 콘텐츠 데이터 목록</param>
    /// <returns>찾은 콘텐츠 데이터, 없으면 null</returns>
    public ContentData FindContentByName(string contentName, ContentData[] contentDataList)
    {
        if (contentDataList == null || string.IsNullOrEmpty(contentName))
            return null;
            
        foreach (var content in contentDataList)
        {
            if (content.content_name.Equals(contentName, StringComparison.OrdinalIgnoreCase))
            {
                return content;
            }
        }
        
        return null;
    }
}
```

### 3. 사용 예시

```csharp
using System.Collections.Generic;
using UnityEngine;

public class ContentListManager : MonoBehaviour
{
    [Header("UI References")]
    public Transform contentListParent;
    public GameObject contentItemPrefab;
    
    private VRApiManager vrApiManager;
    private List<ContentData> currentContentList = new List<ContentData>();
    
    void Start()
    {
        // VRApiManager 찾기 또는 생성
        vrApiManager = FindObjectOfType<VRApiManager>();
        if (vrApiManager == null)
        {
            GameObject apiManagerObject = new GameObject("VRApiManager");
            vrApiManager = apiManagerObject.AddComponent<VRApiManager>();
        }
        
        // 이벤트 구독
        vrApiManager.OnContentDataLoaded += OnContentDataLoaded;
        vrApiManager.OnContentDataError += OnContentDataError;
        
        // 콘텐츠 데이터 로드
        LoadContentData();
    }
    
    void OnDestroy()
    {
        // 이벤트 구독 해제
        if (vrApiManager != null)
        {
            vrApiManager.OnContentDataLoaded -= OnContentDataLoaded;
            vrApiManager.OnContentDataError -= OnContentDataError;
        }
    }
    
    public void LoadContentData()
    {
        Debug.Log("[ContentListManager] 콘텐츠 데이터 로드 시작");
        vrApiManager.GetContentDataList(50); // 최대 50개 항목 요청
    }
    
    private void OnContentDataLoaded(ContentData[] contentDataArray)
    {
        Debug.Log($"[ContentListManager] 콘텐츠 데이터 {contentDataArray.Length}개 로드됨");
        
        currentContentList.Clear();
        currentContentList.AddRange(contentDataArray);
        
        // UI 업데이트
        UpdateContentListUI();
        
        // 콘텐츠 정보 출력
        foreach (var content in contentDataArray)
        {
            Debug.Log($"콘텐츠: {content.content_name} - {content.description}");
        }
    }
    
    private void OnContentDataError(string error)
    {
        Debug.LogError($"[ContentListManager] 콘텐츠 데이터 로드 오류: {error}");
        // UI에 오류 메시지 표시
    }
    
    private void UpdateContentListUI()
    {
        // 기존 UI 아이템 제거
        foreach (Transform child in contentListParent)
        {
            Destroy(child.gameObject);
        }
        
        // 새 UI 아이템 생성
        foreach (var content in currentContentList)
        {
            GameObject item = Instantiate(contentItemPrefab, contentListParent);
            
            // UI 아이템 설정 (실제 UI 컴포넌트에 맞게 수정)
            ContentItemUI itemUI = item.GetComponent<ContentItemUI>();
            if (itemUI != null)
            {
                itemUI.SetContentData(content);
            }
        }
    }
    
    // 특정 콘텐츠 검색 예시
    public void FindAndUseContent(string contentName)
    {
        ContentData foundContent = vrApiManager.FindContentByName(contentName, currentContentList.ToArray());
        
        if (foundContent != null)
        {
            Debug.Log($"콘텐츠 발견: {foundContent.content_name}");
            // 콘텐츠 사용 로직
        }
        else
        {
            Debug.LogWarning($"콘텐츠를 찾을 수 없습니다: {contentName}");
        }
    }
}
```

### 4. 콘텐츠 아이템 UI 예시

```csharp
using UnityEngine;
using UnityEngine.UI;

public class ContentItemUI : MonoBehaviour
{
    [Header("UI Components")]
    public Text nameText;
    public Text descriptionText;
    public Text fileSizeText;
    public Text fileTypeText;
    public Button selectButton;
    
    private ContentData contentData;
    
    public void SetContentData(ContentData data)
    {
        contentData = data;
        UpdateUI();
    }
    
    private void UpdateUI()
    {
        if (contentData == null) return;
        
        nameText.text = contentData.content_name;
        descriptionText.text = contentData.description ?? "설명 없음";
        
        // 파일 크기를 읽기 쉬운 형태로 변환
        if (contentData.file_size > 0)
        {
            float sizeInMB = contentData.file_size / (1024f * 1024f);
            fileSizeText.text = $"{sizeInMB:F1} MB";
        }
        else
        {
            fileSizeText.text = "크기 정보 없음";
        }
        
        fileTypeText.text = contentData.file_type ?? "타입 정보 없음";
        
        // 버튼 이벤트 설정
        selectButton.onClick.RemoveAllListeners();
        selectButton.onClick.AddListener(() => OnContentSelected(contentData));
    }
    
    private void OnContentSelected(ContentData content)
    {
        Debug.Log($"콘텐츠 선택됨: {content.content_name}");
        // 콘텐츠 선택 시 실행할 로직
    }
}
```

## 사용 방법

1. **VRApiManager를 씬에 추가**
2. **ContentListManager 스크립트를 게임 오브젝트에 추가**
3. **UI 프리팹과 부모 오브젝트 연결**
4. **런타임에서 `LoadContentData()` 호출**

## API 응답 예시

```json
{
  "success": true,
  "message": "콘텐츠 데이터를 성공적으로 조회했습니다.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "content_name": "VR 교육 콘텐츠 1",
      "content_filename": "vr_education_01.unity3d",
      "description": "기초 VR 교육용 콘텐츠",
      "file_size": 52428800,
      "file_type": "Unity3D",
      "created_at": "2025-01-16T12:00:00Z",
      "updated_at": "2025-01-16T12:00:00Z"
    }
  ]
}
```

## 주의사항

- **네트워크 연결** 확인 필요
- **에러 처리** 구현 권장
- **로딩 상태** UI 표시 권장
- **데이터 캐싱** 고려 (성능 향상을 위해)