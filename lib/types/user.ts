// 4-tier 사용자 시스템 타입 정의

export type UserRole = 'super_admin' | 'admin' | 'lawyer' | 'teacher';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  school_name?: string; // 교사용
  employee_id?: string; // 교사 ID
  license_number?: string; // 변호사 면허번호
  law_firm?: string; // 변호사 소속 로펌
  specialization?: string; // 변호사 전문분야
  is_active: boolean;
  is_verified: boolean; // 관리자 승인 여부
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Association {
  id: string;
  name: string;
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssociationMember {
  id: string;
  user_id: string;
  association_id: string;
  is_admin: boolean; // 해당 협회의 관리자 여부
  joined_at: string;
  approved_at?: string;
  approved_by?: string;
  is_active: boolean;
}

// 권한 매트릭스를 위한 리소스 타입
export type ResourceType =
  | 'reports'
  | 'community_posts'
  | 'consultation_posts'
  | 'users'
  | 'associations'
  | 'system_settings'
  | 'analytics';

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'manage';

// 권한 매트릭스 정의
export interface Permission {
  resource: ResourceType;
  action: ActionType;
  scope: 'own' | 'association' | 'all'; // 본인만 | 협회내 | 전체
  conditions?: Record<string, any>; // 추가 조건
}

// 역할별 기본 권한 정의
export const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    // 모든 리소스에 대한 전체 권한
    { resource: 'reports', action: 'manage', scope: 'all' },
    { resource: 'community_posts', action: 'manage', scope: 'all' },
    { resource: 'consultation_posts', action: 'manage', scope: 'all' },
    { resource: 'users', action: 'manage', scope: 'all' },
    { resource: 'associations', action: 'manage', scope: 'all' },
    { resource: 'system_settings', action: 'manage', scope: 'all' },
    { resource: 'analytics', action: 'read', scope: 'all' },
  ],
  admin: [
    // 협회 내 관리 권한
    { resource: 'reports', action: 'read', scope: 'association' },
    { resource: 'reports', action: 'update', scope: 'association' },
    { resource: 'community_posts', action: 'manage', scope: 'association' },
    { resource: 'consultation_posts', action: 'read', scope: 'association' },
    { resource: 'users', action: 'read', scope: 'association' },
    { resource: 'users', action: 'update', scope: 'association', conditions: { exclude_roles: ['super_admin'] } },
    { resource: 'analytics', action: 'read', scope: 'association' },
  ],
  lawyer: [
    // 법적 상담 관련 권한
    { resource: 'reports', action: 'read', scope: 'association' },
    { resource: 'reports', action: 'update', scope: 'association', conditions: { assigned_only: true } },
    { resource: 'community_posts', action: 'read', scope: 'association' },
    { resource: 'community_posts', action: 'create', scope: 'association' },
    { resource: 'community_posts', action: 'update', scope: 'own' },
    { resource: 'consultation_posts', action: 'manage', scope: 'association' },
  ],
  teacher: [
    // 기본 사용자 권한
    { resource: 'reports', action: 'create', scope: 'own' },
    { resource: 'reports', action: 'read', scope: 'own' },
    { resource: 'reports', action: 'update', scope: 'own', conditions: { time_limit: '24h' } },
    { resource: 'community_posts', action: 'read', scope: 'association' },
    { resource: 'community_posts', action: 'create', scope: 'association' },
    { resource: 'community_posts', action: 'update', scope: 'own' },
    { resource: 'community_posts', action: 'delete', scope: 'own' },
    { resource: 'consultation_posts', action: 'create', scope: 'association' },
    { resource: 'consultation_posts', action: 'read', scope: 'own' },
  ],
};

// 역할 표시명
export const roleDisplayNames: Record<UserRole, string> = {
  super_admin: '최고관리자',
  admin: '협회관리자',
  lawyer: '변호사',
  teacher: '교사',
};

// 역할별 색상 테마
export const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-red-100 text-red-800 border-red-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  lawyer: 'bg-purple-100 text-purple-800 border-purple-200',
  teacher: 'bg-green-100 text-green-800 border-green-200',
};