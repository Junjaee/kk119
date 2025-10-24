'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LawyerSelectionModal } from '@/components/admin/lawyer-selection-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Scale,
  User,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface Report {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  incident_date: string;
  incident_time?: string;
  created_at: string;
  user_name: string;
  requires_legal_consultation: boolean;
  file_count?: number;
}

interface Lawyer {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  law_firm: string;
  is_verified: boolean;
  current_cases: number;
  max_cases: number;
  average_response_time: string;
  satisfaction_rating: number;
  years_experience: number;
  bio?: string;
}

export default function AssignLawyerPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [availableLawyers, setAvailableLawyers] = useState<Lawyer[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [priority, setPriority] = useState('3');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [showLawyerModal, setShowLawyerModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load report and available lawyers
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API calls
        // const [reportResponse, lawyersResponse] = await Promise.all([
        //   fetch(`/api/admin/reports/${reportId}`),
        //   fetch(`/api/reports/${reportId}/assign-lawyer`)
        // ]);

        // Mock data for now
        const mockReport: Report = {
          id: reportId,
          title: '학부모 욕설 및 협박',
          content: '학부모가 전화로 심한 욕설을 하며 교사 개인에 대한 협박을 했습니다. 녹취록이 있으며, 학교 관리자도 상황을 인지하고 있습니다.',
          type: 'threat',
          status: 'investigating',
          incident_date: '2024-09-25',
          incident_time: '14:30',
          created_at: '2024-09-25T06:30:00Z',
          user_name: '익명교사123',
          requires_legal_consultation: true,
          file_count: 2
        };

        const mockLawyers: Lawyer[] = [
          {
            id: 'lawyer-1',
            name: '김민수 변호사',
            email: 'kim@lawfirm.co.kr',
            specialization: ['교육법', '민사소송', '손해배상'],
            law_firm: '한국교육법률사무소',
            is_verified: true,
            current_cases: 12,
            max_cases: 20,
            average_response_time: '18시간',
            satisfaction_rating: 4.8,
            years_experience: 8,
            bio: '교육법 전문 변호사로 8년간 교권 침해 사건 120여 건을 담당했습니다. 특히 학부모 민원 및 협박 사건 경험이 풍부합니다.'
          },
          {
            id: 'lawyer-2',
            name: '이지영 변호사',
            email: 'lee@education-law.kr',
            specialization: ['형사법', '협박죄', '모독죄'],
            law_firm: '교권보호법률센터',
            is_verified: true,
            current_cases: 8,
            max_cases: 15,
            average_response_time: '12시간',
            satisfaction_rating: 4.9,
            years_experience: 12,
            bio: '형사법 전문으로 교사 대상 협박, 모독 사건을 전문적으로 다룹니다. 신속한 대응과 높은 승소율로 유명합니다.'
          },
          {
            id: 'lawyer-3',
            name: '박철민 변호사',
            email: 'park@legal-support.co.kr',
            specialization: ['민사소송', '정신적 피해', '위자료'],
            law_firm: '교사권익보호센터',
            is_verified: true,
            current_cases: 15,
            max_cases: 18,
            average_response_time: '24시간',
            satisfaction_rating: 4.6,
            years_experience: 6,
            bio: '교사의 정신적 피해 배상 사건을 전문으로 하며, 실질적인 피해 회복에 중점을 둡니다.'
          },
          {
            id: 'lawyer-4',
            name: '정수민 변호사',
            email: 'jung@teacher-rights.kr',
            specialization: ['교육법', '학교폭력', '아동복지법'],
            law_firm: '새로운교육법률사무소',
            is_verified: true,
            current_cases: 5,
            max_cases: 12,
            average_response_time: '8시간',
            satisfaction_rating: 5.0,
            years_experience: 4,
            bio: '젊은 감각으로 교육 현장의 새로운 법적 이슈들을 전문적으로 다룹니다. 빠른 상담과 체계적인 사건 관리가 특징입니다.'
          }
        ];

        setReport(mockReport);
        setAvailableLawyers(mockLawyers);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      loadData();
    }
  }, [reportId]);

  const handleAssignLawyer = async () => {
    if (!selectedLawyer || !report) return;

    try {
      setAssigning(true);

      const requestBody = {
        lawyer_id: selectedLawyer.id,
        consultation_priority: parseInt(priority),
        consultation_notes: notes,
        requires_legal_consultation: true
      };

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/reports/${reportId}/assign-lawyer`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(requestBody),
      // });

      // Mock success response
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`${selectedLawyer.name} 변호사가 성공적으로 배정되었습니다.`);

      router.push('/admin/reports');
    } catch (error) {
      console.error('Error assigning lawyer:', error);
      toast.error('변호사 배정 중 오류가 발생했습니다.');
    } finally {
      setAssigning(false);
    }
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

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      '1': '긴급',
      '2': '높음',
      '3': '보통',
      '4': '낮음',
      '5': '매우낮음'
    };
    return labels[priority] || '보통';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      '1': 'text-red-600',
      '2': 'text-orange-600',
      '3': 'text-blue-600',
      '4': 'text-gray-600',
      '5': 'text-gray-400'
    };
    return colors[priority] || 'text-blue-600';
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

  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">오류 발생</h2>
              <p className="text-muted-foreground mb-4">
                {error || '신고를 찾을 수 없습니다.'}
              </p>
              <Link href="/admin/reports">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  신고 관리로 돌아가기
                </Button>
              </Link>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/reports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                신고 관리
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">변호사 배정</h1>
              <p className="text-muted-foreground mt-2">
                신고 건에 적절한 변호사를 배정합니다
              </p>
            </div>
          </div>
        </div>

        {/* Report Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              신고 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{report.content}</p>
              </div>
              <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">신고자</p>
                  <p className="text-sm text-muted-foreground">{report.user_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">발생일시</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(report.incident_date)} {report.incident_time}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">접수일</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(report.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {report.file_count && report.file_count > 0 && (
              <div className="flex items-center space-x-2 pt-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  첨부파일 {report.file_count}개
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lawyer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              변호사 선택
            </CardTitle>
            <CardDescription>
              사건 유형에 적합한 전문 변호사를 선택해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedLawyer ? (
              <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold">{selectedLawyer.name}</h4>
                    <Badge variant="secondary">{selectedLawyer.law_firm}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedLawyer.specialization.map((spec) => (
                      <Badge key={spec} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-2 md:grid-cols-3 text-sm text-muted-foreground">
                    <div>경력: {selectedLawyer.years_experience}년</div>
                    <div>현재 담당: {selectedLawyer.current_cases}/{selectedLawyer.max_cases}건</div>
                    <div>평점: ⭐ {selectedLawyer.satisfaction_rating}/5.0</div>
                    <div>응답시간: {selectedLawyer.average_response_time}</div>
                  </div>
                  {selectedLawyer.bio && (
                    <p className="mt-3 text-sm text-muted-foreground">{selectedLawyer.bio}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLawyerModal(true)}
                >
                  변경
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">변호사를 선택해주세요</h3>
                <p className="text-muted-foreground mb-4">
                  사건 유형과 변호사의 전문 분야를 고려하여 선택하세요
                </p>
                <Button onClick={() => setShowLawyerModal(true)}>
                  <Scale className="h-4 w-4 mr-2" />
                  변호사 선택
                </Button>
              </div>
            )}

            {/* Assignment Configuration */}
            {selectedLawyer && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">상담 우선순위</label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <span className="text-red-600">1 - 긴급</span>
                        </SelectItem>
                        <SelectItem value="2">
                          <span className="text-orange-600">2 - 높음</span>
                        </SelectItem>
                        <SelectItem value="3">
                          <span className="text-blue-600">3 - 보통</span>
                        </SelectItem>
                        <SelectItem value="4">
                          <span className="text-gray-600">4 - 낮음</span>
                        </SelectItem>
                        <SelectItem value="5">
                          <span className="text-gray-400">5 - 매우낮음</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      선택된 우선순위: <span className={getPriorityColor(priority)}>{getPriorityLabel(priority)}</span>
                    </label>
                    <div className="text-sm text-muted-foreground pt-2">
                      우선순위에 따라 변호사의 응답 순서가 결정됩니다
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">배정 참고사항</label>
                  <Textarea
                    placeholder="변호사에게 전달할 특별한 참고사항이 있다면 입력해주세요..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link href="/admin/reports">
            <Button variant="outline">취소</Button>
          </Link>
          <Button
            onClick={handleAssignLawyer}
            disabled={!selectedLawyer || assigning}
          >
            {assigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                배정 중...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                변호사 배정
              </>
            )}
          </Button>
        </div>

        {/* Lawyer Selection Modal */}
        <LawyerSelectionModal
          isOpen={showLawyerModal}
          onClose={() => setShowLawyerModal(false)}
          lawyers={availableLawyers}
          onSelectLawyer={setSelectedLawyer}
          reportType={report.type}
        />
      </div>
    </DashboardLayout>
  );
}