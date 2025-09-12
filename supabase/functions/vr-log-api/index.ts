import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method === 'POST') {
      const body: ApiRequest = await req.json()
      console.log('VR Log API 요청:', body)

      // =====================================
      // 사용자 등록
      // =====================================
      if (body.action === 'register') {
        if (!body.username) {
          return createErrorResponse('username은 필수입니다.', 400)
        }

        // Generate simple hash for user identification
        const encoder = new TextEncoder()
        const data = encoder.encode(body.username + new Date().toISOString())
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const simpleHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        const { data: userData, error } = await supabase
          .from('users')
          .insert([{
            username: body.username,
            password_hash: simpleHash
          }])
          .select()

        if (error) {
          console.error('사용자 등록 실패:', error)
          const message = error.code === '23505' ? '이미 존재하는 사용자입니다.' : '사용자 등록에 실패했습니다.'
          return createErrorResponse(message, 500)
        }

        return createSuccessResponse('사용자가 성공적으로 등록되었습니다.', userData[0])
      }

      // =====================================
      // 사용자 로그인
      // =====================================
      if (body.action === 'login') {
        if (!body.username) {
          return createErrorResponse('username은 필수입니다.', 400)
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', body.username)
          .single()

        if (userError || !userData) {
          return createErrorResponse('사용자를 찾을 수 없습니다.', 404)
        }

        // Create session
        const { data: sessionData, error: sessionError } = await supabase
          .from('user_sessions')
          .insert([{
            user_id: userData.id,
            login_time: new Date().toISOString()
          }])
          .select()

        if (sessionError) {
          console.error('세션 생성 실패:', sessionError)
        }

        return createSuccessResponse('로그인되었습니다.', {
          user: userData,
          session: sessionData?.[0]
        })
      }

      // =====================================
      // 사용자 로그아웃
      // =====================================
      if (body.action === 'logout') {
        if (body.session_id) {
          await supabase
            .from('user_sessions')
            .update({ logout_time: new Date().toISOString() })
            .eq('id', body.session_id)
        }

        return createSuccessResponse('로그아웃되었습니다.')
      }

      // =====================================
      // VR 기기 사용 로그
      // =====================================
      if (body.action === 'vr_log') {
        if (!body.device_id || !body.content_name || !body.start_time) {
          return createErrorResponse('device_id, content_name, start_time은 필수입니다.', 400)
        }

        const logData: any = {
          device_id: body.device_id,
          content_name: body.content_name,
          start_time: body.start_time
        }

        // Add optional fields
        if (body.end_time) {
          logData.end_time = body.end_time
          
          // Calculate duration if both times are provided
          const startTime = new Date(body.start_time)
          const endTime = new Date(body.end_time)
          const durationMs = endTime.getTime() - startTime.getTime()
          logData.duration_minutes = Math.round(durationMs / 60000)
        }

        // Optional user_id if provided through username
        if (body.username) {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('username', body.username)
            .single()
          
          if (userData) {
            logData.user_id = userData.id
          }
        }

        const { data, error } = await supabase
          .from('vr_usage_logs')
          .insert([logData])
          .select()

        if (error) {
          console.error('VR 로그 저장 실패:', error)
          return createErrorResponse('VR 로그 저장에 실패했습니다.', 500)
        }

        return createSuccessResponse('VR 로그가 성공적으로 저장되었습니다.', data[0])
      }

      // =====================================
      // 콘텐츠 사용 로그
      // =====================================
      if (body.action === 'content_log') {
        if (!body.username || !body.content_name || !body.start_time) {
          return createErrorResponse('username, content_name, start_time은 필수입니다.', 400)
        }

        // Get user ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', body.username)
          .single()

        if (userError || !userData) {
          return createErrorResponse('사용자를 찾을 수 없습니다.', 404)
        }

        const logData: any = {
          user_id: userData.id,
          content_name: body.content_name,
          start_time: body.start_time
        }

        if (body.end_time) {
          logData.end_time = body.end_time
          
          // Calculate duration if both times are provided
          const startTime = new Date(body.start_time)
          const endTime = new Date(body.end_time)
          const durationMs = endTime.getTime() - startTime.getTime()
          logData.duration_minutes = Math.round(durationMs / 60000)
        }

        const { data, error } = await supabase
          .from('content_usage_logs')
          .insert([logData])
          .select()

        if (error) {
          console.error('콘텐츠 로그 저장 실패:', error)
          return createErrorResponse('콘텐츠 로그 저장에 실패했습니다.', 500)
        }

        return createSuccessResponse('콘텐츠 로그가 성공적으로 저장되었습니다.', data[0])
      }

      return createErrorResponse('유효하지 않은 action입니다.', 400)
    }

    // =====================================
    // GET 요청 - 데이터 조회
    // =====================================
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const type = url.searchParams.get('type') || 'vr_logs'
      const username = url.searchParams.get('username')
      const device_id = url.searchParams.get('device_id')
      const limit = parseInt(url.searchParams.get('limit') || '100')

      // VR 로그 조회
      if (type === 'vr_logs') {
        let query = supabase
          .from('vr_usage_logs')
          .select(`
            *,
            users(username)
          `)
          .order('start_time', { ascending: false })
          .limit(limit)

        if (device_id) {
          query = query.eq('device_id', device_id)
        }

        if (username) {
          query = query.eq('users.username', username)
        }

        const { data, error } = await query

        if (error) {
          console.error('VR 로그 조회 실패:', error)
          return createErrorResponse('VR 로그 조회에 실패했습니다.', 500)
        }

        return createSuccessResponse('VR 로그를 성공적으로 조회했습니다.', data)
      }

      // 콘텐츠 로그 조회
      if (type === 'content_logs') {
        let query = supabase
          .from('content_usage_logs')
          .select(`
            *,
            users!inner(username)
          `)
          .order('start_time', { ascending: false })
          .limit(limit)

        if (username) {
          query = query.eq('users.username', username)
        }

        const { data, error } = await query

        if (error) {
          console.error('콘텐츠 로그 조회 실패:', error)
          return createErrorResponse('콘텐츠 로그 조회에 실패했습니다.', 500)
        }

        return createSuccessResponse('콘텐츠 로그를 성공적으로 조회했습니다.', data)
      }

      // 사용자 세션 조회
      if (type === 'user_sessions') {
        let query = supabase
          .from('user_sessions')
          .select(`
            *,
            users!inner(username)
          `)
          .order('login_time', { ascending: false })
          .limit(limit)

        if (username) {
          query = query.eq('users.username', username)
        }

        const { data, error } = await query

        if (error) {
          console.error('세션 조회 실패:', error)
          return createErrorResponse('세션 조회에 실패했습니다.', 500)
        }

        return createSuccessResponse('세션을 성공적으로 조회했습니다.', data)
      }

      return createErrorResponse('유효하지 않은 조회 타입입니다.', 400)
    }

    return createErrorResponse('지원하지 않는 HTTP 메서드입니다.', 405)

  } catch (error) {
    console.error('API 오류:', error)
    return createErrorResponse('서버 내부 오류가 발생했습니다.', 500)
  }
})

// Helper functions
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