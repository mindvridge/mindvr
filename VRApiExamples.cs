using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Unity VR API 사용 예시 모음집
/// 
/// 이 파일은 VRApiManager를 다양한 시나리오에서 사용하는 방법을 보여줍니다.
/// 실제 프로젝트에서는 필요한 부분만 참조하여 구현하세요.
/// </summary>

#region 기본 사용 예시 - 간단한 게임 컨트롤러

/// <summary>
/// 예시 1: 간단한 VR 게임 컨트롤러
/// 추천 사용법: 대부분의 VR 애플리케이션에서 이 패턴을 사용하세요
/// </summary>
public class SimpleVRGameController : MonoBehaviour
{
    [Header("=== 설정 ===")]
    [SerializeField] private string gameName = "VR Racing Game";
    [SerializeField] private bool useUnifiedLogging = true; // VR + 콘텐츠 로깅 동시 사용
    
    private VRApiManager apiManager;
    private bool gameInProgress = false;
    
    void Start()
    {
        // VRApiManager 찾기
        apiManager = FindObjectOfType<VRApiManager>();
        if (apiManager == null)
        {
            Debug.LogError("VRApiManager를 찾을 수 없습니다. 씬에 VRApiManager를 추가해주세요.");
            return;
        }
        
        // 이벤트 구독 (선택사항)
        apiManager.OnSessionStarted += OnSessionStarted;
        apiManager.OnSessionEnded += OnSessionEnded;
        apiManager.OnApiError += OnApiError;
    }
    
    void OnDestroy()
    {
        // 이벤트 구독 해제
        if (apiManager != null)
        {
            apiManager.OnSessionStarted -= OnSessionStarted;
            apiManager.OnSessionEnded -= OnSessionEnded;
            apiManager.OnApiError -= OnApiError;
        }
    }
    
    /// <summary>
    /// 게임 시작 - 가장 간단한 사용법
    /// </summary>
    public void StartGame()
    {
        if (gameInProgress)
        {
            Debug.Log("이미 게임이 진행 중입니다.");
            return;
        }
        
        gameInProgress = true;
        
        if (useUnifiedLogging)
        {
            // 추천: VR 기기 로깅 + 사용자 콘텐츠 로깅 동시 시작
            apiManager.StartUnifiedSession(gameName);
        }
        else
        {
            // 또는 개별적으로 시작
            apiManager.StartVRSession(gameName);
            apiManager.StartContentSession(gameName);
        }
        
        Debug.Log($"게임 시작: {gameName}");
    }
    
    /// <summary>
    /// 게임 종료
    /// </summary>
    public void EndGame()
    {
        if (!gameInProgress)
        {
            Debug.Log("진행 중인 게임이 없습니다.");
            return;
        }
        
        gameInProgress = false;
        
        if (useUnifiedLogging)
        {
            apiManager.EndUnifiedSession(gameName);
        }
        else
        {
            apiManager.EndVRSession(gameName);
            apiManager.EndContentSession(gameName);
        }
        
        Debug.Log($"게임 종료: {gameName}");
    }
    
    // 이벤트 핸들러 (선택사항)
    private void OnSessionStarted(string sessionInfo)
    {
        Debug.Log($"세션 시작됨: {sessionInfo}");
    }
    
    private void OnSessionEnded(string sessionInfo, double durationMinutes)
    {
        Debug.Log($"세션 종료됨: {sessionInfo}, 사용시간: {durationMinutes:F1}분");
    }
    
    private void OnApiError(string error)
    {
        Debug.LogError($"API 오류: {error}");
    }
}

#endregion

#region 고급 예시 - 교육용 VR 애플리케이션

/// <summary>
/// 예시 2: 교육용 VR 애플리케이션
/// 여러 콘텐츠를 순차적으로 진행하는 경우
/// </summary>
public class EducationalVRController : MonoBehaviour
{
    [Header("=== 수업 콘텐츠 목록 ===")]
    [SerializeField] private string[] lessonContents = {
        "Biology - Cell Structure",
        "Biology - DNA Analysis", 
        "Biology - Photosynthesis",
        "Biology - Final Quiz"
    };
    
