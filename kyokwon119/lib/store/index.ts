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
        localStorage.removeItem('token');
        set({ user: null });
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
            const response = await fetch('/api/auth/me');
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