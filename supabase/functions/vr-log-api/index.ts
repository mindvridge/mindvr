import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      const body = await req.json()
      console.log('Content Log API 요청 받음:', body)

      const { username, content_name, start_time, end_time, action } = body

      if (action === 'register') {
        // User registration
        if (!username) {
          return new Response(
            JSON.stringify({ error: 'username은 필수입니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate user hash without password
        const encoder = new TextEncoder()
        const data = encoder.encode(username + new Date().toISOString())
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const simpleHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        const { data, error } = await supabase
          .from('users')
          .insert([{
            username: username,
            password_hash: simpleHash
          }])
          .select()

        if (error) {
          console.error('사용자 등록 실패:', error)
          return new Response(
            JSON.stringify({ 
              error: error.code === '23505' ? '이미 존재하는 사용자입니다.' : '사용자 등록에 실패했습니다.' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: '사용자가 성공적으로 등록되었습니다.',
            user: data[0]
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'login') {
        // User login
        if (!username) {
          return new Response(
            JSON.stringify({ error: 'username은 필수입니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single()

        if (userError || !userData) {
          return new Response(
            JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
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

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: '로그인되었습니다.',
            user: userData,
            session: sessionData?.[0]
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'logout') {
        // User logout
        const { session_id } = body

        if (session_id) {
          await supabase
            .from('user_sessions')
            .update({ logout_time: new Date().toISOString() })
            .eq('id', session_id)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: '로그아웃되었습니다.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'content_log') {
        // Content usage logging
        if (!username || !content_name || !start_time) {
          return new Response(
            JSON.stringify({ 
              error: 'username, content_name, start_time은 필수입니다.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get user ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single()

        if (userError || !userData) {
          return new Response(
            JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const logData = {
          user_id: userData.id,
          content_name,
          start_time,
          end_time: end_time || null
        }

        const { data, error } = await supabase
          .from('content_usage_logs')
          .insert([logData])
          .select()

        if (error) {
          console.error('콘텐츠 로그 저장 실패:', error)
          return new Response(
            JSON.stringify({ error: '콘텐츠 로그 저장에 실패했습니다.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: '콘텐츠 로그가 성공적으로 저장되었습니다.',
            data: data[0]
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: '유효하지 않은 action입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET 요청으로 데이터 조회
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const type = url.searchParams.get('type') || 'content_logs'
      const username = url.searchParams.get('username')
      const limit = url.searchParams.get('limit') || '100'

      if (type === 'content_logs') {
        let query = supabase
          .from('content_usage_logs')
          .select(`
            *,
            users!inner(username)
          `)
          .order('start_time', { ascending: false })
          .limit(parseInt(limit))

        if (username) {
          query = query.ilike('users.username', `%${username}%`)
        }

        const { data, error } = await query

        if (error) {
          console.error('콘텐츠 로그 조회 실패:', error)
          return new Response(
            JSON.stringify({ error: '콘텐츠 로그 조회에 실패했습니다.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: data,
            count: data?.length || 0
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (type === 'user_sessions') {
        let query = supabase
          .from('user_sessions')
          .select(`
            *,
            users!inner(username)
          `)
          .order('login_time', { ascending: false })
          .limit(parseInt(limit))

        if (username) {
          query = query.ilike('users.username', `%${username}%`)
        }

        const { data, error } = await query

        if (error) {
          console.error('세션 조회 실패:', error)
          return new Response(
            JSON.stringify({ error: '세션 조회에 실패했습니다.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: data,
            count: data?.length || 0
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: '지원하지 않는 HTTP 메서드입니다.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API 오류:', error)
    return new Response(
      JSON.stringify({ error: '서버 내부 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})