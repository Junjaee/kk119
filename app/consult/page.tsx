'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  User,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';

// Demo mode toggle - true로 설정하면 Mock 데이터 사용
const USE_MOCK_DATA = true;

// Mock data for demonstration
const mockConsults = [
  {
    id: '1',
    report_id: '1',
    report_title: '학부모 민원 관련 건',
    report_type: 'parent',
    report_status: 'consulting',
    incident_date: '2025-08-25',
    report_content: '학부모가 수업 방식에 대해 과도한 민원을 제기하며 협박성 발언을 했습니다. 녹음 파일이 있으며, 증인도 있는 상황입니다.',
    lawyer: {
      id: 'lawyer-1',
      name: '김변호사',
      specialty: '교육법 전문'
    },
    consult_content: `안녕하세요, 교육법 전문 김변호사입니다.

먼저 선생님께서 겪으신 일에 대해 안타깝게 생각합니다. 제출해주신 내용을 검토한 결과, 다음과 같은 법적 대응이 가능합니다.

1. **형사적 대응**
   - 협박죄 (형법 제283조): 협박성 발언이 해악을 고지하는 수준이라면 협박죄 성립 가능
   - 모욕죄 (형법 제311조): 공연히 모욕적 발언을 한 경우 해당
   - 업무방해죄 (형법 제314조): 정당한 교육활동을 방해한 경우

2. **민사적 대응**
   - 정신적 손해배상청구: 정신적 고통에 대한 위자료 청구 가능
   - 가처분 신청: 추가적인 괴롭힘 방지를 위한 접근금지가처분

3. **교육청 차원의 대응**
   - 교육활동 침해 행위로 신고
   - 학교교권보호위원회 개최 요청

녹음 파일과 증인이 있다는 점은 매우 유리한 증거입니다. 다만, 녹음의 경우 대화 당사자가 녹음한 것이어야 합니다.

추가적인 법적 조치를 원하시면 상세한 상담을 진행하겠습니다.`,
    created_at: '2025-08-27T15:00:00Z',
    status: 'answered'
  },
  {
    id: '2',
    report_id: '2',
    report_title: '학생 폭언 사건',
    report_type: 'student',
    report_status: 'completed',
    incident_date: '2025-08-24',
    report_content: '수업 중 학생이 교사에게 욕설과 함께 위협적인 행동을 보였습니다.',
    lawyer: {
      id: 'lawyer-2',
      name: '이변호사',
      specialty: '학교폭력 전문'
    },
    consult_content: `학생의 폭언과 위협적 행동에 대해서는 다음과 같이 대응하실 수 있습니다.

1. **학교 내 조치**
   - 학생생활지도위원회 개최
   - 선도위원회 징계 요청
   - 학부모 면담 및 서면 경고

2. **법적 조치**
   - 미성년자라도 형사책임능력이 있는 경우 (만 14세 이상) 고소 가능
   - 학부모에 대한 손해배상청구 (민법 제755조)

상황의 심각성을 고려하여 단계적으로 대응하시기를 권합니다.`,
    created_at: '2025-08-26T10:00:00Z',
    status: 'answered'
  }
];

