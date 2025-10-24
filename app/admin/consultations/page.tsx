'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  User,
  FileText,
  Calendar,
  Search,
  Filter,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Target,
  Award,
  Scale
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useAuth } from '@/lib/hooks/useAuth';
import { roleDisplayNames } from '@/lib/types/user';

interface Consultation {
  id: string;
  report_title: string;
  report_type: string;
  client_name: string;
  lawyer_name: string;
  lawyer_specialization: string[];
  assigned_date: string;
  first_response_date?: string;
  last_activity_date?: string;
  completed_date?: string;
  status: 'assigned' | 'contacted' | 'in_progress' | 'completed' | 'delayed' | 'escalated';
  priority: number;
  response_time_hours?: number;
  consultation_notes?: string;
  client_satisfaction?: number;
  stage: 'initial' | 'information_gathering' | 'analysis' | 'resolution' | 'follow_up' | 'completed';
  is_delayed: boolean;
  escalated_to?: string;
  next_action?: string;
  estimated_completion?: string;
}

interface ConsultationStats {
  total_active: number;
  completed_this_month: number;
  delayed_cases: number;
  avg_response_time: number;
  avg_satisfaction: number;
  completion_rate: number;
  stage_breakdown: Record<string, number>;
  lawyer_performance: {
    lawyer_name: string;
    active_cases: number;
    avg_response_time: number;
    completion_rate: number;
    satisfaction_rating: number;
  }[];
}

const CONSULTATION_STAGES = {
  initial: { label: '초기 접수', color: 'bg-gray-500', order: 1 },
  information_gathering: { label: '정보 수집', color: 'bg-blue-500', order: 2 },
  analysis: { label: '사건 분석', color: 'bg-yellow-500', order: 3 },
  resolution: { label: '해결 진행', color: 'bg-orange-500', order: 4 },
  follow_up: { label: '후속 조치', color: 'bg-purple-500', order: 5 },
  completed: { label: '완료', color: 'bg-green-500', order: 6 }
};

