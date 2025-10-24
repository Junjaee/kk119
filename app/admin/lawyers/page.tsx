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
  Scale,
  User,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Calendar,
  Search,
  Filter,
  MessageSquare,
  Star,
  Activity,
  FileText
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date';
import { useAuth } from '@/lib/hooks/useAuth';
import { roleDisplayNames } from '@/lib/types/user';

interface Lawyer {
  id: string;
  name: string;
  email: string;
  specialization: string[];
  law_firm: string;
  current_cases: number;
  max_cases: number;
  completed_cases: number;
  average_response_time: string;
  satisfaction_rating: number;
  years_experience: number;
  this_month_assignments: number;
  last_month_assignments: number;
  avg_completion_time: string;
  completion_rate: number;
  is_active: boolean;
  last_active: string;
}

interface Assignment {
  id: string;
  report_title: string;
  report_type: string;
  assigned_date: string;
  completed_date?: string;
  status: string;
  priority: number;
  client_name: string;
  notes?: string;
}

interface LawyerWorkloadStats {
  total_lawyers: number;
  active_lawyers: number;
  overloaded_lawyers: number;
  avg_workload_percentage: number;
  total_assignments_this_month: number;
  avg_response_time: string;
}

export default function LawyerManagementPage() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [filterWorkload, setFilterWorkload] = useState('all');
  const [sortBy, setSortBy] = useState('workload');
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // 권한 확인
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <Scale className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
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

  // Load lawyers data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API calls
        // const [lawyersResponse, assignmentsResponse] = await Promise.all([
        //   fetch('/api/admin/lawyers'),
        //   fetch('/api/admin/assignments')
        // ]);

        // Mock data
        const mockLawyers: Lawyer[] = [
          {
            id: 'lawyer-1',
            name: '김민수 변호사',
            email: 'kim@lawfirm.co.kr',
            specialization: ['교육법', '민사소송', '손해배상'],
            law_firm: '한국교육법률사무소',
            current_cases: 12,
            max_cases: 20,
            completed_cases: 87,
            average_response_time: '18시간',
            satisfaction_rating: 4.8,
            years_experience: 8,
            this_month_assignments: 8,
            last_month_assignments: 12,
            avg_completion_time: '3.2일',
            completion_rate: 94.5,
            is_active: true,
            last_active: '2024-09-26T02:30:00Z'
          },
          {
            id: 'lawyer-2',
            name: '이지영 변호사',
            email: 'lee@education-law.kr',
            specialization: ['형사법', '협박죄', '모독죄'],
            law_firm: '교권보호법률센터',
            current_cases: 8,
            max_cases: 15,
            completed_cases: 156,
            average_response_time: '12시간',
            satisfaction_rating: 4.9,
            years_experience: 12,
            this_month_assignments: 15,
            last_month_assignments: 18,
            avg_completion_time: '2.1일',
            completion_rate: 98.2,
            is_active: true,
            last_active: '2024-09-26T01:45:00Z'
          },
          {
            id: 'lawyer-3',
            name: '박철민 변호사',
            email: 'park@legal-support.co.kr',
            specialization: ['민사소송', '정신적 피해', '위자료'],
            law_firm: '교사권익보호센터',
            current_cases: 15,
            max_cases: 18,
            completed_cases: 73,
            average_response_time: '24시간',
            satisfaction_rating: 4.6,
            years_experience: 6,
            this_month_assignments: 6,
            last_month_assignments: 4,
            avg_completion_time: '4.8일',
            completion_rate: 89.7,
            is_active: true,
            last_active: '2024-09-25T15:20:00Z'
          },
          {
            id: 'lawyer-4',
            name: '정수민 변호사',
            email: 'jung@teacher-rights.kr',
            specialization: ['교육법', '학교폭력', '아동복지법'],
            law_firm: '새로운교육법률사무소',
            current_cases: 5,
            max_cases: 12,
            completed_cases: 34,
            average_response_time: '8시간',
            satisfaction_rating: 5.0,
            years_experience: 4,
            this_month_assignments: 12,
            last_month_assignments: 8,
            avg_completion_time: '1.8일',
            completion_rate: 96.8,
            is_active: true,
            last_active: '2024-09-26T04:10:00Z'
          }
        ];

        const mockAssignments: Assignment[] = [
          {
            id: 'assign-1',
            report_title: '학부모 욕설 및 협박',
            report_type: 'threat',
            assigned_date: '2024-09-24T10:00:00Z',
            completed_date: '2024-09-25T16:30:00Z',
            status: 'completed',
            priority: 2,
            client_name: '익명교사123',
            notes: '협박죄 관련 법률 자문 제공 완료'
          },
          {
            id: 'assign-2',
            report_title: '학생 폭력 사건',
            report_type: 'student',
            assigned_date: '2024-09-25T14:20:00Z',
            status: 'in_progress',
            priority: 1,
            client_name: '익명교사456'
          },
          {
            id: 'assign-3',
            report_title: '명예훼손성 발언',
            report_type: 'defamation',
            assigned_date: '2024-09-23T09:15:00Z',
            completed_date: '2024-09-26T11:00:00Z',
            status: 'completed',
            priority: 3,
            client_name: '익명교사789',
            notes: '민사소송 및 형사고발 절차 안내 완료'
          }
        ];

        setLawyers(mockLawyers);
        setAssignments(mockAssignments);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate stats
  const stats: LawyerWorkloadStats = useMemo(() => {
    const totalLawyers = lawyers.length;
    const activeLawyers = lawyers.filter(l => l.is_active).length;
    const overloadedLawyers = lawyers.filter(l => (l.current_cases / l.max_cases) >= 0.8).length;
    const avgWorkloadPercentage = lawyers.reduce((sum, l) => sum + (l.current_cases / l.max_cases) * 100, 0) / totalLawyers;
    const totalAssignmentsThisMonth = lawyers.reduce((sum, l) => sum + l.this_month_assignments, 0);

    // Calculate average response time
    const avgResponseHours = lawyers.reduce((sum, l) => {
      const hours = parseInt(l.average_response_time.replace('시간', ''));
      return sum + hours;
    }, 0) / totalLawyers;

    return {
      total_lawyers: totalLawyers,
      active_lawyers: activeLawyers,
      overloaded_lawyers: overloadedLawyers,
      avg_workload_percentage: avgWorkloadPercentage,
      total_assignments_this_month: totalAssignmentsThisMonth,
      avg_response_time: `${Math.round(avgResponseHours)}시간`
    };
  }, [lawyers]);

  // Get unique specializations
  const allSpecializations = useMemo(() => {
    const specs = new Set<string>();
    lawyers.forEach(lawyer => {
      lawyer.specialization.forEach(spec => specs.add(spec));
    });
    return Array.from(specs).sort();
  }, [lawyers]);

  // Filter and sort lawyers
  const filteredAndSortedLawyers = useMemo(() => {
    let filtered = lawyers.filter(lawyer => {
      const matchesSearch = lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lawyer.law_firm.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpecialization = filterSpecialization === 'all' ||
                                   lawyer.specialization.includes(filterSpecialization);

      const workloadPercentage = (lawyer.current_cases / lawyer.max_cases) * 100;
      const matchesWorkload = filterWorkload === 'all' ||
                             (filterWorkload === 'light' && workloadPercentage < 50) ||
                             (filterWorkload === 'moderate' && workloadPercentage >= 50 && workloadPercentage < 80) ||
                             (filterWorkload === 'heavy' && workloadPercentage >= 80);

      return matchesSearch && matchesSpecialization && matchesWorkload;
    });

    // Sort lawyers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'workload':
          return (b.current_cases / b.max_cases) - (a.current_cases / a.max_cases);
        case 'assignments':
          return b.this_month_assignments - a.this_month_assignments;
        case 'rating':
          return b.satisfaction_rating - a.satisfaction_rating;
        case 'completion_rate':
          return b.completion_rate - a.completion_rate;
        case 'response_time':
          const aHours = parseInt(a.average_response_time.replace('시간', ''));
          const bHours = parseInt(b.average_response_time.replace('시간', ''));
          return aHours - bHours;
        default:
          return 0;
      }
    });

    return filtered;
  }, [lawyers, searchTerm, filterSpecialization, filterWorkload, sortBy]);

  const getWorkloadStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return { label: '과부하', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage >= 80) return { label: '매우 바쁨', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (percentage >= 60) return { label: '바쁨', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (percentage >= 40) return { label: '보통', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    return { label: '여유있음', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const getAssignmentTrend = (thisMonth: number, lastMonth: number) => {
    if (thisMonth > lastMonth) {
      return { icon: TrendingUp, color: 'text-green-600', text: '증가' };
    } else if (thisMonth < lastMonth) {
      return { icon: TrendingDown, color: 'text-red-600', text: '감소' };
    }
    return { icon: Activity, color: 'text-gray-600', text: '유지' };
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
            <h1 className="text-3xl font-bold">변호사 업무량 관리</h1>
            <p className="text-muted-foreground mt-2">
              변호사별 업무 현황과 배정 이력을 관리합니다
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 변호사</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_lawyers}</div>
              <p className="text-xs text-muted-foreground">
                활성: {stats.active_lawyers}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">과부하 변호사</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overloaded_lawyers}</div>
              <p className="text-xs text-muted-foreground">
                80% 이상 업무량
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 업무량</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.avg_workload_percentage)}%</div>
              <p className="text-xs text-muted-foreground">
                전체 변호사 평균
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이번 달 배정</CardTitle>
              <FileText className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_assignments_this_month}</div>
              <p className="text-xs text-muted-foreground">
                총 배정 건수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_response_time}</div>
              <p className="text-xs text-muted-foreground">
                변호사 평균
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">정상</div>
              <p className="text-xs text-muted-foreground">
                운영중
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">업무량 현황</TabsTrigger>
            <TabsTrigger value="assignments">배정 이력</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  필터 및 정렬
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="변호사명, 로펌명 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                    <SelectTrigger>
                      <SelectValue placeholder="전문분야" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 전문분야</SelectItem>
                      {allSpecializations.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterWorkload} onValueChange={setFilterWorkload}>
                    <SelectTrigger>
                      <SelectValue placeholder="업무량" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모든 상태</SelectItem>
                      <SelectItem value="light">여유있음 (50% 미만)</SelectItem>
                      <SelectItem value="moderate">보통 (50-80%)</SelectItem>
                      <SelectItem value="heavy">바쁨 (80% 이상)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="정렬 기준" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workload">업무량 순</SelectItem>
                      <SelectItem value="assignments">배정수 순</SelectItem>
                      <SelectItem value="rating">평점 순</SelectItem>
                      <SelectItem value="completion_rate">완료율 순</SelectItem>
                      <SelectItem value="response_time">응답속도 순</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-sm text-muted-foreground flex items-center">
                    {filteredAndSortedLawyers.length}명 조회됨
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lawyers Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedLawyers.map((lawyer) => {
                const workloadPercentage = (lawyer.current_cases / lawyer.max_cases) * 100;
                const workloadStatus = getWorkloadStatus(lawyer.current_cases, lawyer.max_cases);
                const assignmentTrend = getAssignmentTrend(lawyer.this_month_assignments, lawyer.last_month_assignments);
                const TrendIcon = assignmentTrend.icon;

                return (
                  <Card key={lawyer.id} className={`hover:shadow-lg transition-shadow ${workloadStatus.bgColor}`}>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-1">{lawyer.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {lawyer.law_firm}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{lawyer.satisfaction_rating}</span>
                          </div>
                          <Badge variant="outline" className={`text-xs ${workloadStatus.color}`}>
                            {workloadStatus.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Specializations */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {lawyer.specialization.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {lawyer.specialization.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{lawyer.specialization.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Workload Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>현재 업무량</span>
                          <span className="font-medium">
                            {lawyer.current_cases}/{lawyer.max_cases}건 ({Math.round(workloadPercentage)}%)
                          </span>
                        </div>
                        <Progress
                          value={workloadPercentage}
                          className={`h-2 ${
                            workloadPercentage >= 90
                              ? '[&>div]:bg-red-500'
                              : workloadPercentage >= 80
                              ? '[&>div]:bg-yellow-500'
                              : '[&>div]:bg-green-500'
                          }`}
                        />
                      </div>

                      {/* Statistics */}
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">이번 달 배정</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lawyer.this_month_assignments}건</span>
                            <TrendIcon className={`h-4 w-4 ${assignmentTrend.color}`} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">완료율</span>
                          <span className="font-medium">{lawyer.completion_rate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">평균 응답</span>
                          <span className="font-medium">{lawyer.average_response_time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">마지막 활동</span>
                          <span className="font-medium">{formatRelativeTime(lawyer.last_active)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>배정 이력</CardTitle>
                <CardDescription>
                  최근 변호사 배정 이력을 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>신고 제목</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>배정일</TableHead>
                      <TableHead>완료일</TableHead>
                      <TableHead>우선순위</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>신고자</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {assignment.report_title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTypeLabel(assignment.report_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(assignment.assigned_date)}
                        </TableCell>
                        <TableCell>
                          {assignment.completed_date ? formatDate(assignment.completed_date) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.priority <= 2 ? 'destructive' : 'default'}>
                            {assignment.priority === 1 ? '긴급' : assignment.priority === 2 ? '높음' : '보통'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.status === 'completed' ? 'success' : 'default'}>
                            {assignment.status === 'completed' ? '완료' : '진행중'}
                          </Badge>
                        </TableCell>
                        <TableCell>{assignment.client_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}