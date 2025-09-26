'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Share2,
  Search,
  Filter,
  Building2,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  Shield,
  Eye,
  TrendingUp,
  BarChart3,
  User,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';
import { AuthGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAssociations } from '@/lib/hooks/useAssociations';

interface SharedReport {
  id: string;
  originalReportId: string;
  title: string;
  content: string;
  category: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sharedByUserId: string;
  sharedByUserName: string;
  associationId: string;
  associationName: string;
  shareMessage?: string;
  shareType: 'association' | 'similar_cases' | 'lawyer_consult';
  anonymized: boolean;
  viewCount: number;
  discussionCount: number;
  supportCount: number;
  tags: string[];
  sharedAt: string;
  lastActivity: string;
}

const shareTypeLabels = {
  association: '협회 공유',
  similar_cases: '유사 사례',
  lawyer_consult: '변호사 상담'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export default function SharedReportsPage() {
  const { profile } = useAuth();
  const { associations, userMemberships, loading: associationsLoading } = useAssociations(profile?.id);

  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssociation, setSelectedAssociation] = useState<string>('all');
  const [selectedShareType, setSelectedShareType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('latest'); // latest, popular, discussed

  // Mock data for shared reports
  useEffect(() => {
    const mockSharedReports: SharedReport[] = [
      {
        id: 'shared_1',
        originalReportId: 'report_123',
        title: '학교 내 괴롭힘 사건에 대한 집단 대응 요청',
        content: '동료 교사로부터 지속적인 괴롭힘을 당하고 있어 같은 경험을 한 동료들과 함께 대응하고자 합니다.',
        category: 'harassment',
        status: 'processing',
        priority: 'high',
        sharedByUserId: 'teacher1',
        sharedByUserName: '김선생',
        associationId: 'assoc1',
        associationName: '서울교사협회',
        shareMessage: '유사한 경험이 있는 동료 선생님들의 조언이 필요합니다.',
        shareType: 'association',
        anonymized: false,
        viewCount: 24,
        discussionCount: 7,
        supportCount: 12,
        tags: ['괴롭힘', '집단대응', '법적조치'],
        sharedAt: new Date(Date.now() - 86400000).toISOString(),
        lastActivity: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'shared_2',
        originalReportId: 'report_456',
        title: '학부모 민원 대응 사례',
        content: '부당한 학부모 민원에 대한 대응 방법과 절차를 공유합니다.',
        category: 'parent',
        status: 'resolved',
        priority: 'medium',
        sharedByUserId: 'teacher2',
        sharedByUserName: '익명',
        associationId: 'assoc1',
        associationName: '서울교사협회',
        shareType: 'similar_cases',
        anonymized: true,
        viewCount: 156,
        discussionCount: 23,
        supportCount: 45,
        tags: ['학부모민원', '대응절차', '성공사례'],
        sharedAt: new Date(Date.now() - 172800000).toISOString(),
        lastActivity: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'shared_3',
        originalReportId: 'report_789',
        title: '교육공무원법 위반 신고 경험 공유',
        content: '상급자의 부당 지시에 대한 신고 과정과 결과를 공유하여 다른 교사들에게 도움이 되고자 합니다.',
        category: 'employment',
        status: 'resolved',
        priority: 'high',
        sharedByUserId: 'teacher3',
        sharedByUserName: '이선생',
        associationId: 'assoc2',
        associationName: '경기교사협회',
        shareMessage: '법적 절차를 거쳐 성공적으로 해결되었습니다. 비슷한 상황의 동료들께 도움이 되길 바랍니다.',
        shareType: 'association',
        anonymized: false,
        viewCount: 89,
        discussionCount: 15,
        supportCount: 34,
        tags: ['교육공무원법', '부당지시', '성공사례'],
        sharedAt: new Date(Date.now() - 259200000).toISOString(),
        lastActivity: new Date(Date.now() - 14400000).toISOString(),
      }
    ];

    setSharedReports(mockSharedReports);
    setLoading(false);
  }, []);

  // Filter reports
  const filteredReports = sharedReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAssociation = selectedAssociation === 'all' || report.associationId === selectedAssociation;
    const matchesShareType = selectedShareType === 'all' || report.shareType === selectedShareType;
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;

    return matchesSearch && matchesAssociation && matchesShareType && matchesStatus;
  });

  // Sort reports
  const sortedReports = filteredReports.sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.viewCount - a.viewCount;
      case 'discussed':
        return b.discussionCount - a.discussionCount;
      case 'supported':
        return b.supportCount - a.supportCount;
      default: // latest
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    }
  });

  const approvedMemberships = userMemberships.filter(membership => membership.approved_at);

  if (loading || associationsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Share2 className="h-8 w-8" />
                공유된 신고서
              </h1>
              <p className="text-muted-foreground mt-2">
                협회 구성원들과 공유된 신고서를 통해 집단 대응을 준비하세요
              </p>
            </div>
            <Link href="/reports">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                내 신고서
              </Button>
            </Link>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  <span className="ml-2 text-sm font-medium">총 공유 건수</span>
                </div>
                <div className="text-2xl font-bold">{sharedReports.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 text-green-600" />
                  <span className="ml-2 text-sm font-medium">총 조회수</span>
                </div>
                <div className="text-2xl font-bold">
                  {sharedReports.reduce((sum, report) => sum + report.viewCount, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span className="ml-2 text-sm font-medium">활발한 토론</span>
                </div>
                <div className="text-2xl font-bold">
                  {sharedReports.reduce((sum, report) => sum + report.discussionCount, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="ml-2 text-sm font-medium">해결된 사례</span>
                </div>
                <div className="text-2xl font-bold">
                  {sharedReports.filter(r => r.status === 'resolved').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="신고서 제목, 내용, 태그로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter Options */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {approvedMemberships.length > 0 && (
                    <Select value={selectedAssociation} onValueChange={setSelectedAssociation}>
                      <SelectTrigger>
                        <SelectValue placeholder="협회 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">모든 협회</SelectItem>
                        {approvedMemberships.map(membership => {
                          const association = associations.find(a => a.id === membership.association_id);
                          return association ? (
                            <SelectItem key={association.id} value={association.id}>
                              {association.name}
                            </SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={selectedShareType} onValueChange={setSelectedShareType}>
                    <SelectTrigger>
                      <SelectValue placeholder="공유 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 유형</SelectItem>
                      <SelectItem value="association">협회 공유</SelectItem>
                      <SelectItem value="similar_cases">유사 사례</SelectItem>
                      <SelectItem value="lawyer_consult">변호사 상담</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="처리 상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 상태</SelectItem>
                      <SelectItem value="pending">대기중</SelectItem>
                      <SelectItem value="processing">처리중</SelectItem>
                      <SelectItem value="resolved">해결됨</SelectItem>
                      <SelectItem value="rejected">반려됨</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="정렬" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">최근 활동순</SelectItem>
                      <SelectItem value="popular">인기순</SelectItem>
                      <SelectItem value="discussed">토론순</SelectItem>
                      <SelectItem value="supported">지지순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-6">
            {sortedReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="px-8 pt-6 pb-8">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold hover:text-primary">
                            <Link href={`/shared-reports/${report.id}`}>
                              {report.title}
                            </Link>
                          </h3>
                          <Badge className={priorityColors[report.priority]}>
                            {report.priority}
                          </Badge>
                          {report.anonymized && (
                            <Badge variant="secondary">
                              <Shield className="h-3 w-3 mr-1" />
                              익명
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{report.anonymized ? '익명' : report.sharedByUserName}</span>
                          </div>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{report.associationName}</span>
                          </div>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatRelativeTime(report.sharedAt)}</span>
                          </div>
                          <span>·</span>
                          <Badge variant="outline" className="text-xs">
                            {shareTypeLabels[report.shareType]}
                          </Badge>
                        </div>
                      </div>

                      <Badge className={statusColors[report.status]}>
                        {report.status}
                      </Badge>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.content}
                    </p>

                    {/* Share Message */}
                    {report.shareMessage && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <span className="font-medium">공유 메시지:</span> {report.shareMessage}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {report.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {report.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{report.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{report.discussionCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{report.supportCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>최근 {formatRelativeTime(report.lastActivity)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/shared-reports/${report.id}`}>
                          <Button variant="ghost" size="sm">
                            자세히 보기
                          </Button>
                        </Link>
                        <Link href={`/reports/${report.originalReportId}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            원본 보기
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {sortedReports.length === 0 && (
              <Card>
                <CardContent className="text-center py-16">
                  <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">공유된 신고서가 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || selectedAssociation !== 'all' || selectedShareType !== 'all'
                      ? '검색 조건에 맞는 공유 신고서가 없습니다.'
                      : '아직 협회에서 공유된 신고서가 없습니다.'}
                  </p>
                  <Link href="/reports">
                    <Button>
                      <FileText className="h-4 w-4 mr-2" />
                      내 신고서 보기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}