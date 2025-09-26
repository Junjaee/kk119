'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/lib/types/user';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthState {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // 프로필 정보 가져오기
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return null;
    }
  }, [supabase]);

  // 인증 상태 초기화
  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // 강제 타임아웃 (로컬 개발 모드에서 무한 로딩 방지)
        const forceFinishLoading = setTimeout(() => {
          if (isMounted) {
            console.log('🔧 Force finishing auth loading (timeout)');
            setLoading(false);
          }
        }, 2000);

        // 현재 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          if (isMounted) {
            setLoading(false);
          }
          clearTimeout(forceFinishLoading);
          return;
        }

        if (session?.user) {
          setUser(session.user);

          // 프로필 정보 가져오기
          const profileData = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(profileData);
          }
        }

        // 인증 상태 변경 리스너
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔧 Auth state change:', event, session?.user?.email);
            if (!isMounted) return;

            if (session?.user) {
              setUser(session.user);
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
            } else {
              setUser(null);
              setProfile(null);
            }
            setLoading(false);
            clearTimeout(forceFinishLoading);
          }
        );

        subscription = authSubscription;

        // 초기 로딩 완료
        if (isMounted) {
          setLoading(false);
        }
        clearTimeout(forceFinishLoading);

      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('인증 초기화에 실패했습니다.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase, fetchProfile]);

  // 로그인
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { error: error.message };
      }

      return {};
    } catch (err) {
      const errorMessage = '로그인에 실패했습니다.';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 회원가입
  const signUp = useCallback(async (
    email: string,
    password: string,
    userData: Partial<UserProfile>
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Supabase 인증 계정 생성
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return { error: signUpError.message };
      }

      if (data.user) {
        // 사용자 프로필 생성
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email,
            role: userData.role || 'teacher',
            name: userData.name || '',
            phone: userData.phone,
            school_name: userData.school_name,
            employee_id: userData.employee_id,
            license_number: userData.license_number,
            law_firm: userData.law_firm,
            specialization: userData.specialization,
            is_active: true,
            is_verified: false, // 관리자 승인 필요
          });

        if (profileError) {
          setError(profileError.message);
          return { error: profileError.message };
        }
      }

      return {};
    } catch (err) {
      const errorMessage = '회원가입에 실패했습니다.';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('로그아웃에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 프로필 업데이트
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: '로그인이 필요합니다.' };
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        setError(error.message);
        return { error: error.message };
      }

      // 프로필 새로고침
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);

      return {};
    } catch (err) {
      const errorMessage = '프로필 업데이트에 실패했습니다.';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, supabase, fetchProfile]);

  // 프로필 새로고침
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Profile refresh error:', err);
    }
  }, [user, fetchProfile]);

  return {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };
}