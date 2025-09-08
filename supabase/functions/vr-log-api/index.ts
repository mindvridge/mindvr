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
      console.log('VR Log API 요청 받음:', body)

      const { device_id, content_name, start_time, end_time } = body

      // 필수 필드 검증
      if (!device_id || !content_name || !start_time) {
        return new Response(
          JSON.stringify({ 
            error: 'device_id, content_name, start_time은 필수입니다.' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // 로그 저장
      const logData = {
        device_id,
        content_name,
        start_time,
        end_time: end_time || null
      }

      const { data, error } = await supabase
        .from('vr_usage_logs')
        .insert([logData])
        .select()

      if (error) {
        console.error('로그 저장 실패:', error)
        return new Response(
          JSON.stringify({ error: '로그 저장에 실패했습니다.' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('로그 저장 성공:', data)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: '로그가 성공적으로 저장되었습니다.',
          data: data[0]
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // GET 요청으로 로그 조회도 지원
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const device_id = url.searchParams.get('device_id')
      const limit = url.searchParams.get('limit') || '100'

      let query = supabase
        .from('vr_usage_logs')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(parseInt(limit))

      if (device_id) {
        query = query.ilike('device_id', `%${device_id}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('로그 조회 실패:', error)
        return new Response(
          JSON.stringify({ error: '로그 조회에 실패했습니다.' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data,
          count: data?.length || 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: '지원하지 않는 HTTP 메서드입니다.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('API 오류:', error)
    return new Response(
      JSON.stringify({ error: '서버 내부 오류가 발생했습니다.' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})