    [Header("=== UI 연결 ===")]
    [SerializeField] private Text currentLessonText;
    [SerializeField] private Text progressText;
    [SerializeField] private Button nextLessonButton;
    [SerializeField] private Button prevLessonButton;
    
    private VRApiManager apiManager;
    private int currentLessonIndex = 0;
    private bool lessonInProgress = false;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
        
        if (apiManager != null)
        {
            apiManager.OnUserLoggedIn += OnUserLoggedIn;
            apiManager.OnSessionEnded += OnLessonEnded;
        }
        
        UpdateUI();
    }
    
    /// <summary>
    /// 학생 로그인
    /// </summary>
    public void LoginStudent(string studentName)
    {
        if (string.IsNullOrEmpty(studentName))
        {
            Debug.LogError("학생 이름이 비어있습니다.");
            return;
        }
        
        StartCoroutine(apiManager.LoginUser(studentName));
    }
    
    /// <summary>
    /// 현재 수업 시작
    /// </summary>
    public void StartCurrentLesson()
    {
        if (!apiManager.IsLoggedIn)
        {
            Debug.LogError("로그인이 필요합니다.");
            return;
        }
        
        if (lessonInProgress)
        {
            Debug.Log("이미 수업이 진행 중입니다.");
            return;
        }
        
        string currentLesson = lessonContents[currentLessonIndex];
        lessonInProgress = true;
        
        // 교육 콘텐츠는 사용자 기반 로깅을 주로 사용
        apiManager.StartContentSession(currentLesson);
        
        Debug.Log($"수업 시작: {currentLesson}");
        UpdateUI();
    }
    
    /// <summary>
    /// 현재 수업 종료 및 다음 수업으로 진행
    /// </summary>
    public void CompleteCurrentLesson()
    {
        if (!lessonInProgress) return;
        
        string currentLesson = lessonContents[currentLessonIndex];
        lessonInProgress = false;
        
        apiManager.EndContentSession(currentLesson);
        
        // 다음 수업으로 자동 진행
        if (currentLessonIndex < lessonContents.Length - 1)
        {
            currentLessonIndex++;
            Debug.Log($"다음 수업으로 진행: {lessonContents[currentLessonIndex]}");
        }
        else
        {
            Debug.Log("모든 수업이 완료되었습니다!");
        }
        
        UpdateUI();
    }
    
    /// <summary>
    /// 수업 진도 관리
    /// </summary>
    public void GoToNextLesson()
    {
        if (lessonInProgress)
        {
            CompleteCurrentLesson();
        }
        else if (currentLessonIndex < lessonContents.Length - 1)
        {
            currentLessonIndex++;
            UpdateUI();
        }
    }
    
    public void GoToPreviousLesson()
    {
        if (lessonInProgress)
        {
            apiManager.EndContentSession(lessonContents[currentLessonIndex]);
            lessonInProgress = false;
        }
        
        if (currentLessonIndex > 0)
        {
            currentLessonIndex--;
            UpdateUI();
        }
    }
    
    private void UpdateUI()
    {
        if (currentLessonText != null)
        {
            currentLessonText.text = $"현재 수업: {lessonContents[currentLessonIndex]}";
        }
        
        if (progressText != null)
        {
            progressText.text = $"진도: {currentLessonIndex + 1}/{lessonContents.Length}";
        }
        
        if (nextLessonButton != null)
        {
            nextLessonButton.interactable = currentLessonIndex < lessonContents.Length - 1;
        }
        
        if (prevLessonButton != null)
        {
            prevLessonButton.interactable = currentLessonIndex > 0;
        }
    }
    
    private void OnUserLoggedIn(UserData user, SessionData session)
    {
        Debug.Log($"학생 로그인 완료: {user.username}");
        UpdateUI();
    }
    
    private void OnLessonEnded(string sessionInfo, double durationMinutes)
    {
        Debug.Log($"수업 완료: {sessionInfo}, 학습시간: {durationMinutes:F1}분");
    }
}

#endregion

#region VR 체험관 운영 예시

