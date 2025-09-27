'use client';

import { useEffect, createContext, useContext, ReactNode } from 'react';
import { authSync } from '@/lib/auth/auth-sync';

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthProviderContext {
  initialized: boolean;
}

const AuthProviderContext = createContext<AuthProviderContext>({
  initialized: false
});

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Initialize auth sync system on app load
    const initializeAuth = async () => {
      console.log('🚀 [AUTH-PROVIDER] Initializing auth sync system');

      try {
        // Refresh auth state from server
        await authSync.refreshAuthState();
        console.log('✅ [AUTH-PROVIDER] Auth sync system initialized');
      } catch (error) {
        console.error('❌ [AUTH-PROVIDER] Failed to initialize auth sync:', error);
      }
    };

    initializeAuth();

    // Set up periodic token validation (every 5 minutes)
    const tokenCheckInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token) {
        if (!authSync.isTokenValid(token)) {
          console.log('⚠️ [AUTH-PROVIDER] Token expired, clearing auth state');
          authSync.clearAllAuthState();
        } else if (authSync.shouldRefreshToken(token)) {
          console.log('🔄 [AUTH-PROVIDER] Token expiring soon, refreshing auth state');
          try {
            await authSync.refreshAuthState();
          } catch (error) {
            console.error('❌ [AUTH-PROVIDER] Failed to refresh token:', error);
            authSync.clearAllAuthState();
          }
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Set up visibility change handler to refresh auth when user returns
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('👁️ [AUTH-PROVIDER] Page became visible, refreshing auth state');
        try {
          await authSync.refreshAuthState();
        } catch (error) {
          console.error('❌ [AUTH-PROVIDER] Failed to refresh on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(tokenCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <AuthProviderContext.Provider value={{ initialized: true }}>
      {children}
    </AuthProviderContext.Provider>
  );
}

export function useAuthProvider() {
  const context = useContext(AuthProviderContext);
  if (!context) {
    throw new Error('useAuthProvider must be used within AuthProvider');
  }
  return context;
}