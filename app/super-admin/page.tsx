'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  overview: {
    total_users: number;
    total_associations: number;
    recent_users: number;
    pending_memberships: number;
  };
  users_by_role: Array<{ role: string; count: number }>;
  latest_users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    association_name?: string;
  }>;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/super-admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 403 || response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">슈퍼 어드민 대시보드</h1>
            <nav className="flex space-x-4">
              <Link
                href="/super-admin/users"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                사용자 관리
              </Link>
              <Link
                href="/super-admin/associations"
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                협회 관리
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">전체 사용자</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.overview.total_users || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">전체 협회</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.overview.total_associations || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">최근 가입자 (7일)</h3>
            <p className="text-3xl font-bold text-purple-600">{stats?.overview.recent_users || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">대기중 멤버십</h3>
            <p className="text-3xl font-bold text-orange-600">{stats?.overview.pending_memberships || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users by Role */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">역할별 사용자</h2>
            <div className="space-y-4">
              {stats?.users_by_role.map((roleData) => (
                <div key={roleData.role} className="flex justify-between items-center">
                  <span className="font-medium capitalize">
                    {roleData.role === 'super_admin' && '슈퍼 어드민'}
                    {roleData.role === 'admin' && '관리자'}
                    {roleData.role === 'lawyer' && '변호사'}
                    {roleData.role === 'teacher' && '교사'}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {roleData.count}명
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">최근 가입자</h2>
            <div className="space-y-4">
              {stats?.latest_users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.association_name && (
                      <p className="text-xs text-gray-400">{user.association_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${{
                      'super_admin': 'bg-red-100 text-red-800',
                      'admin': 'bg-blue-100 text-blue-800',
                      'lawyer': 'bg-green-100 text-green-800',
                      'teacher': 'bg-gray-100 text-gray-800'
                    }[user.role] || 'bg-gray-100 text-gray-800'}`}>
                      {user.role === 'super_admin' && '슈퍼 어드민'}
                      {user.role === 'admin' && '관리자'}
                      {user.role === 'lawyer' && '변호사'}
                      {user.role === 'teacher' && '교사'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/super-admin/users"
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                모든 사용자 보기 →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">빠른 작업</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/super-admin/users/new"
              className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 text-center"
            >
              <div className="text-lg font-semibold">새 사용자 생성</div>
              <div className="text-sm opacity-90">관리자 또는 변호사 계정 생성</div>
            </Link>
            <Link
              href="/super-admin/associations/new"
              className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 text-center"
            >
              <div className="text-lg font-semibold">새 협회 생성</div>
              <div className="text-sm opacity-90">새로운 교사 협회 등록</div>
            </Link>
            <Link
              href="/super-admin/memberships"
              className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 text-center"
            >
              <div className="text-lg font-semibold">멤버십 승인</div>
              <div className="text-sm opacity-90">대기중인 가입 요청 처리</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}