/// <summary>
/// 예시 3: VR 체험관 운영 시스템
/// 여러 기기와 사용자를 관리하는 경우
/// </summary>
public class VRExperienceCenterManager : MonoBehaviour
{
    [Header("=== 체험관 설정 ===")]
    [SerializeField] private string[] availableContents = {
        "Space Exploration",
        "Ocean Adventure", 
        "Historical Journey",
        "Art Gallery VR"
    };
    
    [Header("=== UI 연결 ===")]
    [SerializeField] private Dropdown contentDropdown;
    [SerializeField] private InputField userNameInput;
    [SerializeField] private Text currentUserText;
    [SerializeField] private Text activeSessionsText;
    [SerializeField] private Button startButton;
    [SerializeField] private Button endButton;
    
    private VRApiManager apiManager;
    private string selectedContent;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
        
        if (apiManager != null)
        {
            apiManager.OnUserLoggedIn += OnUserChanged;
            apiManager.OnUserLoggedOut += OnUserLoggedOut;
            apiManager.OnSessionStarted += OnSessionUpdate;
            apiManager.OnSessionEnded += OnSessionUpdate;
        }
        
        SetupContentDropdown();
        UpdateUI();
    }
    
    /// <summary>
    /// 콘텐츠 선택 드롭다운 설정
    /// </summary>
    private void SetupContentDropdown()
    {
        if (contentDropdown != null)
        {
            contentDropdown.ClearOptions();
            contentDropdown.AddOptions(new List<string>(availableContents));
            contentDropdown.onValueChanged.AddListener(OnContentSelected);
            
            // 첫 번째 콘텐츠 선택
            if (availableContents.Length > 0)
            {
                selectedContent = availableContents[0];
            }
        }
    }
    
    /// <summary>
    /// 사용자 체크인 (로그인)
    /// </summary>
    public void CheckInUser()
    {
        string userName = userNameInput?.text?.Trim();
        
        if (string.IsNullOrEmpty(userName))
        {
            Debug.LogError("사용자 이름을 입력해주세요.");
            return;
        }
        
        StartCoroutine(apiManager.LoginUser(userName));
    }
    
    /// <summary>
    /// 사용자 체크아웃 (로그아웃)
    /// </summary>
    public void CheckOutUser()
    {
        // 모든 진행 중인 세션 종료
        apiManager.EndAllActiveSessions();
        
        // 로그아웃
        StartCoroutine(apiManager.LogoutUser());
    }
    
    /// <summary>
    /// VR 체험 시작
    /// </summary>
    public void StartVRExperience()
    {
        if (string.IsNullOrEmpty(selectedContent))
        {
            Debug.LogError("콘텐츠를 선택해주세요.");
            return;
        }
        
        if (!apiManager.IsLoggedIn)
        {
            Debug.LogError("먼저 체크인해주세요.");
            return;
        }
        
        // 통합 세션 시작 (기기 + 사용자 로깅)
        apiManager.StartUnifiedSession(selectedContent);
        
        Debug.Log($"VR 체험 시작: {selectedContent}");
        UpdateUI();
    }
    
    /// <summary>
    /// VR 체험 종료
    /// </summary>
    public void EndVRExperience()
    {
        if (string.IsNullOrEmpty(selectedContent))
        {
            return;
        }
        
        apiManager.EndUnifiedSession(selectedContent);
        
        Debug.Log($"VR 체험 종료: {selectedContent}");
        UpdateUI();
    }
    
    /// <summary>
    /// 긴급 상황시 모든 세션 종료
    /// </summary>
    public void EmergencyStopAll()
    {
        apiManager.EndAllActiveSessions();
        Debug.Log("긴급 정지: 모든 세션이 종료되었습니다.");
        UpdateUI();
    }
    
    private void OnContentSelected(int index)
    {
        if (index >= 0 && index < availableContents.Length)
        {
            selectedContent = availableContents[index];
            Debug.Log($"콘텐츠 선택: {selectedContent}");
        }
    }
    
    private void UpdateUI()
    {
        if (currentUserText != null)
        {
            if (apiManager.IsLoggedIn)
            {
                currentUserText.text = $"현재 사용자: {apiManager.CurrentUser.username}";
            }
            else
            {
                currentUserText.text = "현재 사용자: 없음";
            }
        }
        
        if (activeSessionsText != null)
        {
            int sessionCount = apiManager.GetActiveSessionCount();
            activeSessionsText.text = $"활성 세션: {sessionCount}개";
        }
        
        bool hasActiveSession = !string.IsNullOrEmpty(selectedContent) && 
                              apiManager.IsSessionActive(selectedContent);
        
        if (startButton != null)
        {
            startButton.interactable = apiManager.IsLoggedIn && !hasActiveSession;
        }
        
        if (endButton != null)
        {
            endButton.interactable = hasActiveSession;
        }
    }
    
    private void OnUserChanged(UserData user, SessionData session)
    {
        Debug.Log($"사용자 체크인: {user.username}");
        UpdateUI();
    }
    
    private void OnUserLoggedOut()
    {
        Debug.Log("사용자 체크아웃 완료");
        UpdateUI();
    }
    
    private void OnSessionUpdate(string sessionInfo)
    {
        UpdateUI();
    }
    
    private void OnSessionUpdate(string sessionInfo, double duration)
    {
        Debug.Log($"세션 완료: {sessionInfo} (사용시간: {duration:F1}분)");
        UpdateUI();
    }
}

