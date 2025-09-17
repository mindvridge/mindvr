import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =====================================
// 타입 정의
// =====================================
interface ApiRequest {
  action: 'register' | 'login' | 'logout' | 'vr_log' | 'content_log'
  username?: string
  password?: string
  device_id?: string
  content_name?: string
  start_time?: string
  end_time?: string
  session_id?: string
}

interface ApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
}

// =====================================
// 설정
// =====================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =====================================
// 메인 핸들러
// =====================================
Deno.serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // POST 요청 처리
    if (req.method === 'POST') {
      const body: ApiRequest = await req.json()
      console.log('API 요청:', JSON.stringify(body, null, 2))

      switch (body.action) {
        case 'register':
          return await handleUserRegister(supabase, body)
        case 'login':
          return await handleUserLogin(supabase, body)
        case 'logout':
          return await handleUserLogout(supabase, body)
        case 'vr_log':
          return await handleVRLog(supabase, body)
        case 'content_log':
          return await handleContentLog(supabase, body)
        default:
          return createErrorResponse('유효하지 않은 action입니다.', 400)
      }
    }

    // GET 요청 처리
    if (req.method === 'GET') {
      return await handleDataQuery(supabase, req)
    }

    return createErrorResponse('지원하지 않는 HTTP 메서드입니다.', 405)

  } catch (error) {
    console.error('API 오류:', error)
    return createErrorResponse('서버 내부 오류가 발생했습니다.', 500)
  }
})

// =====================================
// 사용자 관리 핸들러
// =====================================
async function handleUserRegister(supabase: any, body: ApiRequest) {
  if (!body.username) {
    return createErrorResponse('username은 필수입니다.', 400)
  }

  try {
    // 사용자 식별용 해시 생성
    const encoder = new TextEncoder()
    const data = encoder.encode(body.username + Date.now().toString())
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: userData, error } = await supabase
      .from('users')
      .insert([{
        username: body.username,
        password_hash: passwordHash
      }])
      .select()
      .single()

    if (error) {
      console.error('사용자 등록 실패:', error)
      const message = error.code === '23505' ? '이미 존재하는 사용자입니다.' : '사용자 등록에 실패했습니다.'
      return createErrorResponse(message, 500)
    }

    // Unity UserData 클래스에 맞게 필드 정리
    const userResponse = {
      id: userData.id,
      username: userData.username,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    }
    
    return createSuccessResponse('사용자가 성공적으로 등록되었습니다.', userResponse)
  } catch (error) {
    console.error('사용자 등록 중 오류:', error)
    return createErrorResponse('사용자 등록 중 오류가 발생했습니다.', 500)
  }
}

async function handleUserLogin(supabase: any, body: ApiRequest) {
  if (!body.username) {
    return createErrorResponse('username은 필수입니다.', 400)
  }

  try {
    // 사용자 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', body.username)
      .single()

    if (userError || !userData) {
      return createErrorResponse('사용자를 찾을 수 없습니다.', 404)
    }

    // 세션 생성
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .insert([{
        user_id: userData.id,
        login_time: new Date().toISOString()
      }])
      .select()
      .single()

    if (sessionError) {
      console.error('세션 생성 실패:', sessionError)
      return createErrorResponse('세션 생성에 실패했습니다.', 500)
    }

    // Unity UserData 클래스에 맞게 user 필드 정리
    const userResponse = {
      id: userData.id,
      username: userData.username,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    }
    
    return createSuccessResponse('로그인되었습니다.', {
      user: userResponse,
      session: sessionData
    })
  } catch (error) {
    console.error('로그인 중 오류:', error)
    return createErrorResponse('로그인 중 오류가 발생했습니다.', 500)
  }
}

async function handleUserLogout(supabase: any, body: ApiRequest) {
  if (!body.session_id) {
    return createErrorResponse('session_id는 필수입니다.', 400)
  }

  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ logout_time: new Date().toISOString() })
      .eq('id', body.session_id)

    if (error) {
      console.error('로그아웃 실패:', error)
      return createErrorResponse('로그아웃에 실패했습니다.', 500)
    }

    return createSuccessResponse('로그아웃되었습니다.')
  } catch (error) {
    console.error('로그아웃 중 오류:', error)
    return createErrorResponse('로그아웃 중 오류가 발생했습니다.', 500)
  }
}

