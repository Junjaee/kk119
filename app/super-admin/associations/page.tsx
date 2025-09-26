'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Association {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  established_date?: string;
  status: string;
  created_at: string;
  admin_count: number;
  lawyer_count: number;
  teacher_count: number;
  pending_members: number;
  approved_members: number;
}

export default function AssociationsManagement() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAssociations();
  }, []);

  const fetchAssociations = async () => {
    try {
      const response = await fetch('/api/super-admin/associations');
      if (response.ok) {
        const data = await response.json();
        setAssociations(data.associations);
      } else if (response.status === 403 || response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch associations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAssociation = async (associationId: number, name: string) => {
    if (!confirm(`정말로 "${name}" 협회를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const response = await fetch(`/api/super-admin/associations/${associationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAssociations(); // Refresh list
        alert('협회가 삭제되었습니다.');
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error}`);
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const toggleAssociationStatus = async (associationId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const response = await fetch(`/api/super-admin/associations/${associationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchAssociations(); // Refresh list
        alert(`협회 상태가 ${newStatus === 'active' ? '활성화' : '비활성화'}되었습니다.`);
      } else {
        const error = await response.json();
        alert(`상태 변경 실패: ${error.error}`);
      }
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.');
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
            <div>
              <Link href="/super-admin" className="text-blue-500 hover:text-blue-700 mr-2">
                ← 대시보드
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 inline">협회 관리</h1>
            </div>
            <Link
              href="/super-admin/associations/new"
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              새 협회 생성
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">전체 협회</h3>
            <p className="text-3xl font-bold text-green-600">{associations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">활성 협회</h3>
            <p className="text-3xl font-bold text-blue-600">
              {associations.filter(a => a.status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">총 관리자</h3>
            <p className="text-3xl font-bold text-purple-600">
              {associations.reduce((sum, a) => sum + a.admin_count, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">총 회원</h3>
            <p className="text-3xl font-bold text-orange-600">
              {associations.reduce((sum, a) => sum + a.approved_members, 0)}
            </p>
          </div>
        </div>

        {/* Associations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">협회 목록</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    협회 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    멤버 현황
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리 현황
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설립일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {associations.map((association) => (
                  <tr key={association.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{association.name}</div>
                        <div className="text-sm text-gray-500">코드: {association.code}</div>
                        {association.description && (
                          <div className="text-xs text-gray-400 mt-1">{association.description}</div>
                        )}
                        {association.phone && (
                          <div className="text-xs text-gray-400">{association.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAssociationStatus(association.id, association.status)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          association.status === 'active'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {association.status === 'active' ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>승인: {association.approved_members}명</div>
                      {association.pending_members > 0 && (
                        <div className="text-orange-600">대기: {association.pending_members}명</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>관리자: {association.admin_count}명</div>
                      <div>변호사: {association.lawyer_count}명</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {association.established_date
                        ? new Date(association.established_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/super-admin/associations/${association.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        상세보기
                      </Link>
                      <Link
                        href={`/super-admin/associations/${association.id}/edit`}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        편집
                      </Link>
                      <button
                        onClick={() => deleteAssociation(association.id, association.name)}
                        className="text-red-600 hover:text-red-900"
                        disabled={association.admin_count > 0 || association.teacher_count > 0 || association.approved_members > 0}
                        title={
                          (association.admin_count > 0 || association.teacher_count > 0 || association.approved_members > 0)
                            ? '회원이 있는 협회는 삭제할 수 없습니다'
                            : '협회 삭제'
                        }
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {associations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">등록된 협회가 없습니다.</div>
            <Link
              href="/super-admin/associations/new"
              className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600"
            >
              첫 번째 협회 생성하기
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}