#endregion

#region 콘텐츠 브라우저 예시

/// <summary>
/// 예시 4: 콘텐츠 브라우저 및 관리
/// 서버에서 콘텐츠 목록을 가져와서 표시하는 경우
/// </summary>
public class VRContentBrowser : MonoBehaviour
{
    [Header("=== UI 연결 ===")]
    [SerializeField] private Transform contentListParent;
    [SerializeField] private GameObject contentItemPrefab;
    [SerializeField] private Button refreshButton;
    [SerializeField] private Text statusText;
    [SerializeField] private InputField searchInput;
    
    private VRApiManager apiManager;
    private List<ContentData> allContents = new List<ContentData>();
    private List<GameObject> contentItemObjects = new List<GameObject>();
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
        
        if (apiManager != null)
        {
            apiManager.OnContentDataLoaded += OnContentDataLoaded;
            apiManager.OnApiError += OnContentLoadError;
        }
        
        if (refreshButton != null)
        {
            refreshButton.onClick.AddListener(RefreshContentList);
        }
        
        if (searchInput != null)
        {
            searchInput.onValueChanged.AddListener(OnSearchChanged);
        }
        
        // 시작시 콘텐츠 목록 로드
        RefreshContentList();
    }
    
    /// <summary>
    /// 콘텐츠 목록 새로고침
    /// </summary>
    public void RefreshContentList(bool forceRefresh = false)
    {
        if (statusText != null)
        {
            statusText.text = "콘텐츠 목록을 불러오는 중...";
        }
        
        apiManager.GetContentDataList(100, forceRefresh);
    }
    
    /// <summary>
    /// 콘텐츠 검색
    /// </summary>
    private void OnSearchChanged(string searchTerm)
    {
        FilterContentList(searchTerm);
    }
    
    /// <summary>
    /// 콘텐츠 목록 필터링
    /// </summary>
    private void FilterContentList(string searchTerm)
    {
        if (string.IsNullOrEmpty(searchTerm))
        {
            // 모든 콘텐츠 표시
            foreach (var item in contentItemObjects)
            {
                item.SetActive(true);
            }
        }
        else
        {
            // 검색어에 맞는 콘텐츠만 표시
            for (int i = 0; i < contentItemObjects.Count; i++)
            {
                if (i < allContents.Count)
                {
                    bool matches = allContents[i].content_name.ToLower().Contains(searchTerm.ToLower()) ||
                                 (allContents[i].description != null && 
                                  allContents[i].description.ToLower().Contains(searchTerm.ToLower()));
                    
                    contentItemObjects[i].SetActive(matches);
                }
            }
        }
    }
    
    /// <summary>
    /// 특정 콘텐츠로 VR 세션 시작
    /// </summary>
    public void StartContentSession(ContentData content)
    {
        if (content == null)
        {
            Debug.LogError("콘텐츠 데이터가 null입니다.");
            return;
        }
        
        if (!apiManager.IsLoggedIn)
        {
            Debug.LogError("VR 세션을 시작하려면 먼저 로그인해주세요.");
            return;
        }
        
        Debug.Log($"콘텐츠 세션 시작: {content.content_name}");
        apiManager.StartUnifiedSession(content.content_name);
    }
    
    private void OnContentDataLoaded(ContentData[] contents)
    {
        allContents.Clear();
        allContents.AddRange(contents);
        
        Debug.Log($"콘텐츠 {contents.Length}개 로드됨");
        
        if (statusText != null)
        {
            statusText.text = $"총 {contents.Length}개의 콘텐츠가 있습니다.";
        }
        
        UpdateContentListUI();
    }
    
    private void OnContentLoadError(string error)
    {
        Debug.LogError($"콘텐츠 로드 오류: {error}");
        
        if (statusText != null)
        {
            statusText.text = $"오류: {error}";
        }
    }
    
    private void UpdateContentListUI()
    {
        // 기존 UI 아이템 정리
        foreach (var item in contentItemObjects)
        {
            if (item != null) Destroy(item);
        }
        contentItemObjects.Clear();
        
        // 새 UI 아이템 생성
        foreach (var content in allContents)
        {
            if (contentItemPrefab != null && contentListParent != null)
            {
                GameObject item = Instantiate(contentItemPrefab, contentListParent);
                contentItemObjects.Add(item);
                
                // 콘텐츠 아이템 UI 설정
                VRContentItemUI itemUI = item.GetComponent<VRContentItemUI>();
                if (itemUI != null)
                {
                    itemUI.SetContentData(content, this);
                }
            }
        }
    }
}

