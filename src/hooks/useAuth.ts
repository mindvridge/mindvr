import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, LoginFormData, RegisterFormData } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('current_user');
      const sessionId = localStorage.getItem('current_session_id');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUserHash = async (username: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(username + new Date().toISOString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const register = async (formData: RegisterFormData) => {
    try {
      const userHash = await generateUserHash(formData.username);

      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: formData.username,
          password_hash: userHash
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('이미 존재하는 아이디입니다.');
        }
        throw error;
      }

      toast({
        title: '성공',
        description: '회원가입이 완료되었습니다. 로그인해주세요.',
      });

      return { success: true, user: data };
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '회원가입에 실패했습니다.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const login = async (formData: LoginFormData) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', formData.username)
        .single();

      if (userError || !userData) {
        throw new Error('아이디가 올바르지 않습니다.');
      }

      // Create user session
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .insert([{
          user_id: userData.id,
          login_time: new Date().toISOString()
        }])
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation failed:', sessionError);
      }

      // Store user data
      setUser(userData);
      setCurrentSessionId(sessionData?.id || null);
      localStorage.setItem('current_user', JSON.stringify(userData));
      localStorage.setItem('current_session_id', sessionData?.id || '');

      toast({
        title: '성공',
        description: '로그인되었습니다.',
      });

      return { success: true, user: userData };
    } catch (error: any) {
      toast({
        title: '오류',  
        description: error.message || '로그인에 실패했습니다.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Update session logout time
      if (currentSessionId) {
        await supabase
          .from('user_sessions')
          .update({ logout_time: new Date().toISOString() })
          .eq('id', currentSessionId);
      }

      setUser(null);
      setCurrentSessionId(null);
      localStorage.removeItem('current_user');
      localStorage.removeItem('current_session_id');

      toast({
        title: '성공',
        description: '로그아웃되었습니다.',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    loading,
    currentSessionId,
    register,
    login,
    logout,
  };
};