// =====================================
// VR 로깅 핸들러
// =====================================
async function handleVRLog(supabase: any, body: ApiRequest) {
  console.log('VR 로그 요청 처리 시작:', JSON.stringify(body, null, 2))
  
  if (!body.device_id || !body.content_name || !body.start_time) {
    console.error('필수 필드 누락:', { device_id: body.device_id, content_name: body.content_name, start_time: body.start_time })
    return createErrorResponse('device_id, content_name, start_time은 필수입니다.', 400)
  }

  try {
    const logData: any = {
      device_id: body.device_id,
      content_name: body.content_name,
      start_time: body.start_time
    }

    // 종료 시간 설정 (duration_minutes는 generated column이므로 자동 계산됨)
    if (body.end_time) {
      logData.end_time = body.end_time
    }

    // 사용자명이 제공된 경우 사용자 ID 조회 또는 생성
    if (body.username) {
      console.log('사용자 조회 시작:', body.username)
      
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', body.username)
        .single()
      
      console.log('사용자 조회 결과:', { userData, userError })
      
      // 사용자가 없으면 새로 생성
      if (userError && userError.code === 'PGRST116') {
        console.log('새 사용자 생성 시작:', body.username)
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ username: body.username, password_hash: 'auto_generated' }])
          .select('id')
          .single()
        
        console.log('새 사용자 생성 결과:', { newUser, createError })
        
        if (createError) {
          console.error('사용자 생성 실패:', createError)
          return createErrorResponse('사용자 생성에 실패했습니다.', 500)
        }
        
        userData = newUser
      } else if (userError) {
        console.error('사용자 조회 실패:', userError)
        return createErrorResponse('사용자 조회에 실패했습니다.', 500)
      }
      
      if (userData) {
        logData.user_id = userData.id
        console.log('user_id 설정:', userData.id)
      }
    }

    console.log('VR 로그 저장 시작:', JSON.stringify(logData, null, 2))

    const { data, error } = await supabase
      .from('vr_usage_logs')
      .insert([logData])
      .select()
      .single()

    console.log('VR 로그 저장 결과:', { data, error })

    if (error) {
      console.error('VR 로그 저장 실패:', error)
      return createErrorResponse('VR 로그 저장에 실패했습니다.', 500)
    }

    console.log('VR 로그 성공적으로 저장됨:', data)
    return createSuccessResponse('VR 로그가 성공적으로 저장되었습니다.', data)
  } catch (error) {
    console.error('VR 로그 처리 중 예외 발생:', error)
    return createErrorResponse('VR 로그 처리 중 오류가 발생했습니다.', 500)
  }
}

// =====================================
// 콘텐츠 로깅 핸들러
// =====================================
async function handleContentLog(supabase: any, body: ApiRequest) {
  console.log('콘텐츠 로그 요청 처리 시작:', JSON.stringify(body, null, 2))
  
  if (!body.username || !body.content_name || !body.start_time) {
    return createErrorResponse('username, content_name, start_time은 필수입니다.', 400)
  }

  try {
    // 사용자 ID 조회 또는 생성
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', body.username)
      .single()

    console.log('사용자 조회 결과:', { userData, userError })

    // 사용자가 없으면 새로 생성
    if (userError && userError.code === 'PGRST116') {
      console.log('새 사용자 생성 시작:', body.username)
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ username: body.username, password_hash: 'auto_generated' }])
        .select('id')
        .single()
      
      console.log('새 사용자 생성 결과:', { newUser, createError })
      
      if (createError) {
        console.error('사용자 생성 실패:', createError)
        return createErrorResponse('사용자 생성에 실패했습니다.', 500)
      }
      
      userData = newUser
    } else if (userError) {
      console.error('사용자 조회 실패:', userError)
      return createErrorResponse('사용자 조회에 실패했습니다.', 500)
    }

    if (!userData) {
      return createErrorResponse('사용자 처리에 실패했습니다.', 500)
    }

    // vr_usage_logs 테이블에 콘텐츠 로그 저장 (device_id를 'CONTENT_DEVICE'로 설정)
    const logData: any = {
      user_id: userData.id,
      device_id: 'CONTENT_DEVICE',
      content_name: body.content_name,
      start_time: body.start_time
    }

    // 종료 시간 설정 (duration_minutes는 generated column이므로 자동 계산됨)
    if (body.end_time) {
      logData.end_time = body.end_time
    }

    console.log('콘텐츠 로그 저장 시작:', JSON.stringify(logData, null, 2))

    const { data, error } = await supabase
      .from('vr_usage_logs')
      .insert([logData])
      .select()
      .single()

    console.log('콘텐츠 로그 저장 결과:', { data, error })

    if (error) {
      console.error('콘텐츠 로그 저장 실패:', error)
      return createErrorResponse('콘텐츠 로그 저장에 실패했습니다.', 500)
    }

    console.log('콘텐츠 로그 성공적으로 저장됨:', data)
    return createSuccessResponse('콘텐츠 로그가 성공적으로 저장되었습니다.', data)
  } catch (error) {
    console.error('콘텐츠 로그 처리 중 예외 발생:', error)
    return createErrorResponse('콘텐츠 로그 처리 중 오류가 발생했습니다.', 500)
  }
}

