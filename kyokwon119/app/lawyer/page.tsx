'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Briefcase, 
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Eye,
  Send,
  ChevronRight
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useStore } from '@/lib/store';
import { switchUser } from '@/lib/auth/mock-auth';
import toast from 'react-hot-toast';

// Mock data for lawyer dashboard
const newReports = [
  {
    id: '5',
    title: '학부모 집단 민원',
    type: 'parent',
    content: '학부모 여러 명이 집단으로 민원을 제기하고 있습니다. 수업 방식과 평가 기준에 대한 부당한 요구를 하고 있으며...',
    incident_date: '2025-08-27',
    created_at: '2025-08-28T09:00:00Z',
    urgency: 'high',
    status: 'received'
  },
  {
    id: '6',
    title: 'SNS 명예훼손 건',
    type: 'defamation',
    content: '학부모가 SNS에 허위사실을 유포하고 있습니다. 스크린샷 증거 보유...',
    incident_date: '2025-08-26',
    created_at: '2025-08-27T14:30:00Z',
    urgency: 'medium',
    status: 'received'
  },
  {
    id: '7',
    title: '수업 중 폭행 위협',
    type: 'student',
    content: '학생이 수업 중 폭행을 위협했습니다. CCTV 영상 있음...',
    incident_date: '2025-08-27',
    created_at: '2025-08-27T16:00:00Z',
    urgency: 'high',
    status: 'received'
  }
];

const myConsults = [
  {
    id: '1',
    report_title: '학부모 민원 관련 건',
    status: 'consulting',
    last_updated: '2025-08-27T15:00:00Z',
    response_count: 2
  },
  {
    id: '2',
    report_title: '학생 폭언 사건',
    status: 'completed',
    last_updated: '2025-08-26T10:00:00Z',
    response_count: 3
  }
];

const statistics = {
  total_handled: 47,
  this_month: 12,
  average_response_time: '18시간',
  satisfaction_rate: 4.8
};

export default function LawyerDashboard() {
  const { user, setUser } = useStore();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [consultContent, setConsultContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Switch to lawyer user for testing
  if (user?.role !== 'lawyer') {
    const lawyerUser = switchUser('lawyer');
    setUser(lawyerUser);
  }

  const handleSelectCase = async (reportId: string) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('사건을 담당하게 되었습니다');
      setSelectedReport(reportId);
    } catch (error) {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitConsult = async () => {
    if (!consultContent.trim()) {
      toast.error('답변 내용을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('답변이 성공적으로 등록되었습니다');
      setConsultContent('');
      setSelectedReport(null);
    } catch (error) {
      toast.error('답변 등록 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const config = {
      high: { variant: 'error' as const, label: '긴급' },
      medium: { variant: 'warning' as const, label: '보통' },
      low: { variant: 'default' as const, label: '일반' }
    };
    
    const { variant, label } = config[urgency as keyof typeof config] || 
      { variant: 'default' as const, label: urgency };
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">변호사 대시보드</h1>
          <p className="text-muted-foreground mt-2">
            교권 침해 사건에 대한 법률 자문을 제공하세요
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 처리</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_handled}</div>
              <p className="text-xs text-muted-foreground">
                총 상담 건수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이번 달</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.this_month}</div>
              <p className="text-xs text-muted-foreground">
                +20% 증가
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">응답 시간</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.average_response_time}</div>
              <p className="text-xs text-muted-foreground">
                평균 응답 시간
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">만족도</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.satisfaction_rate}/5.0</div>
              <p className="text-xs text-muted-foreground">
                교사 만족도
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* New Reports */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                새로운 신고
                <Badge variant="error">{newReports.length}</Badge>
              </CardTitle>
              <CardDescription>
                담당할 사건을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {newReports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{report.title}</h4>
                      {getUrgencyBadge(report.urgency)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(report.incident_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(report.created_at)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelectCase(report.id)}
                        disabled={isSubmitting || selectedReport === report.id}
                      >
                        {selectedReport === report.id ? '담당중' : '담당하기'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {newReports.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  새로운 신고가 없습니다
                </p>
              )}
            </CardContent>
          </Card>

          {/* My Consults */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                담당 사건
                <Badge>{myConsults.length}</Badge>
              </CardTitle>
              <CardDescription>
                진행 중인 상담 목록
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myConsults.map((consult) => (
                <div key={consult.id} className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{consult.report_title}</h4>
                      <Badge variant={consult.status === 'completed' ? 'success' : 'warning'}>
                        {consult.status === 'completed' ? '완료' : '진행중'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        답변 {consult.response_count}개
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(consult.last_updated)}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        상세보기
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {myConsults.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  담당 중인 사건이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Reply Section */}
        {selectedReport && (
          <Card>
            <CardHeader>
              <CardTitle>빠른 답변 작성</CardTitle>
              <CardDescription>
                선택한 사건에 대한 법률 자문을 작성하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="법률 자문 내용을 작성하세요..."
                value={consultContent}
                onChange={(e) => setConsultContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedReport(null);
                    setConsultContent('');
                  }}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmitConsult}
                  disabled={isSubmitting || !consultContent.trim()}
                >
                  {isSubmitting ? '제출 중...' : '답변 등록'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">답변 작성 가이드</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>법적 근거를 명확히 제시해주세요 (관련 법조항 포함)</li>
                  <li>구체적이고 실행 가능한 조치사항을 안내해주세요</li>
                  <li>추가 증거 수집이 필요한 경우 명시해주세요</li>
                  <li>긴급한 사안의 경우 우선적으로 처리해주세요</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}