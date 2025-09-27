'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '@/lib/types/user';
import { authSync, useAuthSync } from '@/lib/auth/auth-sync';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
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
  // Use the centralized auth sync state as primary source
  const { user: syncedUser, syncUser, clearAuth, refreshAuth } = useAuthSync();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync local state with centralized auth state
  useEffect(() => {
    if (syncedUser) {
      setUser({
        id: syncedUser.id?.toString() || '',
        email: syncedUser.email || '',
        name: syncedUser.name
      });
      setProfile(syncedUser as UserProfile);
    } else {
      setUser(null);
      setProfile(null);
    }
  }, [syncedUser]);

  // 프로필 정보 가져오기
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.user as UserProfile;
    } catch (err) {
      console.error('Profile fetch exception:', err);
      return null;
    }
  }, []);

  // 인증 상태 초기화 - 중앙화된 sync를 통해 처리
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Use centralized auth sync for initialization
        await refreshAuth();

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setError('인증 초기화에 실패했습니다.');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshAuth]);

  // 로그인
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        return { error: data.error || '로그인에 실패했습니다.' };
      }

      // Sync auth state through centralized system
      if (data.syncRequired && data.user) {
        syncUser(data.user);
        authSync.syncTokens(data.token);
      } else {
        // Fallback to traditional profile fetch
        const profileData = await fetchProfile();
        if (profileData) {
          syncUser(profileData);
        }
      }

      return {};
    } catch (err) {
      const errorMessage = '로그인에 실패했습니다.';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, syncUser]);

  // 회원가입
  const signUp = useCallback(async (
    email: string,
    password: string,
    userData: Partial<UserProfile>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, ...userData }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '회원가입에 실패했습니다.');
        return { error: data.error || '회원가입에 실패했습니다.' };
      }

      return {};
    } catch (err) {
      const errorMessage = '회원가입에 실패했습니다.';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // 로그아웃 - 중앙화된 auth clear 사용
  const signOut = useCallback(async () => {
    try {
      setLoading(true);

      // Use centralized auth clear for complete logout
      clearAuth();

      // Server-side logout is handled in clearAuth
    } catch (err) {
      console.error('Sign out error:', err);
      setError('로그아웃에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  // 프로필 업데이트
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: '로그인이 필요합니다.' };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '프로필 업데이트에 실패했습니다.');
        return { error: data.error || '프로필 업데이트에 실패했습니다.' };
      }

      // 프로필 새로고침 through centralized sync
      const updatedProfile = await fetchProfile();
      if (updatedProfile) {
        syncUser(updatedProfile);
      }

      return {};
    } catch (err) {
      const errorMessage = '프로필 업데이트에 실패했습니다.';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfile, syncUser]);

  // 프로필 새로고침 - 중앙화된 refresh 사용
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      await refreshAuth();
    } catch (err) {
      console.error('Profile refresh error:', err);
    }
  }, [user, refreshAuth]);

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