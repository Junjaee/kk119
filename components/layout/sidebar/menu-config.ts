import {
  Home,
  FileText,
  Users,
  BarChart3,
  Shield,
  Settings,
  BookOpen,
  Scale,
  MessageSquare
} from 'lucide-react';
import { UserRole } from '@/lib/types/index';

export interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string | null;
  badgeColor?: string;
  isUrgent?: boolean;
}

export interface BadgeConfig {
  text: string;
  color: string;
}

// Badge color constants
export const BADGE_COLORS = {
  TRUST_MODERN: 'trust-modern',
  WARNING_MODERN: 'warning-modern',
  PROTECTION_MODERN: 'protection-modern',
  PRIMARY_MODERN: 'primary-modern'
} as const;

// Menu configuration for each role
export const MENU_CONFIG: Record<UserRole, MenuItem[]> = {
  teacher: [
    {
      href: '/',
      label: '홈',
      icon: Home,
      description: '대시보드 개요'
    },
    {
      href: '/reports/new',
      label: '신고 접수',
      icon: FileText,
      description: '교권 침해 신고하기'
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
      badgeColor: BADGE_COLORS.TRUST_MODERN
    },
    {
      href: '/resources',
      label: '교권 자료실',
      icon: BookOpen,
      description: '유용한 자료와 가이드'
    }
  ],

  lawyer: [
    {
      href: '/lawyer',
      label: '변호사 대시보드',
      icon: Scale,
      description: '상담 센터 관리'
    },
    {
      href: '/lawyer/consult',
      label: '상담 관리',
      icon: MessageSquare,
      description: '법률 상담 관리',
      badge: '대기중',
      badgeColor: BADGE_COLORS.WARNING_MODERN
    },
    {
      href: '/resources',
      label: '법률 자료실',
      icon: BookOpen,
      description: '법률 자료와 판례'
    }
  ],

  admin: [
    {
      href: '/admin',
      label: '협회관리자 대시보드',
      icon: Home,
      description: '협회 전체 현황'
    },
    {
      href: '/admin/reports',
      label: '신고 관리',
      icon: FileText,
      description: '협회 신고 관리',
      badge: '대기중',
      badgeColor: BADGE_COLORS.WARNING_MODERN
    },
    {
      href: '/admin/user-management',
      label: '회원 관리',
      icon: Users,
      description: '협회 회원 관리'
    },
    {
      href: '/admin/associations',
      label: '협회 관리',
      icon: Shield,
      description: '협회 정보 관리'
    },
    {
      href: '/admin/stats',
      label: '협회 통계',
      icon: BarChart3,
      description: '협회별 통계 분석'
    }
  ],

  super_admin: [
    {
      href: '/admin',
      label: '슈퍼관리자 대시보드',
      icon: Home,
      description: '전체 시스템 현황'
    },
    {
      href: '/admin/user-management',
      label: '사용자 관리',
      icon: Users,
      description: '모든 사용자 생성/관리',
      badge: 'ADMIN',
      badgeColor: BADGE_COLORS.PROTECTION_MODERN
    },
    {
      href: '/admin/reports',
      label: '전체 신고 관리',
      icon: FileText,
      description: '모든 신고 관리',
      badge: '대기중',
      badgeColor: BADGE_COLORS.WARNING_MODERN
    },
    {
      href: '/admin/associations',
      label: '협회 관리',
      icon: Shield,
      description: '협회 생성 및 관리'
    },
    {
      href: '/admin/stats',
      label: '시스템 통계',
      icon: BarChart3,
      description: '전체 시스템 분석'
    },
    {
      href: '/admin/settings',
      label: '시스템 설정',
      icon: Settings,
      description: '시스템 환경 설정'
    }
  ]
};

/**
 * Get menu items for a specific user role
 * Following Single Responsibility Principle
 */
export function getMenuItemsForRole(role: UserRole): MenuItem[] {
  return MENU_CONFIG[role] || [];
}

/**
 * Check if a menu item should be marked as active
 * Following Single Responsibility Principle
 */
export function isMenuItemActive(currentPath: string, menuHref: string): boolean {
  // Exact match for root and reports paths to prevent false positives
  if (menuHref === '/' || menuHref === '/reports') {
    return currentPath === menuHref;
  }

  // For other paths, check if current path starts with menu href
  return currentPath === menuHref || currentPath.startsWith(`${menuHref}/`);
}

/**
 * Get default menu item for role (used for fallbacks)
 * Following DRY principle
 */
export function getDefaultMenuItemForRole(role: UserRole): MenuItem | null {
  const items = getMenuItemsForRole(role);
  return items.length > 0 ? items[0] : null;
}