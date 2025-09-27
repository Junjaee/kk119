'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Shield,
  Settings,
  X,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Scale,
  MessageSquare
} from 'lucide-react';

type MenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge: string | null;
  badgeColor?: string;
  isUrgent?: boolean;
};

type MenuItems = {
  [key: string]: MenuItem[];
};

const menuItems: MenuItems = {
  teacher: [
    {
      href: '/',
      label: '홈',
      icon: Home,
      description: '대시보드 개요',
      badge: null
    },
    {
      href: '/reports/new',
      label: '신고 접수',
      icon: FileText,
      description: '교권 침해 신고하기',
      badge: null
    },
    {
      href: '/reports',
      label: '내 신고 내역',
      icon: Shield,
      description: '신고 처리 현황',
      badge: '3건'
    },
    {
      href: '/community',
      label: '커뮤니티',
      icon: Users,
      description: '교사들과 소통하기',
      badge: 'HOT',
      badgeColor: 'trust-modern'
    },
    {
      href: '/resources',
      label: '교권 자료실',
      icon: BookOpen,
      description: '유용한 자료와 가이드',
      badge: null
    },
  ],
  lawyer: [
    {
      href: '/lawyer',
      label: '변호사 대시보드',
      icon: Scale,
      description: '상담 센터 관리',
      badge: null
    },
    {
      href: '/lawyer/consult',
      label: '상담 관리',
      icon: MessageSquare,
      description: '법률 상담 관리',
      badge: '대기중',
      badgeColor: 'warning-modern'
    },
    {
      href: '/resources',
      label: '법률 자료실',
      icon: BookOpen,
      description: '법률 자료와 판례',
      badge: null
    },
  ],
  admin: [
    {
      href: '/admin',
      label: '협회관리자 대시보드',
      icon: Home,
      description: '협회 전체 현황',
      badge: null
    },
    {
      href: '/admin/reports',
      label: '신고 관리',
      icon: FileText,
      description: '협회 신고 관리',
      badge: '대기중',
      badgeColor: 'warning-modern'
    },
    {
      href: '/admin/members',
      label: '회원 관리',
      icon: Users,
      description: '협회 회원 관리',
      badge: null
    },
    {
      href: '/admin/associations',
      label: '협회 관리',
      icon: Shield,
      description: '협회 정보 관리',
      badge: null
    },
    {
      href: '/admin/stats',
      label: '협회 통계',
      icon: BarChart3,
      description: '협회별 통계 분석',
      badge: null
    },
  ],
  super_admin: [
    {
      href: '/admin',
      label: '슈퍼관리자 대시보드',
      icon: Home,
      description: '전체 시스템 현황',
      badge: null
    },
    {
      href: '/admin/user-management',
      label: '사용자 관리',
      icon: Users,
      description: '모든 사용자 생성/관리',
      badge: 'ADMIN',
      badgeColor: 'protection-modern'
    },
    {
      href: '/admin/reports',
      label: '전체 신고 관리',
      icon: FileText,
      description: '모든 신고 관리',
      badge: '대기중',
      badgeColor: 'warning-modern'
    },
    {
      href: '/admin/associations',
      label: '협회 관리',
      icon: Shield,
      description: '협회 생성 및 관리',
      badge: null
    },
    {
      href: '/admin/stats',
      label: '시스템 통계',
      icon: BarChart3,
      description: '전체 시스템 분석',
      badge: null
    },
    {
      href: '/admin/settings',
      label: '시스템 설정',
      icon: Settings,
      description: '시스템 환경 설정',
      badge: null
    },
  ],
};


export function Sidebar() {
  const pathname = usePathname();
  const { user, sidebarOpen, setSidebarOpen } = useStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wait for user to load
  React.useEffect(() => {
    if (user !== null) {
      setIsLoading(false);
    }
  }, [user]);

  const userRole = user?.role || 'teacher';
  const items = menuItems[userRole];

  console.log('🔍 Sidebar Debug:', {
    isLoading,
    user,
    userRole,
    userRoleFromUser: user?.role,
    fallbackToTeacher: !user?.role,
    availableRoles: Object.keys(menuItems),
    itemsCount: items?.length || 0,
    menuItemsAdmin: menuItems.admin,
    itemsRaw: items
  });

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 glass-morphism border-r border-border/40 transform transition-all duration-300 lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full animate-slide-in">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl hover:bg-accent/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-4 pt-2 lg:pt-6 space-y-2 scrollbar-modern overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon;
              // More precise active state check to prevent false positives
              const isActive = pathname === item.href ||
                (item.href !== '/' && item.href !== '/reports' && pathname.startsWith(item.href)) ||
                (item.href === '/reports' && pathname === '/reports');
              
              return (
                <div key={item.href} className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                        : 'hover:bg-accent/50 text-foreground'
                    )}
                    onClick={() => setSidebarOpen(false)}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'p-2 rounded-lg transition-all duration-200',
                        isActive 
                          ? 'bg-white/20' 
                          : 'bg-accent/30 group-hover:bg-accent/50'
                      )}>
                        <Icon className={cn(
                          'h-4 w-4 transition-all duration-200',
                          item.isUrgent && !isActive && 'urgent-pulse'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className={cn(
                          'text-xs transition-colors',
                          isActive ? 'text-white/80' : 'text-muted-foreground'
                        )}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <span className={cn(
                          'px-2 py-1 text-xs font-semibold rounded-full',
                          item.badgeColor 
                            ? `badge-${item.badgeColor}` 
                            : isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-primary/10 text-primary'
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {hoveredItem === item.href && !isActive && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-white rounded-r-full" />
                    )}
                  </Link>
                </div>
              );
            })}

          </nav>

          {/* Enhanced Footer */}
          <div className="border-t border-border/40 p-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                <p className="font-semibold">교권119</p>
                <p className="flex items-center gap-1 mt-1">
                  v2.0.0 
                  <TrendingUp className="h-3 w-3 text-trust-500" />
                </p>
              </div>
              <div className="text-right">
                <p>© 2025</p>
                <p className="text-trust-600 dark:text-trust-400 font-medium">교권보호</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}