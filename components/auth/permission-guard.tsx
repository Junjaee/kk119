'use client';

import { usePermissions, WithPermissionProps } from '@/lib/hooks/usePermissions';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { AssociationMember } from '@/lib/types/user';
import { createClient } from '@/lib/supabase/client';

// 권한 기반 컴포넌트 래퍼
export function PermissionGuard({
  resource,
  action,
  context,
  fallback = null,
  children
}: WithPermissionProps) {
  const { user } = useStore();
  const [userAssociations, setUserAssociations] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // 사용자 협회 정보 로드
  useEffect(() => {
    const loadUserAssociations = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('association_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error loading user associations:', error);
        } else {
          setUserAssociations(data || []);
        }
      } catch (err) {
        console.error('Exception loading user associations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserAssociations();
  }, [user?.id, supabase]);

  const { hasPermission } = usePermissions(user, userAssociations);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasPermission(resource, action, context)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 역할 기반 컴포넌트 래퍼
interface RoleGuardProps {
  roles: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({ roles, fallback = null, children }: RoleGuardProps) {
  const { user } = useStore();

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasRequiredRole = user?.role && allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 인증 상태 기반 컴포넌트 래퍼
interface AuthGuardProps {
  requireAuth?: boolean;
  requireVerification?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthGuard({
  requireAuth = true,
  requireVerification = false,
  fallback = null,
  children
}: AuthGuardProps) {
  const { user } = useStore();
  const loading = false; // Since we're not using async auth, no loading state needed

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <>{fallback}</>;
  }

  if (requireVerification && !user?.is_verified) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          계정 승인이 필요합니다. 관리자의 승인을 기다려주세요.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// 협회 멤버십 기반 컴포넌트 래퍼
interface AssociationGuardProps {
  associationId?: string;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AssociationGuard({
  associationId,
  requireAdmin = false,
  fallback = null,
  children
}: AssociationGuardProps) {
  const { user } = useStore();
  const [userAssociations, setUserAssociations] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const loadUserAssociations = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const query = supabase
          .from('association_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (associationId) {
          query.eq('association_id', associationId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading user associations:', error);
        } else {
          setUserAssociations(data || []);
        }
      } catch (err) {
        console.error('Exception loading user associations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserAssociations();
  }, [user?.id, associationId, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 협회 멤버십 체크
  const relevantMembership = associationId
    ? userAssociations.find(m => m.association_id === associationId)
    : userAssociations.length > 0;

  if (!relevantMembership) {
    return <>{fallback}</>;
  }

  // 관리자 권한 체크 (필요한 경우)
  if (requireAdmin) {
    const isAssociationAdmin = userAssociations.some(
      m => (!associationId || m.association_id === associationId) && m.is_admin
    );

    if (!isAssociationAdmin && user?.role !== 'super_admin') {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}