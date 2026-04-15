'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { authSync } from '@/lib/auth/auth-sync';
import { migrateLegacyStorage } from '@/lib/auth/storage-keys';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, initialize } = useStore();

  useEffect(() => {
    // @CODE:AUTH-005-STORAGE-MIGRATE | SPEC-AUTH-005
    // super_admin → admin 스토리지 키 1회성 이관 (멱등)
    migrateLegacyStorage();

    // Initialize store only - auth refresh is handled by store.initialize() and AuthProvider
    console.log('🚀 [PROVIDERS] Initializing store (auth refresh handled separately)');
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme === 'dark' ? '#2D2D2D' : '#fff',
            color: theme === 'dark' ? '#E5E5E5' : '#1A1A1A',
            border: `1px solid ${theme === 'dark' ? '#404040' : '#D4D4D4'}`,
          },
        }}
      />
    </QueryClientProvider>
  );
}