export default function ConsultationMonitoringPage() {
  const { profile } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLawyer, setFilterLawyer] = useState('all');
  const [filterDelayed, setFilterDelayed] = useState(false);
  const [sortBy, setSortBy] = useState('assigned_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 권한 확인
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
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

  // Load consultation data
  useEffect(() => {
    loadConsultationData();
  }, []);

  const loadConsultationData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API calls
      // const response = await fetch('/api/admin/consultations');

      // Mock data
      const mockConsultations: Consultation[] = [
        {
          id: 'cons-1',
          report_title: '학부모 욕설 및 협박',
          report_type: 'threat',
          client_name: '익명교사123',
          lawyer_name: '김민수 변호사',
          lawyer_specialization: ['교육법', '민사소송'],
          assigned_date: '2024-09-24T10:00:00Z',
          first_response_date: '2024-09-24T12:30:00Z',
          last_activity_date: '2024-09-26T09:15:00Z',
          status: 'in_progress',
          priority: 2,
          response_time_hours: 2.5,
          stage: 'analysis',
          is_delayed: false,
          next_action: '법적 조치 방안 검토',
          estimated_completion: '2024-09-28T18:00:00Z'
        },
        {
          id: 'cons-2',
          report_title: '학생 폭력 사건',
          report_type: 'student',
          client_name: '익명교사456',
          lawyer_name: '이지영 변호사',
          lawyer_specialization: ['형사법', '학교폭력'],
          assigned_date: '2024-09-25T14:20:00Z',
          first_response_date: '2024-09-25T15:45:00Z',
          last_activity_date: '2024-09-25T16:30:00Z',
          status: 'contacted',
          priority: 1,
          response_time_hours: 1.4,
          stage: 'information_gathering',
          is_delayed: false,
          next_action: '추가 증거 자료 요청',
          estimated_completion: '2024-09-30T12:00:00Z'
        },
        {
          id: 'cons-3',
          report_title: '명예훼손성 발언',
          report_type: 'defamation',
          client_name: '익명교사789',
          lawyer_name: '박철민 변호사',
          lawyer_specialization: ['민사소송', '명예훼손'],
          assigned_date: '2024-09-20T09:15:00Z',
          first_response_date: '2024-09-21T16:20:00Z',
          last_activity_date: '2024-09-21T16:20:00Z',
          status: 'delayed',
          priority: 3,
          response_time_hours: 31.1,
          stage: 'initial',
          is_delayed: true,
          next_action: '변호사 응답 촉구 필요'
        },
        {
          id: 'cons-4',
          report_title: '성희롱 사건 상담',
          report_type: 'harassment',
          client_name: '익명교사012',
          lawyer_name: '정수민 변호사',
          lawyer_specialization: ['성범죄', '교육법'],
          assigned_date: '2024-09-18T11:00:00Z',
          first_response_date: '2024-09-18T12:30:00Z',
          last_activity_date: '2024-09-25T14:45:00Z',
          completed_date: '2024-09-25T14:45:00Z',
          status: 'completed',
          priority: 1,
          response_time_hours: 1.5,
          stage: 'completed',
          is_delayed: false,
          client_satisfaction: 4.8,
          consultation_notes: '성공적으로 해결 완료. 고객 만족도 높음.'
        }
      ];

      const mockStats: ConsultationStats = {
        total_active: 3,
        completed_this_month: 12,
        delayed_cases: 1,
        avg_response_time: 8.6,
        avg_satisfaction: 4.7,
        completion_rate: 92.3,
        stage_breakdown: {
          initial: 1,
          information_gathering: 1,
          analysis: 1,
          resolution: 0,
          follow_up: 0,
          completed: 12
        },
        lawyer_performance: [
          {
            lawyer_name: '김민수 변호사',
            active_cases: 1,
            avg_response_time: 2.5,
            completion_rate: 95.2,
            satisfaction_rating: 4.8
          },
          {
            lawyer_name: '이지영 변호사',
            active_cases: 1,
            avg_response_time: 1.4,
            completion_rate: 98.1,
            satisfaction_rating: 4.9
          },
          {
            lawyer_name: '박철민 변호사',
            active_cases: 1,
            avg_response_time: 31.1,
            completion_rate: 85.3,
            satisfaction_rating: 4.2
          }
        ]
      };

      setConsultations(mockConsultations);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading consultation data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique lawyers
  const allLawyers = useMemo(() => {
    const lawyers = new Set(consultations.map(c => c.lawyer_name));
    return Array.from(lawyers).sort();
  }, [consultations]);

  // Filter and sort consultations
  const filteredAndSortedConsultations = useMemo(() => {
    let filtered = consultations.filter(consultation => {
      const matchesSearch = consultation.report_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           consultation.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           consultation.lawyer_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || consultation.status === filterStatus;
      const matchesLawyer = filterLawyer === 'all' || consultation.lawyer_name === filterLawyer;
      const matchesDelayed = !filterDelayed || consultation.is_delayed;

      return matchesSearch && matchesStatus && matchesLawyer && matchesDelayed;
    });

    // Sort consultations
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'assigned_date':
          aValue = new Date(a.assigned_date).getTime();
          bValue = new Date(b.assigned_date).getTime();
          break;
        case 'response_time':
          aValue = a.response_time_hours || Infinity;
          bValue = b.response_time_hours || Infinity;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'stage':
          aValue = CONSULTATION_STAGES[a.stage].order;
          bValue = CONSULTATION_STAGES[b.stage].order;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [consultations, searchTerm, filterStatus, filterLawyer, filterDelayed, sortBy, sortOrder]);

  const getStatusBadge = (status: string, isDelayed: boolean) => {
    if (isDelayed) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          지연
        </Badge>
      );
    }

    switch (status) {
      case 'assigned':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            배정됨
          </Badge>
        );
      case 'contacted':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            연락됨
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            진행중
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            완료
          </Badge>
        );
      case 'escalated':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            에스컬레이션
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStageBadge = (stage: string) => {
    const stageInfo = CONSULTATION_STAGES[stage as keyof typeof CONSULTATION_STAGES];
    if (!stageInfo) return null;

    return (
      <Badge variant="outline" className="text-xs">
        {stageInfo.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: number) => {
    const config = {
      1: { variant: 'destructive' as const, label: '긴급' },
      2: { variant: 'warning' as const, label: '높음' },
      3: { variant: 'default' as const, label: '보통' },
      4: { variant: 'secondary' as const, label: '낮음' }
    };

    const { variant, label } = config[priority as keyof typeof config] || { variant: 'default' as const, label: '보통' };

    return <Badge variant={variant} className="text-xs">{label}</Badge>;
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">상담 진행 모니터링</h1>
            <p className="text-muted-foreground mt-2">
              변호사 상담 진행 상황을 실시간으로 모니터링합니다
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">활성 상담</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_active}</div>
                <p className="text-xs text-muted-foreground">
                  현재 진행중
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번달 완료</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.completed_this_month}</div>
                <p className="text-xs text-muted-foreground">
                  완료된 상담
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">지연 케이스</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.delayed_cases}</div>
                <p className="text-xs text-muted-foreground">
                  지연되고 있는 상담
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_response_time}h</div>
                <p className="text-xs text-muted-foreground">
                  첫 응답까지
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">만족도</CardTitle>
                <Award className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_satisfaction}/5.0</div>
                <p className="text-xs text-muted-foreground">
                  평균 고객 만족도
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">완료율</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completion_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  성공 완료율
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="consultations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="consultations">상담 현황</TabsTrigger>
            <TabsTrigger value="performance">성과 분석</TabsTrigger>
          </TabsList>

          <TabsContent value="consultations" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  필터 및 정렬
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="제목, 고객명, 변호사명 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 상태</SelectItem>
                      <SelectItem value="assigned">배정됨</SelectItem>
                      <SelectItem value="contacted">연락됨</SelectItem>
                      <SelectItem value="in_progress">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                      <SelectItem value="delayed">지연</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterLawyer} onValueChange={setFilterLawyer}>
                    <SelectTrigger>
                      <SelectValue placeholder="변호사" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 변호사</SelectItem>
                      {allLawyers.map(lawyer => (
                        <SelectItem key={lawyer} value={lawyer}>{lawyer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="정렬 기준" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned_date">배정일</SelectItem>
                      <SelectItem value="response_time">응답시간</SelectItem>
                      <SelectItem value="priority">우선순위</SelectItem>
                      <SelectItem value="stage">진행 단계</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? (
                      <>
                        <ArrowUp className="h-4 w-4 mr-2" />
                        오름차순
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4 mr-2" />
                        내림차순
                      </>
                    )}
                  </Button>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="delayed-only"
                      checked={filterDelayed}
                      onChange={(e) => setFilterDelayed(e.target.checked)}
                    />
                    <label htmlFor="delayed-only" className="text-sm">
                      지연 케이스만
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultations Table */}
            <Card>
              <CardHeader>
                <CardTitle>상담 진행 현황</CardTitle>
                <CardDescription>
                  현재 진행중인 상담과 완료된 상담을 관리합니다 ({filteredAndSortedConsultations.length}건)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>신고 제목</TableHead>
                      <TableHead>고객</TableHead>
                      <TableHead>변호사</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>진행 단계</TableHead>
                      <TableHead>우선순위</TableHead>
                      <TableHead>응답시간</TableHead>
                      <TableHead>배정일</TableHead>
                      <TableHead>다음 액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedConsultations.map((consultation) => (
                      <TableRow key={consultation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{consultation.report_title}</div>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {getTypeLabel(consultation.report_type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{consultation.client_name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{consultation.lawyer_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {consultation.lawyer_specialization.join(', ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(consultation.status, consultation.is_delayed)}
                        </TableCell>
                        <TableCell>
                          {getStageBadge(consultation.stage)}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(consultation.priority)}
                        </TableCell>
                        <TableCell>
                          {consultation.response_time_hours ? (
                            <span className={consultation.response_time_hours > 24 ? 'text-destructive' : 'text-success'}>
                              {consultation.response_time_hours}h
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatRelativeTime(consultation.assigned_date)}
                        </TableCell>
                        <TableCell className="max-w-40">
                          {consultation.next_action && (
                            <div className="text-xs text-muted-foreground truncate">
                              {consultation.next_action}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredAndSortedConsultations.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">상담이 없습니다</h3>
                    <p className="text-muted-foreground">
                      조건에 맞는 상담이 없습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Lawyer Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    변호사별 성과
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.lawyer_performance.map((lawyer, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{lawyer.lawyer_name}</h4>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-warning" />
                            <span className="font-medium">{lawyer.satisfaction_rating}</span>
                          </div>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">활성 케이스:</span>
                            <span>{lawyer.active_cases}건</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">평균 응답시간:</span>
                            <span className={lawyer.avg_response_time > 24 ? 'text-destructive' : 'text-success'}>
                              {lawyer.avg_response_time}h
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">완료율:</span>
                            <span>{lawyer.completion_rate}%</span>
                          </div>
                          <div className="mt-2">
                            <Progress value={lawyer.completion_rate} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stage Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    단계별 분포
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats && Object.entries(stats.stage_breakdown).map(([stage, count]) => {
                      const stageInfo = CONSULTATION_STAGES[stage as keyof typeof CONSULTATION_STAGES];
                      if (!stageInfo) return null;

                      return (
                        <div key={stage} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${stageInfo.color}`} />
                            <span className="font-medium">{stageInfo.label}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{count}건</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((count / (stats.total_active + stats.completed_this_month)) * 100)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}