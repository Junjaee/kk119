'use client';

import { useMemo } from 'react';
import {
  UserRole,
  UserProfile,
  ResourceType,
  ActionType,
  Permission,
  rolePermissions,
  AssociationMember
} from '@/lib/types/user';

interface PermissionContext {
  userId?: string;
  userRole?: UserRole;
  userAssociations?: string[]; // 사용자가 속한 협회 ID 배열
  resourceOwnerId?: string; // 리소스 소유자 ID
  resourceAssociationId?: string; // 리소스 소속 협회 ID
  additionalConditions?: Record<string, any>;
}

interface PermissionCheck {
  hasPermission: (
    resource: ResourceType,
    action: ActionType,
    context?: PermissionContext
  ) => boolean;
  canAccessResource: (
    resource: ResourceType,
    context?: PermissionContext
  ) => boolean;
  getUserPermissions: () => Permission[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLawyer: boolean;
  isTeacher: boolean;
}

export function usePermissions(
  userProfile: UserProfile | null,
  userAssociations: AssociationMember[] = []
): PermissionCheck {
  const userRole = userProfile?.role;
  const userId = userProfile?.id;
  const associationIds = useMemo(
    () => userAssociations.filter(m => m.is_active).map(m => m.association_id),
    [userAssociations]
  );

  // 사용자 권한 목록 가져오기
  const getUserPermissions = useMemo(() => {
    if (!userRole) return [];
    return rolePermissions[userRole] || [];
  }, [userRole]);

  // 권한 체크 함수
  const hasPermission = useMemo(() => {
    return (
      resource: ResourceType,
      action: ActionType,
      context: PermissionContext = {}
    ): boolean => {
      if (!userRole || !userId) return false;

      const permissions = getUserPermissions;
      const relevantPermissions = permissions.filter(
        p => p.resource === resource && (p.action === action || p.action === 'manage')
      );

      if (relevantPermissions.length === 0) return false;

      return relevantPermissions.some(permission => {
        // 스코프 체크
        switch (permission.scope) {
          case 'all':
            return true;

          case 'association':
            // 협회 내 권한: 사용자와 리소스가 같은 협회에 속해야 함
            if (context.resourceAssociationId) {
              return associationIds.includes(context.resourceAssociationId);
            }
            return true; // 협회 ID가 없으면 기본 허용

          case 'own':
            // 본인 소유 리소스만: 사용자 ID가 리소스 소유자와 일치해야 함
            return userId === context.resourceOwnerId;

          default:
            return false;
        }
      });
    };
  }, [userRole, userId, getUserPermissions, associationIds]);

  // 리소스 접근 가능 여부 (읽기 권한 기준)
  const canAccessResource = useMemo(() => {
    return (resource: ResourceType, context: PermissionContext = {}): boolean => {
      return hasPermission(resource, 'read', context);
    };
  }, [hasPermission]);

  // 역할별 편의 속성
  const roleChecks = useMemo(() => ({
    isSuperAdmin: userRole === 'super_admin',
    isAdmin: userRole === 'admin',
    isLawyer: userRole === 'lawyer',
    isTeacher: userRole === 'teacher',
  }), [userRole]);

  return {
    hasPermission,
    canAccessResource,
    getUserPermissions: () => getUserPermissions,
    ...roleChecks,
  };
}

// 권한 기반 라우트 가드 훅
export function useRouteGuard(
  userProfile: UserProfile | null,
  requiredRole?: UserRole | UserRole[],
  redirectPath: string = '/login'
) {
  const isAuthenticated = !!userProfile;
  const userRole = userProfile?.role;

  const hasRequiredRole = useMemo(() => {
    if (!requiredRole || !userRole) return true;

    const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return required.includes(userRole);
  }, [userRole, requiredRole]);

  const shouldRedirect = useMemo(() => {
    if (!isAuthenticated) return redirectPath;
    if (!hasRequiredRole) return '/unauthorized';
    return null;
  }, [isAuthenticated, hasRequiredRole, redirectPath]);

  return {
    isAuthenticated,
    hasRequiredRole,
    shouldRedirect,
    canAccess: isAuthenticated && hasRequiredRole,
  };
}

// 컴포넌트 권한 체크를 위한 HOC 타입
export interface WithPermissionProps {
  resource: ResourceType;
  action: ActionType;
  context?: PermissionContext;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}