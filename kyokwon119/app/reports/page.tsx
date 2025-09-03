'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Search,
  Filter,
  Calendar,
  ChevronRight,
  FileWarning,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';

// Mock data
const mockReports = [
  {
    id: '1',
    title: '학부모 민원 관련 건',
    type: 'parent',
    status: 'consulting',
    content: '학부모가 수업 방식에 대해 과도한 민원을 제기하며 협박성 발언을 했습니다...',
    incident_date: '2025-08-25',
    created_at: '2025-08-27T10:00:00Z',
    has_consult: true,
    consult_count: 2
  },
  {
    id: '2',
    title: '학생 폭언 사건',
    type: 'student',
    status: 'completed',
    content: '수업 중 학생이 교사에게 욕설과 함께 위협적인 행동을 보였습니다...',
    incident_date: '2025-08-24',
    created_at: '2025-08-26T14:30:00Z',
    has_consult: true,
    consult_count: 3
  },
  {
    id: '3',
    title: '온라인 명예훼손',
    type: 'defamation',
    status: 'reviewing',
    content: 'SNS에서 허위 사실을 유포하며 명예를 훼손당했습니다...',
    incident_date: '2025-08-23',
    created_at: '2025-08-25T09:15:00Z',
    has_consult: false,
    consult_count: 0
  },
  {
    id: '4',
    title: '학교 행정 압박',
    type: 'other',
    status: 'received',
    content: '부당한 업무 지시와 함께 인사상 불이익을 암시받았습니다...',
    incident_date: '2025-08-22',
    created_at: '2025-08-24T16:45:00Z',
    has_consult: false,
    consult_count: 0
  }
];

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const getStatusBadge = (status: string) => {
    const config = {
      received: { variant: 'default' as const, label: '접수' },
      reviewing: { variant: 'warning' as const, label: '검토중' },
      consulting: { variant: 'warning' as const, label: '상담중' },
      completed: { variant: 'success' as const, label: '완료' },
    };
    
    const { variant, label } = config[status as keyof typeof config] || { variant: 'default' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      parent: '학부모 민원',
      student: '학생 폭력',
      defamation: '명예훼손',
      other: '기타'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'parent':
        return <FileWarning className="h-4 w-4 text-yellow-500" />;
      case 'student':
        return <FileWarning className="h-4 w-4 text-red-500" />;
      case 'defamation':
        return <FileWarning className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filter reports
  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">내 신고 내역</h1>
            <p className="text-muted-foreground mt-2">
              총 {mockReports.length}건의 신고가 있습니다
            </p>
          </div>
          <Link href="/reports/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 신고 작성
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">검색 및 필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="제목 또는 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">모든 상태</option>
                <option value="received">접수</option>
                <option value="reviewing">검토중</option>
                <option value="consulting">상담중</option>
                <option value="completed">완료</option>
              </Select>
              
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">모든 유형</option>
                <option value="parent">학부모 민원</option>
                <option value="student">학생 폭력</option>
                <option value="defamation">명예훼손</option>
                <option value="other">기타</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(report.type)}
                        <h3 className="text-lg font-semibold">{report.title}</h3>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.content}
                    </p>

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>발생일: {formatDate(report.incident_date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>접수일: {formatRelativeTime(report.created_at)}</span>
                      </div>
                      {report.has_consult && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>답변 {report.consult_count}개</span>
                        </div>
                      )}
                      <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                    </div>
                  </div>

                  {/* View Button */}
                  <Link href={`/reports/${report.id}`}>
                    <Button variant="ghost" size="sm" className="ml-4">
                      상세보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">신고 내역이 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                    ? '검색 결과가 없습니다. 다른 조건으로 검색해보세요.'
                    : '교권 침해를 당하셨다면 신고를 작성해주세요.'}
                </p>
                {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
                  <Link href="/reports/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      첫 신고 작성하기
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination - TODO: Implement when backend is ready */}
        {filteredReports.length > 0 && (
          <div className="flex justify-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              이전
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              다음
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}