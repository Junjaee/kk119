import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Notification } from '@/lib/types';

interface AppStore {
  // User State
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  
  // UI State
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Notification State
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Initialize
  initialize: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // User State
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        console.log('🔧 Starting logout process...');

        // Step 1: Zustand 상태 먼저 완전히 초기화 (persist가 저장하기 전에)
        set({
          user: null,
          notifications: [],
          theme: 'light',
        });

        // Step 2: localStorage 완전히 정리 (persist 저장소 포함)
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('kyokwon119-storage'); // Zustand persist 데이터 제거
          sessionStorage.clear(); // 세션 스토리지도 완전히 정리
          console.log('✅ All storage cleared successfully');
        } catch (error) {
          console.error('❌ Error clearing storage:', error);
        }

        // Step 3: persist middleware에서 상태 저장을 방지하기 위해 즉시 강제 제거
        setTimeout(() => {
          localStorage.removeItem('kyokwon119-storage');
          console.log('🔧 Double-check: kyokwon119-storage removed again');
        }, 10);

        // Step 4: 페이지 새로고침으로 모든 메모리 상태 완전 정리
        setTimeout(() => {
          console.log('🔄 Reloading page to ensure complete logout...');
          window.location.href = '/login'; // 새로고침 대신 직접 로그인 페이지로 이동
        }, 150);
      },
      
      // UI State
      theme: 'light',
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Notification State
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications]
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, is_read: true } : n
        )
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      // Initialize - check for existing session
      initialize: async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include'
            });
            if (response.ok) {
              const data = await response.json();
              set({ user: data.user });
            } else {
              localStorage.removeItem('token');
            }
          }
        } catch (error) {
          console.error('Failed to initialize user:', error);
        }
      }
    }),
    {
      name: 'kyokwon119-storage',
      partialize: (state) => ({
        theme: state.theme,
        user: state.user
      })
    }
  )
);