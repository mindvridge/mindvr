import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, LoginFormData, RegisterFormData } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto logout after 30 minutes of inactivity
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  let inactivityTimer: NodeJS.Timeout | null = null;
  let lastActivityTime = Date.now();

  useEffect(() => {
    checkAuth();
    setupAutoLogout();
    
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, []);

  const setupAutoLogout = () => {
    // Track user activity
    const resetInactivityTimer = () => {
      lastActivityTime = Date.now();
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      inactivityTimer = setTimeout(() => {
        if (currentSessionId && user) {
          autoLogout('inactivity');
        }
      }, INACTIVITY_TIMEOUT);
    };

    // Listen for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    // Handle network disconnection
    const handleOnline = () => {
      console.log('Network connection restored');
    };

    const handleOffline = () => {
      console.log('Network connection lost - session will be logged out when reconnected');
      // Store the disconnect time for when we come back online
      localStorage.setItem('last_disconnect_time', new Date().toISOString());
    };

    // Handle page unload/refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentSessionId && user) {
        // Update session logout time immediately
        updateSessionLogoutTime();
        
        // Use synchronous request for page unload as backup
        try {
          fetch(`https://ewyqozozuluyfnemgsuw.supabase.co/rest/v1/user_sessions?id=eq.${currentSessionId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3eXFvem96dWx1eWZuZW1nc3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDMzODMsImV4cCI6MjA3Mjg3OTM4M30.8kwXyPJpc0FMrW72PwTqJxkE0gA9Na1xH_ax4_aSEBE',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3eXFvem96dWx1eWZuZW1nc3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDMzODMsImV4cCI6MjA3Mjg3OTM4M30.8kwXyPJpc0FMrW72PwTqJxkE0gA9Na1xH_ax4_aSEBE'
            },
            body: JSON.stringify({
              logout_time: new Date().toISOString()
            }),
            keepalive: true
          });
        } catch (error) {
          console.error('Failed to update logout time on page unload:', error);
        }
      }
    };

    // Handle visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden && currentSessionId && user) {
        // Store when tab became hidden
        localStorage.setItem('tab_hidden_time', new Date().toISOString());
        
        // Wait a bit to see if user comes back
        setTimeout(() => {
          if (document.hidden && currentSessionId && user) {
            autoLogout('tab_hidden');
          }
        }, 10000); // 10 seconds delay
      } else if (!document.hidden && currentSessionId && user) {
        // Tab became visible again
        const hiddenTime = localStorage.getItem('tab_hidden_time');
        if (hiddenTime) {
          const hiddenDuration = Date.now() - new Date(hiddenTime).getTime();
          // If tab was hidden for more than 5 minutes, logout
          if (hiddenDuration > 5 * 60 * 1000) {
            autoLogout('long_tab_hidden');
          }
          localStorage.removeItem('tab_hidden_time');
        }
      }
    };

    // Handle browser focus/blur
    const handleWindowBlur = () => {
      if (currentSessionId && user) {
        localStorage.setItem('window_blur_time', new Date().toISOString());
      }
    };

    const handleWindowFocus = () => {
      if (currentSessionId && user) {
        const blurTime = localStorage.getItem('window_blur_time');
        if (blurTime) {
          const blurDuration = Date.now() - new Date(blurTime).getTime();
          // If window was out of focus for more than 10 minutes, logout
          if (blurDuration > 10 * 60 * 1000) {
            autoLogout('long_window_blur');
          }
          localStorage.removeItem('window_blur_time');
        }
      }
    };

    // Periodic session validation
    const validateSession = async () => {
      if (currentSessionId && user) {
        try {
          // Check if session still exists and is valid
          const { data, error } = await supabase
            .from('user_sessions')
            .select('logout_time')
            .eq('id', currentSessionId)
            .single();

          if (error || !data) {
            console.log('Session no longer exists, logging out');
            autoLogout('session_invalid');
            return;
          }

          // If session has logout_time set, means it was logged out elsewhere
          if (data.logout_time) {
            console.log('Session was logged out elsewhere');
            autoLogout('logged_out_elsewhere');
            return;
          }
        } catch (error) {
          console.error('Session validation failed:', error);
        }
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Validate session every 2 minutes
    const sessionValidationInterval = setInterval(validateSession, 2 * 60 * 1000);

    // Initial timer setup
    resetInactivityTimer();

    // Cleanup function
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionValidationInterval);
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  };

  // Helper function to update session logout time
  const updateSessionLogoutTime = async () => {
    if (currentSessionId) {
      try {
        await supabase
          .from('user_sessions')
          .update({ logout_time: new Date().toISOString() })
          .eq('id', currentSessionId);
        console.log('Session logout time updated');
      } catch (error) {
        console.error('Failed to update session logout time:', error);
      }
    }
  };

  const autoLogout = async (reason: string) => {
    try {
      console.log(`Auto logout triggered: ${reason}`);
      
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

      if (reason === 'inactivity') {
        toast({
          title: '세션 만료',
          description: '비활성 상태로 인해 자동 로그아웃되었습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Auto logout failed:', error);
    }
  };

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
          try {
            await supabase.rpc('set_admin_session', {
              admin_id_value: userData.id
            });
            console.log('Admin session restored successfully');
          } catch (error) {
            console.error('Failed to restore admin session:', error);
          }
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

        // Setup auto logout for the session
        setupAutoLogout();

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

      // Setup auto logout for the session
      setupAutoLogout();

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