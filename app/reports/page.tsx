'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { 
  FileText, 
  Plus, 
  Search,
  Calendar,
  ChevronRight,
  FileWarning,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { localDB, Report } from '@/lib/services/localDB';

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reports from local DB
  useEffect(() => {
    const loadReports = () => {
      try {
        const allReports = localDB.getAllReports();
        // Sort by createdAt descending (newest first)
        const sortedReports = allReports.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReports(sortedReports);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
    
    // Initialize with sample data if no reports exist
    if (localDB.getAllReports().length === 0) {
      localDB.initWithSampleData();
      loadReports();
    }
  }, []);

  const getStatusBadge = (status: Report['status']) => {
    const config = {
      pending: { 
        variant: 'default' as const, 
        label: '접수 대기', 
        icon: <Clock className="h-3 w-3" /> 
      },
      processing: { 
        variant: 'warning' as const, 
        label: '처리중', 
        icon: <AlertCircle className="h-3 w-3" /> 
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
    
    const { variant, label, icon } = config[status] || { 
      variant: 'default' as const, 
      label: status, 
      icon: null 
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
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <h1 className="text-3xl font-bold">내 신고 내역</h1>
            <p className="text-muted-foreground mt-2">
              총 {reports.length}건의 신고가 있습니다
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
                onValueChange={setFilterStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="모든 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="pending">접수 대기</SelectItem>
                  <SelectItem value="processing">처리중</SelectItem>
                  <SelectItem value="resolved">해결 완료</SelectItem>
                  <SelectItem value="rejected">반려</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterType}
                onValueChange={setFilterType}
              >
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
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
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
                        <span>발생일: {formatDate(report.incident_date)} {report.incident_time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>접수일: {formatRelativeTime(report.createdAt)}</span>
                      </div>
                      {report.fileNames && report.fileNames.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>첨부파일 {report.fileNames.length}개</span>
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
              <CardContent className="text-center py-16">
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