export default function ConsultPage() {
  const { user } = useStore();
  const [consults, setConsults] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, answered: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedConsult, setExpandedConsult] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchConsults();
  }, []);

  const fetchConsults = async () => {
    try {
      if (USE_MOCK_DATA) {
        // Mock 데이터 사용
        setConsults(mockConsults);
        setStats({
          total: mockConsults.length,
          answered: mockConsults.filter(c => c.status === 'answered').length,
          pending: mockConsults.filter(c => c.status === 'pending' || c.status === 'reviewing').length
        });
      } else {
        // API 호출
        const token = localStorage.getItem('token');
        const response = await fetch('/api/consult', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });

        if (response.ok) {
          const data = await response.json();
          setConsults(data.data.consults);
          setStats(data.data.stats);
        } else {
          toast.error('상담 목록을 불러오는데 실패했습니다');
        }
      }
    } catch (error) {
      console.error('Error fetching consults:', error);
      toast.error('상담 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (consultId: string) => {
    if (!replyContent.trim()) {
      toast.error('내용을 입력해주세요');
      return;
    }

    try {
      if (USE_MOCK_DATA) {
        // Mock 모드에서는 단순히 성공 메시지만 표시
        toast.success('추가 질문이 등록되었습니다');
      } else {
        // API 호출
        const token = localStorage.getItem('token');
        const response = await fetch('/api/consult/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            consult_id: consultId,
            content: replyContent
          })
        });

        if (response.ok) {
          toast.success('추가 질문이 등록되었습니다');
          fetchConsults(); // 목록 새로고침
        } else {
          toast.error('추가 질문 등록에 실패했습니다');
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('추가 질문 등록에 실패했습니다');
    }

    setReplyContent('');
    setReplyingTo(null);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      received: { variant: 'default' as const, label: '접수', icon: Clock },
      reviewing: { variant: 'warning' as const, label: '검토중', icon: Clock },
      consulting: { variant: 'warning' as const, label: '상담중', icon: MessageSquare },
      completed: { variant: 'success' as const, label: '완료', icon: CheckCircle },
      answered: { variant: 'success' as const, label: '답변완료', icon: CheckCircle }
    };
    
    const { variant, label, icon: Icon } = config[status as keyof typeof config] || 
      { variant: 'default' as const, label: status, icon: AlertCircle };
    
    return (
      <Badge variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">변호사 상담</h1>
            {USE_MOCK_DATA && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                데모 모드
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            전문 변호사가 교권 침해 사건에 대한 법률 자문을 제공합니다
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 상담</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                신고 건수 대비 상담
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">답변 완료</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.answered}</div>
              <p className="text-xs text-muted-foreground">
                24시간 내 답변
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대기중</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                답변 대기중
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Consults List */}
        <div className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground">상담 내역을 불러오는 중...</p>
              </CardContent>
            </Card>
          ) : consults.map((consult) => (
            <Card key={consult.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{consult.report_title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      신고일: {formatDate(consult.incident_date)}
                      <span className="mx-2">·</span>
                      상담일: {formatRelativeTime(consult.created_at)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(consult.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Report Content */}
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">신고 내용</h4>
                  <p className="text-sm text-muted-foreground">
                    {consult.report_content}
                  </p>
                </div>

                {/* Lawyer Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{consult.lawyer.name}</p>
                      <p className="text-xs text-muted-foreground">{consult.lawyer.specialty}</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedConsult(
                      expandedConsult === consult.id ? null : consult.id
                    )}
                  >
                    {expandedConsult === consult.id ? (
                      <>
                        접기 <ChevronUp className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        답변 보기 <ChevronDown className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Consult Content */}
                {expandedConsult === consult.id && (
                  <div className="space-y-4 animate-slide-in">
                    <div className="border-l-4 border-primary pl-4 py-2">
                      <h4 className="font-semibold mb-3">변호사 답변</h4>
                      <div className="prose prose-sm max-w-none text-sm whitespace-pre-line">
                        {consult.consult_content}
                      </div>
                    </div>

                    {/* Reply Section */}
                    <div className="border-t pt-4">
                      {replyingTo === consult.id ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="추가 질문이나 답변을 입력하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={4}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                            >
                              취소
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReply(consult.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              전송
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReplyingTo(consult.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          추가 질문하기
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {!loading && consults.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">상담 내역이 없습니다</h3>
                <p className="text-muted-foreground">
                  신고하신 건에 대해 변호사 답변이 등록되면 여기에 표시됩니다
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-2">법률 상담 안내</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>변호사 답변은 일반적인 법률 정보 제공 목적입니다</li>
                  <li>구체적인 법적 조치는 별도의 상담이 필요할 수 있습니다</li>
                  <li>모든 상담 내용은 비밀이 보장됩니다</li>
                  <li>답변은 통상 24-48시간 내에 제공됩니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}