/// <summary>
/// 콘텐츠 아이템 UI 컴포넌트
/// </summary>
public class VRContentItemUI : MonoBehaviour
{
    [Header("=== UI 컴포넌트 ===")]
    [SerializeField] private Text nameText;
    [SerializeField] private Text descriptionText;
    [SerializeField] private Text fileSizeText;
    [SerializeField] private Text fileTypeText;
    [SerializeField] private Button playButton;
    [SerializeField] private Image thumbnailImage; // 선택사항
    
    private ContentData contentData;
    private VRContentBrowser browser;
    
    public void SetContentData(ContentData data, VRContentBrowser contentBrowser)
    {
        contentData = data;
        browser = contentBrowser;
        UpdateUI();
    }
    
    private void UpdateUI()
    {
        if (contentData == null) return;
        
        if (nameText != null)
            nameText.text = contentData.content_name;
        
        if (descriptionText != null)
            descriptionText.text = contentData.description ?? "설명 없음";
        
        if (fileSizeText != null)
            fileSizeText.text = contentData.GetFormattedFileSize();
        
        if (fileTypeText != null)
            fileTypeText.text = contentData.file_type ?? "타입 정보 없음";
        
        if (playButton != null)
        {
            playButton.onClick.RemoveAllListeners();
            playButton.onClick.AddListener(() => browser.StartContentSession(contentData));
        }
    }
}

#endregion

#region 새로운 API 사용 예시 - 계정 확인 및 자동 로그인

/// <summary>
/// 예시 4: 새로운 API 기능 사용법 (계정 확인 및 자동 로그인)
/// Unity에서 check_user와 auto_login API를 사용하는 방법
/// </summary>
public class NewApiExampleController : MonoBehaviour
{
    [Header("=== 사용자 설정 ===")]
    [SerializeField] private InputField usernameInput;
    [SerializeField] private Text statusText;
    [SerializeField] private Button checkUserButton;
    [SerializeField] private Button autoLoginButton;
    [SerializeField] private Button manualLoginButton;
    
    [Header("=== 콘텐츠 설정 ===")]
    [SerializeField] private string testContentName = "VR Demo Experience";
    [SerializeField] private Button startExperienceButton;
    [SerializeField] private Button endExperienceButton;
    
    private VRApiManager apiManager;
    private bool experienceRunning = false;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
        if (apiManager == null)
        {
            Debug.LogError("VRApiManager를 찾을 수 없습니다!");
            return;
        }
        
        // 이벤트 구독
        apiManager.OnUserLoggedIn += OnUserLoggedIn;
        apiManager.OnUserLoggedOut += OnUserLoggedOut;
        apiManager.OnApiError += OnApiError;
        apiManager.OnSessionStarted += OnSessionStarted;
        apiManager.OnSessionEnded += OnSessionEnded;
        
