'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Membership {
  id: number;
  user_id: number;
  association_id: number;
  status: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  user_school?: string;
  user_position?: string;
  association_name: string;
  association_code: string;
  approved_by_name?: string;
}

interface Summary {
  pending: number;
  approved: number;
  rejected: number;
}

export default function MembershipsManagement() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMemberships();
  }, [statusFilter, pagination.page]);

  const fetchMemberships = async () => {
    try {
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());

      const response = await fetch(`/api/admin/memberships?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMemberships(data.memberships);
        setSummary(data.summary);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      } else if (response.status === 403 || response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveMembership = async (membershipId: number) => {
    if (!confirm('이 가입 신청을 승인하시겠습니까?')) return;

    setProcessingId(membershipId);
    try {
      const response = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve' })
      });

      if (response.ok) {
        fetchMemberships(); // Refresh list
        alert('가입 신청이 승인되었습니다.');
      } else {
        const error = await response.json();
        alert(`승인 실패: ${error.error}`);
      }
    } catch (error) {
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectMembership = async (membershipId: number) => {
    if (!rejectionReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }

    setProcessingId(membershipId);
    try {
      const response = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectionReason.trim()
        })
      });

      if (response.ok) {
        fetchMemberships(); // Refresh list
        setShowRejectModal(null);
        setRejectionReason('');
        alert('가입 신청이 거절되었습니다.');
      } else {
        const error = await response.json();
        alert(`거절 실패: ${error.error}`);
      }
    } catch (error) {
      alert('거절 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '대기 중';
      case 'approved': return '승인됨';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  if (loading && memberships.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">멤버십 승인 관리</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">대기 중</h3>
            <p className="text-3xl font-bold text-yellow-600">{summary.pending}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">승인됨</h3>
            <p className="text-3xl font-bold text-green-600">{summary.approved}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">거절됨</h3>
            <p className="text-3xl font-bold text-red-600">{summary.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">필터</h2>
          <div className="flex space-x-4">
            {[
              { value: 'pending', label: '대기 중', count: summary.pending },
              { value: 'approved', label: '승인됨', count: summary.approved },
              { value: 'rejected', label: '거절됨', count: summary.rejected },
              { value: 'all', label: '전체', count: summary.pending + summary.approved + summary.rejected }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  statusFilter === filter.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Memberships Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">
              가입 신청 목록 ({pagination.total}개)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    협회
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberships.map((membership) => (
                  <tr key={membership.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{membership.user_name}</div>
                        <div className="text-sm text-gray-500">{membership.user_email}</div>
                        {membership.user_school && (
                          <div className="text-xs text-gray-400">{membership.user_school}</div>
                        )}
                        {membership.user_phone && (
                          <div className="text-xs text-gray-400">{membership.user_phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{membership.association_name}</div>
                      <div className="text-xs text-gray-500">{membership.association_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(membership.status)}`}>
                        {getStatusLabel(membership.status)}
                      </span>
                      {membership.status === 'rejected' && membership.rejection_reason && (
                        <div className="text-xs text-red-600 mt-1">
                          사유: {membership.rejection_reason}
                        </div>
                      )}
                      {membership.approved_by_name && (
                        <div className="text-xs text-gray-500 mt-1">
                          처리자: {membership.approved_by_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(membership.created_at).toLocaleDateString()}</div>
                      {membership.approved_at && (
                        <div className="text-xs">
                          처리: {new Date(membership.approved_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {membership.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => approveMembership(membership.id)}
                            disabled={processingId === membership.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectModal(membership.id);
                              setRejectionReason('');
                            }}
                            disabled={processingId === membership.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            거절
                          </button>
                        </div>
                      )}
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

        {memberships.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-500 text-lg">
              {statusFilter === 'pending' && '대기 중인 가입 신청이 없습니다.'}
              {statusFilter === 'approved' && '승인된 가입 신청이 없습니다.'}
              {statusFilter === 'rejected' && '거절된 가입 신청이 없습니다.'}
              {statusFilter === 'all' && '가입 신청이 없습니다.'}
            </div>
          </div>
        )}
      </main>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">가입 신청 거절</h3>
            <p className="text-gray-600 mb-4">거절 사유를 입력해주세요:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
              rows={3}
              placeholder="거절 사유를 입력하세요..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => rejectMembership(showRejectModal)}
                disabled={processingId === showRejectModal}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}