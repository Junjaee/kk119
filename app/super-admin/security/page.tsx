'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource?: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  success: boolean;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface SecurityEvent {
  id: number;
  event_type: string;
  severity: string;
  user_id?: number;
  ip_address?: string;
  description: string;
  metadata?: string;
  resolved: boolean;
  resolved_by?: number;
  resolved_at?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  resolved_by_name?: string;
}

export default function SecurityManagement() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('audit');
  const [filters, setFilters] = useState({
    action: '',
    success: '',
    severity: '',
    resolved: '',
    start_date: '',
    end_date: ''
  });
  const router = useRouter();

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else {
      fetchSecurityEvents();
    }
  }, [activeTab, filters]);

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action) params.set('action', filters.action);
      if (filters.success) params.set('success', filters.success);
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      params.set('limit', '100');

      const response = await fetch(`/api/super-admin/audit/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
      } else if (response.status === 403 || response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.resolved) params.set('resolved', filters.resolved);
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      params.set('limit', '100');

      const response = await fetch(`/api/super-admin/audit/security-events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSecurityEvents(data.events);
      } else if (response.status === 403 || response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveSecurityEvent = async (eventId: number, resolved: boolean) => {
    try {
      const response = await fetch('/api/super-admin/audit/security-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: eventId,
          resolved
        })
      });

      if (response.ok) {
        fetchSecurityEvents();
        alert(`보안 이벤트가 ${resolved ? '해결' : '재개'}되었습니다.`);
      } else {
        const error = await response.json();
        alert(`처리 실패: ${error.error}`);
      }
    } catch (error) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'login_failed':
        return 'bg-red-100 text-red-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      case 'user_create':
      case 'association_create':
        return 'bg-blue-100 text-blue-800';
      case 'user_delete':
      case 'association_delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return '심각';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return severity;
    }
  };

  if (loading && auditLogs.length === 0 && securityEvents.length === 0) {
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
              <h1 className="text-3xl font-bold text-gray-900 inline">보안 관리</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('audit')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'audit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                감사 로그
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                보안 이벤트
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">필터</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {activeTab === 'audit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작업</label>
                    <select
                      value={filters.action}
                      onChange={(e) => handleFilterChange('action', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">모든 작업</option>
                      <option value="login">로그인</option>
                      <option value="login_failed">로그인 실패</option>
                      <option value="user_create">사용자 생성</option>
                      <option value="user_update">사용자 수정</option>
                      <option value="user_delete">사용자 삭제</option>
                      <option value="association_create">협회 생성</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성공 여부</label>
                    <select
                      value={filters.success}
                      onChange={(e) => handleFilterChange('success', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">전체</option>
                      <option value="true">성공</option>
                      <option value="false">실패</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'security' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">심각도</label>
                    <select
                      value={filters.severity}
                      onChange={(e) => handleFilterChange('severity', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">모든 심각도</option>
                      <option value="critical">심각</option>
                      <option value="high">높음</option>
                      <option value="medium">보통</option>
                      <option value="low">낮음</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">해결 상태</label>
                    <select
                      value={filters.resolved}
                      onChange={(e) => handleFilterChange('resolved', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">전체</option>
                      <option value="false">미해결</option>
                      <option value="true">해결됨</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                감사 로그 ({auditLogs.length}개)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      리소스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP 주소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      세부사항
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.user_name || '시스템'}
                        </div>
                        <div className="text-sm text-gray-500">{log.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resource && (
                          <div>
                            <div>{log.resource}</div>
                            {log.resource_id && (
                              <div className="text-xs text-gray-500">#{log.resource_id}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.success ? '성공' : '실패'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={log.details}>
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {auditLogs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">감사 로그가 없습니다.</div>
              </div>
            )}
          </div>
        )}

        {/* Security Events Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                보안 이벤트 ({securityEvents.length}개)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이벤트 유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      심각도
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP 주소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {securityEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.event_type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeClass(event.severity)}`}>
                          {getSeverityLabel(event.severity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {event.user_name || '-'}
                        </div>
                        <div className="text-sm text-gray-500">{event.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.ip_address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={event.description}>
                          {event.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {event.resolved ? '해결됨' : '미해결'}
                        </span>
                        {event.resolved && event.resolved_by_name && (
                          <div className="text-xs text-gray-500 mt-1">
                            {event.resolved_by_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => resolveSecurityEvent(event.id, !event.resolved)}
                          className={`text-sm ${
                            event.resolved
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {event.resolved ? '재개' : '해결'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {securityEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">보안 이벤트가 없습니다.</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}