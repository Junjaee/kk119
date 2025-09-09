'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Send,
  Phone,
  Mail,
  Shield,
  AlertTriangle,
  Eye,
  Edit3
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { localDB, Report } from '@/lib/services/localDB';
import { cn } from '@/lib/utils/cn';

// Progress timeline component
const ProgressTimeline = ({ status, createdAt, updatedAt }: { 
  status: Report['status']; 
  createdAt: string; 
  updatedAt: string; 
}) => {
  const steps = [
    {
      key: 'pending',
      title: '신고 접수',
      description: '신고가 접수되었습니다',
      icon: <FileText className="h-5 w-5" />,
      date: createdAt
    },
    {
      key: 'processing',
      title: '검토 진행',
      description: '전문가가 검토하고 있습니다',
      icon: <Eye className="h-5 w-5" />,
      date: status === 'processing' || status === 'resolved' || status === 'rejected' ? updatedAt : null
    },
    {
      key: 'resolved',
      title: '해결 완료',
      description: '사건이 해결되었습니다',
      icon: <CheckCircle2 className="h-5 w-5" />,
      date: status === 'resolved' ? updatedAt : null
    }
  ];

  const getCurrentStepIndex = () => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'resolved': return 2;
      case 'rejected': return 1; // Show as stopped at processing
      default: return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg mb-4">처리 진행 상황</h3>
      
      {status === 'rejected' && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-700 dark:text-red-400">신고가 반려되었습니다</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300 mt-2">
            추가 정보나 증거가 필요하거나, 신고 내용을 재검토해야 할 수 있습니다.
          </p>
        </div>
      )}

      <div className="relative">
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex && status !== 'rejected';
          const isCompleted = index < currentStepIndex && status !== 'rejected';
          const isRejected = status === 'rejected' && index === 1;
          
          return (
            <div key={step.key} className="relative flex items-start pb-8 last:pb-0">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-6 top-12 w-0.5 h-16 transition-colors",
                    isCompleted ? "bg-green-500" : 
                    isRejected ? "bg-red-500" : 
                    "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
              
              {/* Step icon */}
              <div 
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                  isCompleted ? "bg-green-500 border-green-500 text-white" :
                  isRejected ? "bg-red-500 border-red-500 text-white" :
                  isActive ? "bg-primary border-primary text-white animate-pulse" :
                  "bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700"
                )}
              >
                {isRejected ? <XCircle className="h-5 w-5" /> : step.icon}
              </div>
              
              {/* Step content */}
              <div className="flex-1 ml-4">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-medium",
                    isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                    {isRejected && step.key === 'processing' && ' (반려)'}
                  </h4>
                  {step.date && (
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(step.date)}
                    </span>
                  )}
                </div>
                <p className={cn(
                  "text-sm mt-1",
                  isActive || isCompleted ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  {isRejected && step.key === 'processing' 
                    ? '신고 내용 검토 후 반려 처리되었습니다'
                    : step.description
                  }
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated time */}
      {status === 'pending' && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              예상 처리 시간: 1-3 영업일
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            전문가가 신고 내용을 검토한 후 빠르게 연락드리겠습니다.
          </p>
        </div>
      )}

      {status === 'processing' && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              현재 전문가가 검토 중입니다
            </span>
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            곧 처리 결과를 안내해드리겠습니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (params.id) {
      const reportData = localDB.getReportById(params.id as string);
      setReport(reportData);
      setLoading(false);
    }
  }, [params.id]);

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
        icon: <CheckCircle2 className="h-3 w-3" /> 
      },
      rejected: { 
        variant: 'error' as const, 
        label: '반려', 
        icon: <XCircle className="h-3 w-3" /> 
      },
    };
    
    const { variant, label, icon } = config[status];
    
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">신고를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-6">
            요청하신 신고 내역이 존재하지 않거나 삭제되었을 수 있습니다.
          </p>
          <Button onClick={() => router.push('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            신고 내역으로 돌아가기
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/reports')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{report.title}</h1>
              <div className="flex items-center space-x-3 mt-2">
                {getStatusBadge(report.status)}
                <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatRelativeTime(report.createdAt)} 접수
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              수정
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>신고 내용</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">발생 일시</span>
                    </div>
                    <p className="font-medium">
                      {formatDate(report.incident_date)} {report.incident_time}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">발생 장소</span>
                    </div>
                    <p className="font-medium">{report.location}</p>
                  </div>
                  
                  {report.witnesses && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">목격자</span>
                      </div>
                      <p className="font-medium">{report.witnesses}</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h4 className="font-semibold">상황 설명</h4>
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {report.content}
                    </p>
                  </div>
                </div>

                {/* Desired Action */}
                {report.desired_action && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">희망 조치사항</h4>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {report.desired_action}
                      </p>
                    </div>
                  </div>
                )}

                {/* Files */}
                {report.fileNames && report.fileNames.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">첨부 파일</h4>
                    <div className="space-y-2">
                      {report.fileNames.map((fileName, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">{fileName}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>소통 내역</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sample expert comment for demo */}
                {(report.status === 'processing' || report.status === 'resolved') && (
                  <div className="border-l-4 border-l-primary pl-4 py-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">김○○ 변호사</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(report.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.status === 'resolved' 
                        ? '신고 내용을 검토한 결과, 적절한 법적 조치를 통해 문제가 해결되었습니다. 추가 지원이 필요하시면 언제든 연락해 주세요.'
                        : '접수해주신 신고를 검토 중입니다. 관련 법적 절차와 대응 방안을 검토하여 빠른 시일 내에 연락드리겠습니다.'
                      }
                    </p>
                  </div>
                )}

                {/* Comment input */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="궁금한 점이나 추가 정보를 입력해주세요..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end">
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      메시지 전송
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Progress & Actions */}
          <div className="space-y-6">
            {/* Progress Timeline */}
            <Card>
              <CardContent className="pt-6">
                <ProgressTimeline 
                  status={report.status}
                  createdAt={report.createdAt}
                  updatedAt={report.updatedAt}
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">빠른 실행</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  긴급 상담 요청
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  이메일 문의
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  법률 자문 요청
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  추가 신고
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                  24시간 지원센터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">1588-0119</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">help@kk119.kr</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                    긴급한 상황이거나 추가 지원이 필요하시면 
                    언제든 연락해 주세요.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}