        UpdateUI();
    }
    
    void OnDestroy()
    {
        if (apiManager != null)
        {
            apiManager.OnUserLoggedIn -= OnUserLoggedIn;
            apiManager.OnUserLoggedOut -= OnUserLoggedOut;
            apiManager.OnApiError -= OnApiError;
            apiManager.OnSessionStarted -= OnSessionStarted;
            apiManager.OnSessionEnded -= OnSessionEnded;
        }
    }
    
    /// <summary>
    /// 계정 존재 여부 확인
    /// </summary>
    public void CheckUserAccount()
    {
        string username = usernameInput?.text?.Trim();
        if (string.IsNullOrEmpty(username))
        {
            UpdateStatus("사용자명을 입력해주세요.");
            return;
        }
        
        UpdateStatus($"계정 확인 중: {username}...");
        
        StartCoroutine(apiManager.CheckUserExists(username, (exists) =>
        {
            if (exists)
            {
                UpdateStatus($"✓ 계정 존재: {username}");
                Debug.Log($"계정이 존재합니다: {username}");
            }
            else
            {
                UpdateStatus($"✗ 계정 없음: {username} (자동 생성 가능)");
                Debug.Log($"계정이 존재하지 않습니다: {username}");
            }
            UpdateUI();
        }));
    }
    
    /// <summary>
    /// 자동 로그인 (계정이 없으면 자동 생성)
    /// </summary>
    public void AutoLoginUser()
    {
        string username = usernameInput?.text?.Trim();
        if (string.IsNullOrEmpty(username))
        {
            UpdateStatus("사용자명을 입력해주세요.");
            return;
        }
        
        UpdateStatus($"자동 로그인 중: {username}...");
        
        StartCoroutine(apiManager.AutoLogin(username));
    }
    
    /// <summary>
    /// 수동 로그인 (기존 방식)
    /// </summary>
    public void ManualLoginUser()
    {
        string username = usernameInput?.text?.Trim();
        if (string.IsNullOrEmpty(username))
        {
            UpdateStatus("사용자명을 입력해주세요.");
            return;
        }
        
        UpdateStatus($"수동 로그인 중: {username}...");
        
        StartCoroutine(apiManager.LoginUser(username));
    }
    
    /// <summary>
    /// VR 체험 시작 (통합 세션)
    /// </summary>
    public void StartVRExperience()
    {
        if (!apiManager.IsLoggedIn)
        {
            UpdateStatus("먼저 로그인해주세요.");
            return;
        }
        
        if (experienceRunning)
        {
            UpdateStatus("이미 체험이 진행 중입니다.");
            return;
        }
        
        apiManager.StartUnifiedSession(testContentName);
        experienceRunning = true;
        
        UpdateStatus($"VR 체험 시작: {testContentName}");
        UpdateUI();
    }
    
    /// <summary>
    /// VR 체험 종료
    /// </summary>
    public void EndVRExperience()
    {
        if (!experienceRunning)
        {
            UpdateStatus("진행 중인 체험이 없습니다.");
            return;
        }
        
        apiManager.EndUnifiedSession(testContentName);
        experienceRunning = false;
        
        UpdateStatus($"VR 체험 종료: {testContentName}");
        UpdateUI();
    }
    
    /// <summary>
    /// 로그아웃
    /// </summary>
    public void LogoutUser()
    {
        if (!apiManager.IsLoggedIn)
        {
            UpdateStatus("로그인된 사용자가 없습니다.");
            return;
        }
        
        UpdateStatus("로그아웃 중...");
        StartCoroutine(apiManager.LogoutUser());
    }
    
    private void UpdateStatus(string message)
    {
        if (statusText != null)
        {
            statusText.text = $"[{System.DateTime.Now:HH:mm:ss}] {message}";
        }
        Debug.Log($"Status: {message}");
    }
    
    private void UpdateUI()
    {
        bool isLoggedIn = apiManager.IsLoggedIn;
        bool hasUsername = !string.IsNullOrEmpty(usernameInput?.text?.Trim());
        
        if (checkUserButton != null)
            checkUserButton.interactable = hasUsername && !isLoggedIn;
            
        if (autoLoginButton != null)
            autoLoginButton.interactable = hasUsername && !isLoggedIn;
            
        if (manualLoginButton != null)
            manualLoginButton.interactable = hasUsername && !isLoggedIn;
            
        if (startExperienceButton != null)
            startExperienceButton.interactable = isLoggedIn && !experienceRunning;
            
        if (endExperienceButton != null)
            endExperienceButton.interactable = isLoggedIn && experienceRunning;
    }
    
    // 이벤트 핸들러
    private void OnUserLoggedIn(UserData user, SessionData session)
    {
        UpdateStatus($"✓ 로그인 성공: {user.username}");
        UpdateUI();
    }
    
    private void OnUserLoggedOut()
    {
        UpdateStatus("로그아웃 완료");
        experienceRunning = false;
        UpdateUI();
    }
    
    private void OnApiError(string error)
    {
        UpdateStatus($"❌ 오류: {error}");
        UpdateUI();
    }
    
    private void OnSessionStarted(string sessionInfo)
    {
        UpdateStatus($"세션 시작: {sessionInfo}");
    }
    
    private void OnSessionEnded(string sessionInfo, double duration)
    {
        UpdateStatus($"세션 종료: {sessionInfo} (사용시간: {duration:F1}분)");
    }
}