// =====================================
// 데이터 조회 핸들러
// =====================================
async function handleDataQuery(supabase: any, req: Request) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'vr_logs'
  const username = url.searchParams.get('username')
  const device_id = url.searchParams.get('device_id')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000)

  try {
    switch (type) {
      case 'vr_logs':
        return await queryVRLogs(supabase, { username, device_id, limit })
      case 'content_logs':
        return await queryContentLogs(supabase, { username, limit })
      case 'user_sessions':
        return await queryUserSessions(supabase, { username, limit })
      case 'content_data':
        return await queryContentData(supabase, { limit })
      default:
        return createErrorResponse('유효하지 않은 조회 타입입니다.', 400)
    }
  } catch (error) {
    console.error('데이터 조회 중 오류:', error)
    return createErrorResponse('데이터 조회 중 오류가 발생했습니다.', 500)
  }
}

async function queryVRLogs(supabase: any, params: { username?: string, device_id?: string, limit: number }) {
  let query = supabase
    .from('vr_usage_logs')
    .select(`
      *,
      users(username)
    `)
    .order('start_time', { ascending: false })
    .limit(params.limit)

  if (params.device_id) {
    query = query.eq('device_id', params.device_id)
  }

  if (params.username) {
    query = query.eq('users.username', params.username)
  }

  const { data, error } = await query

  if (error) {
    console.error('VR 로그 조회 실패:', error)
    return createErrorResponse('VR 로그 조회에 실패했습니다.', 500)
  }

  return createSuccessResponse('VR 로그를 성공적으로 조회했습니다.', data)
}

async function queryContentLogs(supabase: any, params: { username?: string, limit: number }) {
  let query = supabase
    .from('vr_usage_logs')
    .select(`
      *,
      users!inner(username)
    `)
    .eq('device_id', 'CONTENT_DEVICE')
    .order('start_time', { ascending: false })
    .limit(params.limit)

  if (params.username) {
    query = query.eq('users.username', params.username)
  }

  const { data, error } = await query

  if (error) {
    console.error('콘텐츠 로그 조회 실패:', error)
    return createErrorResponse('콘텐츠 로그 조회에 실패했습니다.', 500)
  }

  return createSuccessResponse('콘텐츠 로그를 성공적으로 조회했습니다.', data)
}

async function queryUserSessions(supabase: any, params: { username?: string, limit: number }) {
  let query = supabase
    .from('user_sessions')
    .select(`
      *,
      users!inner(username)
    `)
    .order('login_time', { ascending: false })
    .limit(params.limit)

  if (params.username) {
    query = query.eq('users.username', params.username)
  }

  const { data, error } = await query

  if (error) {
    console.error('세션 조회 실패:', error)
    return createErrorResponse('세션 조회에 실패했습니다.', 500)
  }

  return createSuccessResponse('세션을 성공적으로 조회했습니다.', data)
}

async function queryContentData(supabase: any, params: { limit: number }) {
  const { data, error } = await supabase
    .from('content_data')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(params.limit)

  if (error) {
    console.error('콘텐츠 데이터 조회 실패:', error)
    return createErrorResponse('콘텐츠 데이터 조회에 실패했습니다.', 500)
  }

  return createSuccessResponse('콘텐츠 데이터를 성공적으로 조회했습니다.', data)
}

// =====================================
// 헬퍼 함수
// =====================================
function createSuccessResponse(message: string, data?: any): Response {
  const response: ApiResponse = {
    success: true,
    message,
    data
  }
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function createErrorResponse(error: string, status: number): Response {
  const response: ApiResponse = {
    success: false,
    error
  }
  return new Response(JSON.stringify(response), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}