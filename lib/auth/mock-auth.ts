import { User } from '@/lib/types';

// Mock users for development (인증 시스템 제외)
export const mockUsers: User[] = [
  {
    id: 'teacher-1',
    email: 'teacher1@school.ac.kr',
    nickname: '익명교사1234',
    role: 'teacher',
    school_verified: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'lawyer-1',
    email: 'lawyer1@lawfirm.com',
    nickname: '교육법전문변호사',
    role: 'lawyer',
    school_verified: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'admin-1',
    email: 'admin@kyokwon119.com',
    nickname: '시스템관리자',
    role: 'admin',
    school_verified: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 'lawyer-admin-1',
    email: 'lawyer.admin@kyokwon119.com',
    nickname: '변호사관리자',
    role: 'lawyer_admin',
    school_verified: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }
];

// Get current user (임시로 교사 유저 반환)
export function getCurrentUser(): User {
  return mockUsers[0]; // Default to teacher user
}

// Switch user for testing
export function switchUser(role: 'teacher' | 'lawyer' | 'admin' | 'lawyer_admin'): User {
  const user = mockUsers.find(u => u.role === role);
  return user || mockUsers[0];
}