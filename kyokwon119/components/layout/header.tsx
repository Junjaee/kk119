'use client';

import React, { useState } from 'react';
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
  Search,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const router = useRouter();
  const { user, theme, toggleTheme, setSidebarOpen, sidebarOpen, notifications, logout } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'urgent-modern';
      case 'lawyer': return 'protection-modern';
      default: return 'primary-modern';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'lawyer': return '변호사';
      default: return '교사';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-morphism animate-slide-down">
      <div className="flex h-18 items-center px-4 lg:px-8">
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
            <Shield className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="text-2xl font-bold gradient-text">교권119</span>
            <p className="text-xs text-muted-foreground -mt-1">교사의 권리를 지킵니다</p>
          </div>
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="신고, 상담, 커뮤니티 검색..."
              className="input-modern pl-10 w-full"
            />
          </div>
        </div>

        <div className="flex-1 md:flex-none" />

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Quick Report Button */}
          <Link href="/reports/new">
            <Button className="btn-urgent-modern hidden sm:inline-flex">
              <Shield className="h-4 w-4" />
              긴급신고
            </Button>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative hover:bg-accent/50 rounded-xl"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-urgent-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
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

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-accent/50 rounded-xl"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Enhanced User Menu */}
          {user ? (
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-accent/50 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
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
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start rounded-lg">
                      <User className="h-4 w-4 mr-3" />
                      프로필 관리
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-start rounded-lg">
                      <Settings className="h-4 w-4 mr-3" />
                      설정
                    </Button>
                  </Link>
                </div>

                <div className="p-2 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg"
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      logout();
                      router.push('/');
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    로그아웃
                  </Button>
                </div>
              </div>
            )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}