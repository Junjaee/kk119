'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Search,
  Calendar,
  ChevronRight,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Scale,
  Eye,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useAuth } from '@/lib/hooks/useAuth';
import { roleDisplayNames } from '@/lib/types/user';

interface Report {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  incident_date: string;
  incident_time?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  assigned_lawyer_id?: string;
  assigned_at?: string;
  assigned_by?: string;
  consultation_priority?: number;
  requires_legal_consultation?: boolean;
  consultation_notes?: string;
  // Additional fields for display
  user_name?: string;
  lawyer_name?: string;
  file_count?: number;
}

export default function AdminReportsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterLawyerRequired, setFilterLawyerRequired] = useState(false);
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load reports from API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call
        // const response = await fetch('/api/admin/reports');
        // const data = await response.json();

        // Mock data for now - should be replaced with real API
        const mockReports: Report[] = [
          {
            id: '1',
            title: '학부모 욕설 및 협박',
            content: '학부모가 전화로 욕설을 하며 협박을 했습니다.',
            type: 'parent',
            status: 'investigating',
            incident_date: '2024-09-25',
            incident_time: '14:30',
            created_at: '2024-09-25T06:30:00Z',
            updated_at: '2024-09-25T06:30:00Z',
            user_id: 'user1',
            requires_legal_consultation: true,
            user_name: '익명교사123',
            file_count: 2
          },
          {
            id: '2',
            title: '학생 폭력 사건',
            content: '학생이 교사에게 물리적 폭력을 행사했습니다.',
            type: 'student',
            status: 'consulting',
            incident_date: '2024-09-24',
            created_at: '2024-09-24T08:15:00Z',
            updated_at: '2024-09-25T10:20:00Z',
            user_id: 'user2',
            assigned_lawyer_id: 'lawyer1',
            assigned_at: '2024-09-25T10:20:00Z',
            assigned_by: 'admin1',
            consultation_priority: 3,
            requires_legal_consultation: true,
            user_name: '익명교사456',
            lawyer_name: '김변호사',
            file_count: 1
          },
          {
            id: '3',
            title: '명예훼손성 발언',
            content: '학부모가 교사의 명예를 훼손하는 발언을 했습니다.',
            type: 'defamation',
            status: 'submitted',
            incident_date: '2024-09-23',
            created_at: '2024-09-23T16:45:00Z',
            updated_at: '2024-09-23T16:45:00Z',
            user_id: 'user3',
            requires_legal_consultation: true,
            user_name: '익명교사789',
            file_count: 3
          },
          {
            id: '4',
            title: '일반 민원 상담',
            content: '수업 방식에 대한 일반적인 민원입니다.',
            type: 'other',
            status: 'resolved',
            incident_date: '2024-09-22',
            created_at: '2024-09-22T11:20:00Z',
            updated_at: '2024-09-23T14:30:00Z',
            user_id: 'user4',
            requires_legal_consultation: false,
            user_name: '익명교사012'
          }
        ];

        setReports(mockReports);
      } catch (error) {
        console.error('Error loading reports:', error);
        setError('신고 내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const getStatusBadge = (status: string) => {
    const config = {
      submitted: {
        variant: 'default' as const,
        label: '접수 완료',
        icon: <Clock className="h-3 w-3" />
      },
      investigating: {
        variant: 'warning' as const,
        label: '조사중',
        icon: <Eye className="h-3 w-3" />
      },
      consulting: {
        variant: 'info' as const,
        label: '상담 진행중',
        icon: <MessageSquare className="h-3 w-3" />
      },
      resolved: {
        variant: 'success' as const,
        label: '해결 완료',
        icon: <CheckCircle className="h-3 w-3" />
      },
      rejected: {
        variant: 'error' as const,
        label: '반려',
        icon: <XCircle className="h-3 w-3" />
      },
    };

    const { variant, label, icon } = config[status as keyof typeof config] || {
      variant: 'default' as const,
      label: status,
      icon: <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      parent: '학부모 민원',
      student: '학생 폭력',
      verbal: '욕설 및 폭언',
      defamation: '명예훼손',
      harassment: '성희롱',
      threat: '협박',
      other: '기타'
    };
    return labels[type] || type;
  };

  const getPriorityBadge = (priority?: number) => {
    if (!priority) return null;

    const config = {
      1: { variant: 'error' as const, label: '긴급' },
      2: { variant: 'warning' as const, label: '높음' },
      3: { variant: 'default' as const, label: '보통' },
      4: { variant: 'secondary' as const, label: '낮음' },
      5: { variant: 'outline' as const, label: '매우낮음' }
    };

    const { variant, label } = config[priority as keyof typeof config] || { variant: 'default' as const, label: '보통' };

    return (
      <Badge variant={variant} className="text-xs">
        {label}
      </Badge>
    );
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesLawyerRequired = !filterLawyerRequired || report.requires_legal_consultation;
    const matchesUnassigned = !filterUnassigned || !report.assigned_lawyer_id;

    return matchesSearch && matchesStatus && matchesType && matchesLawyerRequired && matchesUnassigned;
  });

  // Statistics
  const stats = {
    total: reports.length,
    needsLawyer: reports.filter(r => r.requires_legal_consultation).length,
    unassigned: reports.filter(r => r.requires_legal_consultation && !r.assigned_lawyer_id).length,
    inConsulting: reports.filter(r => r.status === 'consulting').length
  };

  // Don't render anything until mounted (prevents SSR issues)
  if (!mounted) {
    return null;
  }

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // 관리자 권한 확인
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <Scale className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">접근 권한 없음</h2>
                <p className="text-muted-foreground mb-4">
                  이 페이지는 관리자만 접근할 수 있습니다.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm">현재 권한:</span>
                  <Badge>{roleDisplayNames[profile?.role || 'teacher']}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">신고 관리</h1>
            <p className="text-muted-foreground mt-2">
              변호사 배정 및 신고 처리 현황을 관리합니다
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 신고</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                총 접수된 신고 건수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">변호사 상담 필요</CardTitle>
              <Scale className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.needsLawyer}</div>
              <p className="text-xs text-muted-foreground">
                법률 상담이 필요한 건수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">변호사 미배정</CardTitle>
              <UserCheck className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.unassigned}</div>
              <p className="text-xs text-muted-foreground">
                배정이 필요한 건수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">상담 진행중</CardTitle>
              <MessageSquare className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{stats.inConsulting}</div>
              <p className="text-xs text-muted-foreground">
                현재 상담 진행 건수
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              검색 및 필터
            </CardTitle>
            <CardDescription>
              변호사 배정이 필요한 신고를 효과적으로 찾을 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="제목, 내용, 신고자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="모든 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="submitted">접수 완료</SelectItem>
                  <SelectItem value="investigating">조사중</SelectItem>
                  <SelectItem value="consulting">상담 진행중</SelectItem>
                  <SelectItem value="resolved">해결 완료</SelectItem>
                  <SelectItem value="rejected">반려</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="모든 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 유형</SelectItem>
                  <SelectItem value="parent">학부모 민원</SelectItem>
                  <SelectItem value="student">학생 폭력</SelectItem>
                  <SelectItem value="verbal">욕설 및 폭언</SelectItem>
                  <SelectItem value="defamation">명예훼손</SelectItem>
                  <SelectItem value="harassment">성희롱</SelectItem>
                  <SelectItem value="threat">협박</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lawyer-required"
                  checked={filterLawyerRequired}
                  onCheckedChange={setFilterLawyerRequired}
                />
                <label
                  htmlFor="lawyer-required"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  변호사 상담 필요
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unassigned"
                  checked={filterUnassigned}
                  onCheckedChange={setFilterUnassigned}
                />
                <label
                  htmlFor="unassigned"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  미배정만 표시
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{report.title}</h3>
                        {report.requires_legal_consultation && (
                          <Badge variant="outline" className="text-xs">
                            <Scale className="h-3 w-3 mr-1" />
                            변호사 상담 필요
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(report.consultation_priority)}
                        {getStatusBadge(report.status)}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.content}
                    </p>

                    {/* Assignment Info */}
                    {report.assigned_lawyer_id && (
                      <div className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">배정 변호사: {report.lawyer_name}</span>
                        </div>
                        {report.assigned_at && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>배정일: {formatRelativeTime(report.assigned_at)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>신고자: {report.user_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>발생일: {formatDate(report.incident_date)} {report.incident_time || ''}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>접수일: {formatRelativeTime(report.created_at)}</span>
                      </div>
                      {report.file_count && report.file_count > 0 && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>첨부파일 {report.file_count}개</span>
                        </div>
                      )}
                      <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Link href={`/admin/reports/${report.id}`}>
                      <Button variant="outline" size="sm">
                        상세보기
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                    {report.requires_legal_consultation && !report.assigned_lawyer_id && (
                      <Link href={`/admin/reports/${report.id}/assign-lawyer`}>
                        <Button size="sm" className="bg-primary">
                          <Scale className="h-4 w-4 mr-2" />
                          변호사 배정
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="text-center py-16">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterLawyerRequired || filterUnassigned
                    ? '조건에 맞는 신고가 없습니다'
                    : '신고 내역이 없습니다'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterLawyerRequired || filterUnassigned
                    ? '다른 검색 조건을 사용해보세요.'
                    : '신고가 접수되면 여기에 표시됩니다.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats Summary */}
        {filteredReports.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-sm text-primary">
                <p className="font-medium">
                  필터 결과: 총 {filteredReports.length}건 중 변호사 상담 필요 {filteredReports.filter(r => r.requires_legal_consultation).length}건,
                  미배정 {filteredReports.filter(r => r.requires_legal_consultation && !r.assigned_lawyer_id).length}건
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}