/// <summary>
/// 스크립트 사용 예시: 간단한 자동화된 VR 시스템
/// </summary>
public class AutomatedVRSystem : MonoBehaviour
{
    [Header("=== 자동화 설정 ===")]
    [SerializeField] private string[] testUsers = { "TestUser1", "TestUser2", "TestUser3" };
    [SerializeField] private string[] contentList = { "Training Module 1", "Training Module 2", "Assessment" };
    [SerializeField] private float sessionDuration = 30f; // 초 단위
    
    private VRApiManager apiManager;
    private int currentUserIndex = 0;
    private int currentContentIndex = 0;
    
    void Start()
    {
        apiManager = FindObjectOfType<VRApiManager>();
        
        if (apiManager == null)
        {
            Debug.LogError("VRApiManager를 찾을 수 없습니다!");
            return;
        }
        
        // 자동 테스트 시작
        StartCoroutine(AutomatedTestSequence());
    }
    
    /// <summary>
    /// 자동화된 테스트 시퀀스
    /// 여러 사용자로 자동 로그인하고 콘텐츠를 순차적으로 실행
    /// </summary>
    private IEnumerator AutomatedTestSequence()
    {
        Debug.Log("=== 자동화된 VR 시스템 테스트 시작 ===");
        
        foreach (string username in testUsers)
        {
            Debug.Log($"\n--- 사용자 테스트 시작: {username} ---");
            
            // 1. 계정 존재 확인
            bool userExists = false;
            yield return StartCoroutine(apiManager.CheckUserExists(username, (exists) =>
            {
                userExists = exists;
                Debug.Log($"계정 존재 여부: {username} = {exists}");
            }));
            
            yield return new WaitForSeconds(1f);
            
            // 2. 자동 로그인
            yield return StartCoroutine(apiManager.AutoLogin(username));
            yield return new WaitForSeconds(1f);
            
            if (!apiManager.IsLoggedIn)
            {
                Debug.LogError($"로그인 실패: {username}");
                continue;
            }
            
            // 3. 각 콘텐츠를 순차적으로 실행
            foreach (string content in contentList)
            {
                Debug.Log($"콘텐츠 실행: {content}");
                
                // 세션 시작
                apiManager.StartUnifiedSession(content);
                yield return new WaitForSeconds(sessionDuration);
                
                // 세션 종료
                apiManager.EndUnifiedSession(content);
                yield return new WaitForSeconds(1f);
            }
            
            // 4. 로그아웃
            yield return StartCoroutine(apiManager.LogoutUser());
            yield return new WaitForSeconds(2f);
            
            Debug.Log($"--- 사용자 테스트 완료: {username} ---");
        }
        
        Debug.Log("=== 자동화된 VR 시스템 테스트 완료 ===");
    }
}

#endregion