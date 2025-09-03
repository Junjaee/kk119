'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';
import {
  Home,
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  Shield,
  Briefcase,
  Settings,
  X,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Star,
  TrendingUp
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
      badge: '긴급',
      badgeColor: 'urgent-modern',
      isUrgent: true
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
      href: '/consult', 
      label: '변호사 상담', 
      icon: MessageSquare, 
      description: '전문가 법률 상담',
      badge: null
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
      label: '대시보드', 
      icon: Home, 
      description: '변호사 전용 대시보드',
      badge: null
    },
    { 
      href: '/lawyer/cases', 
      label: '사건 관리', 
      icon: Briefcase, 
      description: '담당 사건 관리',
      badge: '12건'
    },
    { 
      href: '/lawyer/consults', 
      label: '상담 관리', 
      icon: MessageSquare, 
      description: '상담 일정 및 내역',
      badge: '신규',
      badgeColor: 'protection-modern'
    },
    { 
      href: '/community', 
      label: '커뮤니티', 
      icon: Users, 
      description: '교사 커뮤니티 참여',
      badge: null
    },
    { 
      href: '/lawyer/stats', 
      label: '통계', 
      icon: BarChart3, 
      description: '성과 및 분석',
      badge: null
    },
  ],
  admin: [
    { 
      href: '/admin', 
      label: '관리자 대시보드', 
      icon: Home, 
      description: '시스템 전체 현황',
      badge: null
    },
    { 
      href: '/admin/reports', 
      label: '신고 관리', 
      icon: FileText, 
      description: '모든 신고 관리',
      badge: '대기중',
      badgeColor: 'warning-modern'
    },
    { 
      href: '/admin/users', 
      label: '사용자 관리', 
      icon: Users, 
      description: '회원 및 권한 관리',
      badge: null
    },
    { 
      href: '/admin/lawyers', 
      label: '변호사 관리', 
      icon: Briefcase, 
      description: '변호사 승인 및 관리',
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

const quickActions = [
  {
    label: '도움말',
    icon: HelpCircle,
    href: '/help',
    color: 'protection'
  },
  {
    label: '평가하기',
    icon: Star,
    href: '/feedback',
    color: 'primary'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, sidebarOpen, setSidebarOpen } = useStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const userRole = user?.role || 'teacher';
  const items = menuItems[userRole];

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

          {/* User Role Banner */}
          <div className="px-6 py-4 border-b border-border/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">교권119</h2>
                <p className="text-xs text-muted-foreground">
                  {userRole === 'admin' ? '관리자 패널' : 
                   userRole === 'lawyer' ? '변호사 패널' : 
                   '교사 패널'}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 scrollbar-modern overflow-y-auto">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              
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

            {/* Quick Actions */}
            <div className="pt-6 mt-6 border-t border-border/40">
              <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                빠른 실행
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex flex-col items-center p-3 rounded-xl hover:bg-accent/50 transition-all duration-200 group"
                    >
                      <div className={cn(
                        'p-2 rounded-lg mb-2 transition-all duration-200',
                        action.color === 'protection' 
                          ? 'bg-protection-100 text-protection-600 group-hover:bg-protection-200 dark:bg-protection-950/50 dark:text-protection-400'
                          : 'bg-primary-100 text-primary-600 group-hover:bg-primary-200 dark:bg-primary-950/50 dark:text-primary-400'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
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