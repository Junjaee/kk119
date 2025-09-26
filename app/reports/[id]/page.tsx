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
  Edit3,
  Trash2,
  FileDown,
  ExternalLink,
  Star,
  User
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { localDB, Report } from '@/lib/services/localDB';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

// Lawyer Consultation Components
import { LawyerProfile } from '@/components/lawyer-consultation/LawyerProfile';
import { ConsultationProgress } from '@/components/lawyer-consultation/ConsultationProgress';
import { LawyerResponse } from '@/components/lawyer-consultation/LawyerResponse';
import { AdditionalInquiry } from '@/components/lawyer-consultation/AdditionalInquiry';
import { ConsultationTimeline } from '@/components/lawyer-consultation/ConsultationTimeline';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lawyer consultation states
  const [consultationData, setConsultationData] = useState<any>(null);
  const [loadingConsultation, setLoadingConsultation] = useState(false);

  useEffect(() => {
    if (params.id) {
      const reportData = localDB.getReportById(params.id as string);
      setReport(reportData);
      setLoading(false);

      // Load lawyer consultation data if report requires legal consultation
      if (reportData && reportData.requires_legal_consultation) {
        loadConsultationData(params.id as string);
      }
    }
  }, [params.id]);

  const loadConsultationData = async (reportId: string) => {
    setLoadingConsultation(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/consultation`);
      if (response.ok) {
        const data = await response.json();
        setConsultationData(data);
      }
    } catch (error) {
      console.error('Failed to load consultation data:', error);
    } finally {
      setLoadingConsultation(false);
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    const config = {
      pending: {
        variant: 'warning' as const,
        label: '접수 대기',
        icon: <Clock className="h-4 w-4" />,
        bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-950/30',
        textColor: 'text-amber-800 dark:text-amber-200',
        borderColor: 'border-amber-300 dark:border-amber-700'
      },
      processing: {
        variant: 'protection' as const,
        label: '처리 중',
        icon: <AlertCircle className="h-4 w-4" />,
        bgColor: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30',
        textColor: 'text-blue-800 dark:text-blue-200',
        borderColor: 'border-blue-300 dark:border-blue-700'
      },
      resolved: {
        variant: 'success' as const,
        label: '해결 완료',
        icon: <CheckCircle2 className="h-4 w-4" />,
        bgColor: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30',
        textColor: 'text-green-800 dark:text-green-200',
        borderColor: 'border-green-300 dark:border-green-700'
      },
      rejected: {
        variant: 'error' as const,
        label: '반려',
        icon: <XCircle className="h-4 w-4" />,
        bgColor: 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-950/30 dark:to-pink-950/30',
        textColor: 'text-red-800 dark:text-red-200',
        borderColor: 'border-red-300 dark:border-red-700'
      },
    };

    const { variant, label, icon, bgColor, textColor, borderColor } = config[status];

    return (
      <div className={cn(
        'inline-flex items-center space-x-2 px-4 py-2 rounded-full border-2 font-semibold text-sm shadow-sm',
        bgColor,
        textColor,
        borderColor
      )}>
        {icon}
        <span>{label}</span>
      </div>
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

  const handleDelete = async () => {
    if (!report) return;

    setIsDeleting(true);

    try {
      // Delete from local database
      const success = localDB.deleteReport(report.id);

      if (success) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setShowDeleteModal(false);
        toast.success('신고가 성공적으로 삭제되었습니다');
        router.push('/reports');
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('신고 삭제 중 오류가 발생했습니다');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdditionalInquiry = async (question: string, files: File[]) => {
    if (!report) return;

    // Mock implementation - in real app, this would submit to API
    console.log('Submitting additional inquiry:', { question, files });

    // For demo, we'll show a success message
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  // Mock data for demonstration
  const mockLawyerInfo = {
    id: 'lawyer-001',
    name: '김철수',
    email: 'kim@lawfirm.com',
    specialization: ['학교폭력', '명예훼손', '성희롱'],
    law_firm: '법무법인 정의',
    experience_years: 15,
    rating: 4.8,
    cases_handled: 150,
    bio: '15년간 학교폭력 및 교육법 전문 변호사로 활동하며 다수의 성공적인 사건을 해결한 경험이 있습니다.'
  };

  const mockAssignmentInfo = {
    assigned_at: '2024-09-25T10:00:00Z',
    assigned_by: {
      id: 'admin-001',
      name: '관리자',
      email: 'admin@example.com'
    },
    consultation_priority: 'high' as const,
    consultation_notes: '학교폭력 사안으로 신속한 대응이 필요합니다.'
  };

  const mockConsultationResponse = {
    id: 'response-001',
    consultation_content: '접수해주신 학교폭력 사건을 검토한 결과, 다음과 같은 법적 대응이 가능합니다.\n\n첫째, 학교폭력예방 및 대책에 관한 법률에 따라 학교폭력대책자치위원회 개최를 요청할 수 있습니다.\n둘째, 피해 학생에 대한 보호조치와 가해 학생에 대한 선도조치를 요구할 수 있습니다.\n셋째, 민사상 손해배상 청구도 검토해볼 수 있습니다.',
    recommended_actions: '1. 학교에 학교폭력대책자치위원회 개최 요청서 제출\n2. 피해 증거 수집 (진단서, 상담기록, 목격자 진술서 등)\n3. 교육청에 신고 접수\n4. 필요시 민사소송 준비',
    legal_references: [
      '학교폭력예방 및 대책에 관한 법률 제17조 (학교폭력대책자치위원회의 구성·운영)',
      '학교폭력예방 및 대책에 관한 법률 제16조 (피해학생의 보호)',
      '민법 제750조 (불법행위의 내용)'
    ],
    consultation_type: 'initial' as const,
    priority_level: 3,
    estimated_duration: 2,
    actual_duration: 1.5,
    created_at: '2024-09-25T14:30:00Z',
    updated_at: '2024-09-25T14:30:00Z'
  };

  const mockTimelineEvents = [
    {
      id: 'event-1',
      type: 'report_created' as const,
      timestamp: '2024-09-25T09:00:00Z',
      actor: { id: 'user-001', name: '김학부모', email: 'parent@example.com', role: 'reporter' as const },
      title: '신고 접수',
      description: '학교폭력 신고가 접수되었습니다.',
      details: report.content
    },
    {
      id: 'event-2',
      type: 'lawyer_assigned' as const,
      timestamp: '2024-09-25T10:00:00Z',
      actor: { id: 'admin-001', name: '관리자', email: 'admin@example.com', role: 'admin' as const },
      title: '변호사 배정',
      description: '김철수 변호사가 배정되었습니다.',
      details: '학교폭력 전문 변호사로 신속한 대응을 위해 배정되었습니다.'
    },
    {
      id: 'event-3',
      type: 'consultation_started' as const,
      timestamp: '2024-09-25T11:00:00Z',
      actor: { id: 'lawyer-001', name: '김철수', email: 'kim@lawfirm.com', role: 'lawyer' as const },
      title: '상담 시작',
      description: '변호사가 사건 검토를 시작했습니다.',
    },
    {
      id: 'event-4',
      type: 'lawyer_response' as const,
      timestamp: '2024-09-25T14:30:00Z',
      actor: { id: 'lawyer-001', name: '김철수', email: 'kim@lawfirm.com', role: 'lawyer' as const },
      title: '변호사 답변',
      description: '법적 검토 의견과 권장 조치사항을 제공했습니다.',
      details: mockConsultationResponse.consultation_content
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Enhanced Header Section */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="flex items-start space-x-6">
                <Button
                  variant="outline"
                  onClick={() => router.push('/reports')}
                  className="flex items-center hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  목록으로
                </Button>

                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusBadge(report.status)}
                    <Badge variant="outline" className="bg-white/50">{getTypeLabel(report.type)}</Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 word-break-keep-all leading-tight">
                    {report.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatRelativeTime(report.createdAt)} 접수</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>신고번호: #{report.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => router.push(`/reports/new?edit=${report.id}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  수정
                </Button>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  size="sm"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF 내보내기
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Main Content - Full Width */}
          <div className="space-y-8">
            {/* Enhanced Report Details Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-900 dark:text-gray-100">신고 상세 내용</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                {/* Enhanced Basic Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-900">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">발생 일시</span>
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100 word-break-keep-all">
                      {formatDate(report.incident_date)} {report.incident_time}
                    </p>
                  </div>

                  <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-6 border border-green-100 dark:border-green-900">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-semibold text-green-800 dark:text-green-200">발생 장소</span>
                    </div>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100 word-break-keep-all">
                      {report.location}
                    </p>
                  </div>

                  {report.witnesses && (
                    <div className="lg:col-span-2 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-6 border border-purple-100 dark:border-purple-900">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-semibold text-purple-800 dark:text-purple-200">목격자</span>
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100 word-break-keep-all">
                        {report.witnesses}
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced Content Section */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span>상황 설명</span>
                  </h4>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200 word-break-keep-all line-height-1-6">
                      {report.content}
                    </p>
                  </div>
                </div>

                {/* Enhanced Desired Action */}
                {report.desired_action && (
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                      <Star className="h-5 w-5 text-amber-600" />
                      <span>희망 조치사항</span>
                    </h4>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-6 shadow-sm">
                      <p className="text-base leading-relaxed whitespace-pre-wrap text-amber-900 dark:text-amber-100 word-break-keep-all line-height-1-6">
                        {report.desired_action}
                      </p>
                    </div>
                  </div>
                )}

                {/* Enhanced Files Section */}
                {report.fileNames && report.fileNames.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span>첨부 파일</span>
                      <Badge variant="outline" className="ml-2">{report.fileNames.length}개</Badge>
                    </h4>
                    <div className="grid gap-3">
                      {report.fileNames.map((fileName, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100 word-break-keep-all">{fileName}</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">증거 자료</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            다운로드
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lawyer Consultation Section - NEW */}
            {report.requires_legal_consultation && (
              <div className="space-y-8">
                {/* Lawyer Profile */}
                <LawyerProfile
                  lawyer={mockLawyerInfo}
                  assignment={mockAssignmentInfo}
                  showContactInfo={true}
                />

                {/* Consultation Progress */}
                <ConsultationProgress
                  status="in_progress"
                  assignedAt={mockAssignmentInfo.assigned_at}
                  startedAt="2024-09-25T11:00:00Z"
                  priority={mockAssignmentInfo.consultation_priority}
                  estimatedDuration={2}
                  showTimeline={true}
                />

                {/* Lawyer Response */}
                <LawyerResponse
                  response={mockConsultationResponse}
                  lawyer={mockLawyerInfo}
                  canRate={true}
                  currentRating={0}
                  onRate={(rating) => {
                    console.log('Rating submitted:', rating);
                    toast.success('평가가 제출되었습니다.');
                  }}
                />

                {/* Additional Inquiry */}
                <AdditionalInquiry
                  reportId={report.id}
                  onSubmit={handleAdditionalInquiry}
                  previousInquiries={[]}
                />

                {/* Consultation Timeline */}
                <ConsultationTimeline
                  reportId={report.id}
                  events={mockTimelineEvents}
                />
              </div>
            )}

            {/* Enhanced Communication Section */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-900 dark:text-gray-100">일반 소통 내역</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                {/* Sample expert comment for demo */}
                {(report.status === 'processing' || report.status === 'resolved') && !report.requires_legal_consultation && (
                  <div className="border-l-4 border-l-primary pl-4 py-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">담당자</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(report.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.status === 'resolved'
                        ? '신고 내용을 검토한 결과, 적절한 조치를 통해 문제가 해결되었습니다. 추가 지원이 필요하시면 언제든 연락해 주세요.'
                        : '접수해주신 신고를 검토 중입니다. 관련 절차와 대응 방안을 검토하여 빠른 시일 내에 연락드리겠습니다.'
                      }
                    </p>
                  </div>
                )}

                {/* Comment input for non-legal consultation reports */}
                {!report.requires_legal_consultation && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="궁금한 점이나 추가 정보를 입력해주세요..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        메시지 전송
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-auto shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  신고 삭제
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  이 작업은 되돌릴 수 없습니다
                </p>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              정말로 이 신고를 삭제하시겠습니까?<br />
              <span className="font-medium">"{report.title}"</span>
            </p>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                취소
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    삭제 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}