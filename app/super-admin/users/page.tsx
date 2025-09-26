'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  association_id?: number;
  association_name?: string;
  school?: string;
  position?: string;
  phone?: string;
  isVerified: boolean;
  created_at: string;
}

interface Association {
  id: number;
  name: string;
  code: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    association_id: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const router = useRouter();

  useEffect(() => {
    fetchAssociations();
    fetchUsers();
  }, [filters, pagination.page]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.role) params.set('role', filters.role);
      if (filters.association_id) params.set('association_id', filters.association_id);
      if (filters.search) params.set('search', filters.search);
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const response = await fetch(`/api/super-admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else if (response.status === 403 || response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociations = async () => {
    try {
      const response = await fetch('/api/super-admin/associations');
      if (response.ok) {
        const data = await response.json();
        setAssociations(data.associations);
      }
    } catch (error) {
      console.error('Failed to fetch associations:', error);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('정말로 이 사용자를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers(); // Refresh list
        alert('사용자가 삭제되었습니다.');
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error}`);
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return '슈퍼 어드민';
      case 'admin': return '관리자';
      case 'lawyer': return '변호사';
      case 'teacher': return '교사';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'lawyer': return 'bg-green-100 text-green-800';
      case 'teacher': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && users.length === 0) {
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
            <div>
              <Link href="/super-admin" className="text-blue-500 hover:text-blue-700 mr-2">
                ← 대시보드
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 inline">사용자 관리</h1>
            </div>
            <Link
              href="/super-admin/users/new"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              새 사용자 생성
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">필터</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">모든 역할</option>
                <option value="super_admin">슈퍼 어드민</option>
                <option value="admin">관리자</option>
                <option value="lawyer">변호사</option>
                <option value="teacher">교사</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">협회</label>
              <select
                value={filters.association_id}
                onChange={(e) => handleFilterChange('association_id', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">모든 협회</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name} ({assoc.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="이름, 이메일, 닉네임으로 검색"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">
              사용자 목록 ({pagination.total}명)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    협회
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-400">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.association_name || '-'}
                      </div>
                      {user.school && (
                        <div className="text-xs text-gray-500">{user.school}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.isVerified ? '인증됨' : '미인증'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/super-admin/users/${user.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        편집
                      </Link>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={user.role === 'super_admin'}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    총 <span className="font-medium">{pagination.total}</span>개 중{' '}
                    <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>-
                    <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> 표시
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                  >
                    이전
                  </button>
                  <span className="px-3 py-1 text-sm">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}