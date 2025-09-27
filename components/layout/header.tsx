'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Shield,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  const router = useRouter();
  const { user, theme, toggleTheme, setSidebarOpen, sidebarOpen, notifications, logout } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Hydration 완료 체크
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'trust-modern';
      case 'admin': return 'urgent-modern';
      case 'lawyer': return 'protection-modern';
      default: return 'primary-modern';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return '슈퍼관리자';
      case 'admin': return '관리자';
      case 'lawyer': return '변호사';
      default: return '교사';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-morphism animate-slide-down">
      <div className="flex h-24 items-center px-4 lg:px-8">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden mr-3 hover:bg-accent/50 rounded-xl"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Enhanced Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
            {isHydrated ? (
              <Image
                src="/icons/icon-master.svg"
                alt="교권119 로고"
                width={24}
                height={24}
                className="w-6 h-6"
                priority
              />
            ) : (
              <Shield className="h-6 w-6" />
            )}
          </div>
          <div className="hidden sm:block">
            <span className="text-2xl font-bold gradient-text">교권119</span>
            <p className="text-xs text-muted-foreground -mt-1">교사의 권리를 지킵니다</p>
          </div>
        </Link>


        {/* Right Section */}
        <div className="flex items-center space-x-3 ml-auto">
          {/* Notifications */}
          {isHydrated && user && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative hover:bg-accent/50 rounded-xl"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-card/95 backdrop-blur-md shadow-xl animate-scale-in">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">알림</h3>
                    <p className="text-sm text-muted-foreground">
                      {unreadCount}개의 읽지 않은 알림
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-modern">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 border-b last:border-b-0 hover:bg-accent/30 transition-colors"
                      >
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.created_at}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t">
                    <Button variant="ghost" size="sm" className="w-full">
                      모든 알림 보기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Status and Auth Buttons */}
          <div className="flex items-center space-x-2">
            {/* User Menu - if logged in */}
            {isHydrated && user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-accent/50 rounded-xl"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">
                      {user?.name || user?.nickname || '사용자'}
                    </p>
                    <div className={`text-xs text-muted-foreground`}>
                      {user?.school || '교사'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>

              {/* Enhanced Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-card/95 backdrop-blur-md shadow-xl animate-scale-in">
                  <div className="p-4 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{user?.nickname || '사용자'}</p>
                        <p className="text-sm text-muted-foreground">{user?.email || 'user@example.com'}</p>
                        <div className={`badge-${getRoleBadgeVariant(user?.role || 'teacher')} text-xs mt-1`}>
                          {getRoleLabel(user?.role || 'teacher')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-lg"
                      onClick={() => router.push('/profile')}
                    >
                      <User className="h-4 w-4 mr-3" />
                      프로필 관리
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-lg"
                      onClick={() => router.push('/settings')}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      설정
                    </Button>
                  </div>

                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                      onClick={async () => {
                        try {
                          // 서버에서 세션 정리
                          await fetch('/api/auth/logout', {
                            method: 'POST',
                            credentials: 'include'
                          });
                        } catch (error) {
                          console.error('Server logout error:', error);
                        }

                        // 사용자 메뉴 닫기
                        setShowUserMenu(false);

                        // 클라이언트 정리 실행 (페이지 새로고침 포함)
                        logout();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      로그아웃
                    </Button>
                  </div>
                </div>
              )}
              </div>
            )}

            {/* Auth Buttons - Only show when not logged in and hydrated */}
            {isHydrated && !user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/login')}
                  className="text-xs"
                >
                  로그인
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/signup')}
                  className="text-xs"
                >
                  회원가입
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}