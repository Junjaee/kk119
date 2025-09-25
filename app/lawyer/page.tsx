'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  User,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Scale,
  Shield
} from 'lucide-react';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/utils/date';
import { useStore } from '@/lib/store';
import { switchUser } from '@/lib/auth/mock-auth';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Consult {
  id: number;
  title: string;
  report_type: string;
  incident_date: string;
  report_content: string;
  created_at: string;
  status?: string;
  user_nickname?: string;
  claimed_at?: string;
  answered_at?: string;
  days_ago?: number;
}

export default function LawyerDashboard() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [activeTab, setActiveTab] = useState('available');
  const [availableConsults, setAvailableConsults] = useState<Consult[]>([]);
  const [myConsults, setMyConsults] = useState<Consult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsult, setSelectedConsult] = useState<Consult | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [myTypeFilter, setMyTypeFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  // 통계
  const [stats, setStats] = useState({
    available: 0,
    pending: 0,
    answered: 0,
    followUp: 0
  });

  // 변호사 계정으로 전환
  useEffect(() => {
    if (user?.role !== 'lawyer') {
      const lawyerUser = switchUser('lawyer');
      setUser(lawyerUser);
    }
  }, [user?.role, setUser]);

  // 데이터 페칭
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 미담당 상담 목록
      const availableResponse = await fetch('/api/consult/available');
      const availableData = await availableResponse.json();

      if (availableData.success) {
        setAvailableConsults(availableData.data.consults);
      }

      // 내 담당 상담 목록
      const lawyerId = 1; // TODO: 실제 변호사 ID 사용
      const myResponse = await fetch(`/api/lawyer/cases?lawyer_id=${lawyerId}`);
      const myData = await myResponse.json();

      if (myData.success) {
        setMyConsults(myData.data);

        // 통계 계산
        const available = availableData.data.consults.length;
        const pending = myData.data.filter((c: any) =>
          c.status === 'pending' || c.status === 'reviewing'
        ).length;
        const answered = myData.data.filter((c: any) =>
          c.status === 'answered'
        ).length;
        const followUp = myData.data.filter((c: any) =>
          c.status === 'follow_up'
        ).length;

        setStats({ available, pending, answered, followUp });
      }
    } catch (error) {
      console.error('Data fetch error:', error);
      toast.error('데이터를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimConsult = async () => {
    if (!selectedConsult) return;

    setClaiming(true);
    try {
      const response = await fetch('/api/consult/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultId: selectedConsult.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('상담 담당이 확정되었습니다');
        setSelectedConsult(null);
        fetchData(); // 목록 새로고침
        setActiveTab('my'); // 내 담당 탭으로 전환
      } else if (data.error === 'ALREADY_CLAIMED') {
        toast.error('이미 다른 변호사가 담당중입니다');
        fetchData();
      } else {
        toast.error(data.message || '오류가 발생했습니다');
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('담당 신청 중 오류가 발생했습니다');
    } finally {
      setClaiming(false);
      setSelectedConsult(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      verbal: '학부모 민원',
      violence: '학생 폭력',
      sexual: '욕설 및 폭언',
      defamation: '명예훼손',
      harassment: '성희롱',
      threat: '협박',
      other: '기타'
    };
    return types[type as keyof typeof types] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">대기중</Badge>;
      case 'reviewing':
        return <Badge variant="warning">답변대기</Badge>;
      case 'answered':
        return <Badge className="bg-green-500">답변완료</Badge>;
      case 'follow_up':
        return <Badge className="bg-orange-500">추가답변</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">종료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFilteredAvailable = () => {
    if (typeFilter === 'all') return availableConsults;
    return availableConsults.filter(c => c.report_type === typeFilter);
  };

  const getFilteredMyConsults = () => {
    if (myTypeFilter === 'all') return myConsults;
    return myConsults.filter(c => c.report_type === myTypeFilter);
  };

  // 상태별 상담 필터링
  const getPendingConsults = () => {
    const filtered = myConsults.filter(c => c.status === 'pending' || c.status === 'reviewing');
    if (myTypeFilter === 'all') return filtered;
    return filtered.filter(c => c.report_type === myTypeFilter);
  };

  const getCompletedConsults = () => {
    const filtered = myConsults.filter(c => c.status === 'answered');
    if (myTypeFilter === 'all') return filtered;
    return filtered.filter(c => c.report_type === myTypeFilter);
  };

  const getFollowUpConsults = () => {
    const filtered = myConsults.filter(c => c.status === 'follow_up');
    if (myTypeFilter === 'all') return filtered;
    return filtered.filter(c => c.report_type === myTypeFilter);
  };

  const toggleCardExpansion = (consultId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(consultId)) {
      newExpanded.delete(consultId);
    } else {
      newExpanded.add(consultId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">변호사 상담 센터</h1>
            <p className="text-muted-foreground mt-2">
              교권 침해 사건에 대한 법률 자문을 제공하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              법률 자문 서비스
            </span>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
              activeTab === 'available' ? 'ring-2 ring-orange-500 bg-orange-50/50' : 'hover:scale-[1.02]'
            }`}
            onClick={() => {
              setActiveTab('available');
              setTypeFilter('all');
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">미배정 상담</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.available}</div>
              <p className="text-xs text-muted-foreground">
                선택 가능한 상담
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
              activeTab === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50/50' : 'hover:scale-[1.02]'
            }`}
            onClick={() => {
              setActiveTab('pending');
              setMyTypeFilter('all');
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">답변 대기</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                답변이 필요한 상담
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
              activeTab === 'answered' ? 'ring-2 ring-green-500 bg-green-50/50' : 'hover:scale-[1.02]'
            }`}
            onClick={() => {
              setActiveTab('answered');
              setMyTypeFilter('all');
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">답변 완료</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
              <p className="text-xs text-muted-foreground">
                처리 완료
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
              activeTab === 'follow_up' ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'hover:scale-[1.02]'
            }`}
            onClick={() => {
              setActiveTab('follow_up');
              setMyTypeFilter('all');
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">추가 질문</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.followUp}</div>
              <p className="text-xs text-muted-foreground">
                재답변 필요
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 버튼 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {activeTab === 'available' && '미배정 상담'}
              {activeTab === 'pending' && '답변 대기'}
              {activeTab === 'answered' && '답변 완료'}
              {activeTab === 'follow_up' && '추가 질문'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'available' && '선택 가능한 상담을 확인하세요'}
              {activeTab === 'pending' && '답변이 필요한 상담입니다'}
              {activeTab === 'answered' && '완료된 상담 내역입니다'}
              {activeTab === 'follow_up' && '추가 답변이 필요한 상담입니다'}
            </p>
          </div>

          <div className="flex gap-2">
            {['all', 'verbal', 'violence', 'sexual', 'defamation', 'harassment', 'threat', 'other'].map((type) => (
              <Button
                key={type}
                size="sm"
                variant={
                  activeTab === 'available'
                    ? (typeFilter === type ? 'default' : 'outline')
                    : (myTypeFilter === type ? 'default' : 'outline')
                }
                onClick={() =>
                  activeTab === 'available'
                    ? setTypeFilter(type)
                    : setMyTypeFilter(type)
                }
              >
                {type === 'all' ? '전체' : getTypeLabel(type)}
              </Button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        {activeTab === 'available' && (
          <div className="space-y-4">
              {getFilteredAvailable().length > 0 ? (
                getFilteredAvailable().map((consult) => (
                  <Card key={consult.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-10 px-8 pb-8">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">{consult.title}</h3>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline">
                                {getTypeLabel(consult.report_type)}
                              </Badge>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                사건일시: {formatDateTime(consult.incident_date)}
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                접수일시: {formatDateTime(consult.created_at)}
                              </span>
                            </div>
                          </div>

                          <div
                            onClick={() => toggleCardExpansion(consult.id)}
                            className="cursor-pointer hover:bg-accent/20 -mx-2 px-2 py-2 rounded-lg transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm text-muted-foreground leading-relaxed flex-1 ${
                                expandedCards.has(consult.id) ? '' : 'line-clamp-2'
                              }`}>
                                {consult.report_content}
                              </p>
                              <div className="flex-shrink-0 p-1 bg-accent/50 hover:bg-accent rounded-md transition-colors">
                                {expandedCards.has(consult.id) ? (
                                  <ChevronUp className="h-4 w-4 text-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => setSelectedConsult(consult)}
                        >
                          담당하기
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-0 pt-24 pb-24 flex flex-col items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <p className="text-muted-foreground">
                      현재 미담당 상담이 없습니다
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
              {getPendingConsults().length > 0 ? (
                getPendingConsults().map((consult) => (
                  <Card key={consult.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-10 px-8 pb-8">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{consult.title}</h3>
                            {getStatusBadge(consult.status || 'pending')}
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            <Badge variant="outline">
                              {getTypeLabel(consult.report_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {consult.user_nickname}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">사건일시:</span> {formatDateTime(consult.incident_date)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">접수일시:</span> {formatDateTime(consult.created_at)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">담당일시:</span> {formatDateTime(consult.claimed_at)}
                            </span>
                            {consult.answered_at && (
                              <span className="text-sm text-muted-foreground">
                                <span className="text-green-600">답변일시:</span> {formatDateTime(consult.answered_at)}
                              </span>
                            )}
                          </div>

                          <div
                            onClick={() => toggleCardExpansion(consult.id)}
                            className="cursor-pointer hover:bg-accent/20 -mx-2 px-2 py-2 rounded-lg transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm text-muted-foreground leading-relaxed flex-1 ${
                                expandedCards.has(consult.id) ? '' : 'line-clamp-2'
                              }`}>
                                {consult.report_content}
                              </p>
                              <div className="flex-shrink-0 p-1 bg-accent/50 hover:bg-accent rounded-md transition-colors">
                                {expandedCards.has(consult.id) ? (
                                  <ChevronUp className="h-4 w-4 text-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link href={`/lawyer/consult/${consult.uuid}`}>
                            <Button size="sm">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              {consult.status === 'reviewing' ? '답변하기' :
                               consult.status === 'follow_up' ? '추가답변' :
                               consult.status === 'completed' ? '상세보기' : '답변보기'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-0 pt-24 pb-24 flex flex-col items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      답변 대기 중인 상담이 없습니다
                    </p>
                    <Button
                      onClick={() => setActiveTab('available')}
                    >
                      상담 선택하기
                    </Button>
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {activeTab === 'answered' && (
          <div className="space-y-4">
              {getCompletedConsults().length > 0 ? (
                getCompletedConsults().map((consult) => (
                  <Card key={consult.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-10 px-8 pb-8">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{consult.title}</h3>
                            {getStatusBadge(consult.status || 'pending')}
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            <Badge variant="outline">
                              {getTypeLabel(consult.report_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {consult.user_nickname}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">사건일시:</span> {formatDateTime(consult.incident_date)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">접수일시:</span> {formatDateTime(consult.created_at)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">담당일시:</span> {formatDateTime(consult.claimed_at)}
                            </span>
                            {consult.answered_at && (
                              <span className="text-sm text-muted-foreground">
                                <span className="text-green-600">답변일시:</span> {formatDateTime(consult.answered_at)}
                              </span>
                            )}
                          </div>

                          <div
                            onClick={() => toggleCardExpansion(consult.id)}
                            className="cursor-pointer hover:bg-accent/20 -mx-2 px-2 py-2 rounded-lg transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm text-muted-foreground leading-relaxed flex-1 ${
                                expandedCards.has(consult.id) ? '' : 'line-clamp-2'
                              }`}>
                                {consult.report_content}
                              </p>
                              <div className="flex-shrink-0 p-1 bg-accent/50 hover:bg-accent rounded-md transition-colors">
                                {expandedCards.has(consult.id) ? (
                                  <ChevronUp className="h-4 w-4 text-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link href={`/lawyer/consult/${consult.uuid}`}>
                            <Button size="sm">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              상세보기
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-0 pt-24 pb-24 flex flex-col items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      완료된 상담이 없습니다
                    </p>
                    <Button
                      onClick={() => setActiveTab('available')}
                    >
                      상담 선택하기
                    </Button>
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {activeTab === 'follow_up' && (
          <div className="space-y-4">
              {getFollowUpConsults().length > 0 ? (
                getFollowUpConsults().map((consult) => (
                  <Card key={consult.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-10 px-8 pb-8">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{consult.title}</h3>
                            {getStatusBadge(consult.status || 'pending')}
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            <Badge variant="outline">
                              {getTypeLabel(consult.report_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {consult.user_nickname}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">사건일시:</span> {formatDateTime(consult.incident_date)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">접수일시:</span> {formatDateTime(consult.created_at)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              <span className="text-blue-600">담당일시:</span> {formatDateTime(consult.claimed_at)}
                            </span>
                            {consult.answered_at && (
                              <span className="text-sm text-muted-foreground">
                                <span className="text-green-600">답변일시:</span> {formatDateTime(consult.answered_at)}
                              </span>
                            )}
                          </div>

                          <div
                            onClick={() => toggleCardExpansion(consult.id)}
                            className="cursor-pointer hover:bg-accent/20 -mx-2 px-2 py-2 rounded-lg transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm text-muted-foreground leading-relaxed flex-1 ${
                                expandedCards.has(consult.id) ? '' : 'line-clamp-2'
                              }`}>
                                {consult.report_content}
                              </p>
                              <div className="flex-shrink-0 p-1 bg-accent/50 hover:bg-accent rounded-md transition-colors">
                                {expandedCards.has(consult.id) ? (
                                  <ChevronUp className="h-4 w-4 text-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link href={`/lawyer/consult/${consult.uuid}`}>
                            <Button size="sm">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              추가답변
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-0 pt-24 pb-24 flex flex-col items-center justify-center">
                    <MessageSquare className="h-12 w-12 text-blue-500 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      추가 질문이 없습니다
                    </p>
                    <Button
                      onClick={() => setActiveTab('available')}
                    >
                      상담 선택하기
                    </Button>
                  </CardContent>
                </Card>
              )}
          </div>
        )}

        {/* 담당 확인 다이얼로그 */}
        <AlertDialog open={!!selectedConsult} onOpenChange={() => setSelectedConsult(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>상담 담당 확인</AlertDialogTitle>
              <AlertDialogDescription>
                이 상담을 담당하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              {selectedConsult && (
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="font-semibold mb-1">{selectedConsult.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {getTypeLabel(selectedConsult.report_type)} · {formatDate(selectedConsult.incident_date)}
                    </p>
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <p>• 담당 확정 후 취소 불가</p>
                    <p>• 48시간 내 초기 답변 권장</p>
                  </div>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={claiming}>
                아니오
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClaimConsult}
                disabled={claiming}
              >
                {claiming ? '처리중...' : '예'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}