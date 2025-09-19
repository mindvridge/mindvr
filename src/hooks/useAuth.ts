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
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setCurrentSessionId(sessionId);
        
        // If user is admin, restore admin session for RLS policies
        if (userData.isAdmin) {
          await supabase.rpc('set_admin_session', {
            admin_id_value: userData.id
          });
        }
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
      // Generate password hash
      const passwordHash = await generateUserHash(formData.username + formData.password);

      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: formData.username,
          password_hash: passwordHash
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
      // First, try admin authentication
      const { data: adminResult } = await supabase.rpc('authenticate_admin', {
        input_username: formData.username,
        input_password: formData.password
      });

      if (adminResult && adminResult.length > 0 && adminResult[0].success) {
        // Admin login successful
        const adminData = adminResult[0].admin_data as any;
        
        // Set admin session for RLS policies
        await supabase.rpc('set_admin_session', {
          admin_id_value: adminData.id
        });

        // Create user session for tracking
        const { data: sessionData, error: sessionError } = await supabase
          .from('user_sessions')
          .insert([{
            user_id: adminData.id,
            login_time: new Date().toISOString()
          }])
          .select()
          .single();

        if (sessionError) {
          console.error('Session creation failed:', sessionError);
        }

        // Store admin data as user data
        const adminUser: User = {
          id: adminData.id,
          username: adminData.username,
          created_at: adminData.created_at,
          updated_at: adminData.updated_at,
          isAdmin: true
        };

        setUser(adminUser);
        setCurrentSessionId(sessionData?.id || null);
        localStorage.setItem('current_user', JSON.stringify(adminUser));
        localStorage.setItem('current_session_id', sessionData?.id || '');

        toast({
          title: '성공',
          description: '관리자로 로그인되었습니다.',
        });

        return { success: true, user: adminUser };
      }

      // If admin login failed, try regular user login
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', formData.username)
        .single();

      if (userError || !userData) {
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
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
      const regularUser: User = {
        ...userData,
        isAdmin: false
      };

      setUser(regularUser);
      setCurrentSessionId(sessionData?.id || null);
      localStorage.setItem('current_user', JSON.stringify(regularUser));
      localStorage.setItem('current_session_id', sessionData?.id || '');

      toast({
        title: '성공',
        description: '로그인되었습니다.',
      });

      return { success: true, user: regularUser };
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